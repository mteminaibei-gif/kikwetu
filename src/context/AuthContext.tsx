'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient, type SupabaseClient } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Offline } from '@/lib/offline';
import { logger } from '@/lib/logger';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  supabase: SupabaseClient | null;
  /** True when signup succeeded but email is not confirmed yet */
  needsEmailVerification: boolean;
  pendingEmail: string | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata: Partial<Profile>) => Promise<{ error?: string; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  resendVerification: (email?: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAdmin: false,
    supabase: null,
    needsEmailVerification: false,
    pendingEmail: null,
  });

  const supabase = useCallback(() => {
    const sb = createClient();
    setState(prev => ({ ...prev, supabase: sb }));
    return sb;
  }, []);

  const loadProfile = useCallback(async (sb: SupabaseClient, userId: string) => {
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      logger.mutationError('loadProfile', error, { userId });
    }
    if (data) {
      await Offline.cacheProfile(data as Profile);
      setState(prev => ({
        ...prev,
        user: data as Profile,
        isAdmin: (data as Profile).role === 'admin',
        loading: false,
        needsEmailVerification: false,
        pendingEmail: null,
      }));
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Block unverified email sessions if confirmations are enabled
        if (session.user.email && session.user.email_confirmed_at == null && session.user.identities?.every(i => i.provider === 'email')) {
          // Some projects allow session before confirm — still flag UI
          setState(prev => ({
            ...prev,
            loading: false,
            needsEmailVerification: !session.user.email_confirmed_at,
            pendingEmail: session.user.email ?? null,
          }));
        }
        loadProfile(sb, session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        loadProfile(sb, session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          loading: false,
          isAdmin: false,
          supabase: sb,
          needsEmailVerification: false,
          pendingEmail: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  const signUp = async (
    email: string,
    password: string,
    metadata: Partial<Profile>
  ): Promise<{ error?: string; needsVerification?: boolean }> => {
    const sb = state.supabase || createClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: metadata as Record<string, unknown>,
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/feed`
          : undefined,
      },
    });
    if (error) {
      logger.mutationError('signUp', error, { email });
      return { error: error.message };
    }
    if (data.user) {
      const { error: profileError } = await sb.from('profiles').upsert({
        id: data.user.id,
        full_name: metadata.full_name,
        username: metadata.username,
        phone: metadata.phone,
        county: metadata.county,
        preferred_lang: metadata.preferred_lang || 'en',
        interests: metadata.interests || [],
        avatar_url: metadata.avatar_url,
        heshima_score: 100,
      }).select().single();
      if (profileError) {
        logger.mutationError('signUp.profile', profileError, { userId: data.user.id });
        return { error: profileError.message };
      }

      // No session => email confirmation required
      if (!data.session) {
        setState(prev => ({
          ...prev,
          loading: false,
          needsEmailVerification: true,
          pendingEmail: email,
        }));
        return { needsVerification: true };
      }
      await loadProfile(sb, data.user.id);
    }
    return {};
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const sb = state.supabase || createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      logger.mutationError('signIn', error, { email });
      // Helpful message when email not confirmed
      if (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('verified')) {
        setState(prev => ({ ...prev, needsEmailVerification: true, pendingEmail: email }));
        return { error: 'Please verify your email before signing in. Check your inbox or resend the link.' };
      }
      return { error: error.message };
    }
    if (data.user) {
      await loadProfile(sb, data.user.id);
    }
    return {};
  };

  const signInWithGoogle = async () => {
    const sb = state.supabase || createClient();
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/feed`
          : undefined,
      },
    });
    if (error) logger.mutationError('signInWithGoogle', error);
  };

  const resendVerification = async (email?: string): Promise<{ error?: string }> => {
    const target = email || state.pendingEmail;
    if (!target) return { error: 'No email to verify' };
    const sb = state.supabase || createClient();
    const { error } = await sb.auth.resend({
      type: 'signup',
      email: target,
      options: {
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/feed`
          : undefined,
      },
    });
    if (error) {
      logger.mutationError('resendVerification', error, { email: target });
      return { error: error.message };
    }
    return {};
  };

  const signOut = async () => {
    const sb = state.supabase || createClient();
    await sb.auth.signOut();
    setState(prev => ({
      ...prev,
      user: null,
      isAdmin: false,
      needsEmailVerification: false,
      pendingEmail: null,
    }));
  };

  const refreshProfile = async () => {
    if (!state.supabase || !state.user) return;
    await loadProfile(state.supabase, state.user.id);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    const sb = state.supabase || createClient();
    if (!state.user) return { error: 'Not authenticated' };
    const { error } = await sb.from('profiles').update(updates).eq('id', state.user.id);
    if (error) {
      logger.mutationError('updateProfile', error, { userId: state.user.id });
      return { error: error.message };
    }
    await refreshProfile();
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
