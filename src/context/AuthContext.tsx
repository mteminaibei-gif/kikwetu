'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient, type SupabaseClient } from '@/lib/supabase';
import type { Profile } from '@/types';
import { Offline } from '@/lib/offline';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  supabase: SupabaseClient | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata: Partial<Profile>) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, loading: true, isAdmin: false, supabase: null,
  });

  const supabase = useCallback(() => {
    const sb = createClient();
    setState(prev => ({ ...prev, supabase: sb }));
    return sb;
  }, []);

  const loadProfile = useCallback(async (sb: SupabaseClient, userId: string) => {
    const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      await Offline.cacheProfile(data as Profile);
      setState(prev => ({
        ...prev,
        user: data as Profile,
        isAdmin: (data as Profile).role === 'admin',
        loading: false,
      }));
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    const sb = createClient();
    setState(prev => ({ ...prev, supabase: sb }));
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(sb, session.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadProfile(sb, session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false, isAdmin: false, supabase: sb });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = async (email: string, password: string, metadata: Partial<Profile>): Promise<{ error?: string }> => {
    const sb = state.supabase || createClient();
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: metadata as Record<string, unknown> },
    });
    if (error) return { error: error.message };
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
      if (profileError) return { error: profileError.message };
      if (data.session) {
        await loadProfile(sb, data.user.id);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
    return {};
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const sb = state.supabase || createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await loadProfile(sb, data.user.id);
    }
    return {};
  };

  const signInWithGoogle = async () => {
    const sb = state.supabase || createClient();
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/feed' },
    });
  };

  const signOut = async () => {
    const sb = state.supabase || createClient();
    await sb.auth.signOut();
    setState(prev => ({ ...prev, user: null, isAdmin: false }));
  };

  const refreshProfile = async () => {
    if (!state.supabase || !state.user) return;
    await loadProfile(state.supabase, state.user.id);
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error?: string }> => {
    const sb = state.supabase || createClient();
    if (!state.user) return { error: 'Not authenticated' };
    const { error } = await sb.from('profiles').update(updates).eq('id', state.user.id);
    if (error) return { error: error.message };
    await refreshProfile();
    return {};
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signInWithGoogle, signOut, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
