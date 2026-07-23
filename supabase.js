/* ═══════════════════════════════════════════════════════════════════
   KikwetuConnect - Supabase Backend Layer (v2)
   Auth (Email/Phone/Google OAuth), Database, Realtime, Presence,
   Storage, Edge Functions
   ═══════════════════════════════════════════════════════════════════ */

const SUPABASE_CONFIG = {
    url: 'https://xzfsthlurdlrnegzejeo.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZnN0aGx1cmRscm5lZ3plamVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODg2ODQsImV4cCI6MjEwMDM2NDY4NH0.HFIECpzHhgTjz_Zpi-PURoKI6EN2Eob0G0df-uGGTSM'
};

let sb = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        sb = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: { persistSession: true, autoRefreshToken: true },
            realtime: { params: { eventsPerSecond: 10 } }
        });
        console.log('[Supabase] Client initialized');
        return true;
    }
    console.warn('[Supabase] SDK not loaded - running in demo mode');
    return false;
}

// ═══ Error helper ═══
function sbError(msg, err) {
    const message = err?.message || msg;
    console.error(`[Supabase] ${message}`, err);
    return { error: { message } };
}

const DB = {

    // ═══════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════

    async signUpWithEmail(email, password, metadata) {
        if (!sb) return sbError('Supabase not connected');
        const { data, error } = await sb.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
        return { data, error };
    },

    async createProfile(userId, metadata) {
        if (!sb) return sbError('Supabase not connected');
        const { data, error } = await sb
            .from('profiles')
            .upsert({
                id: userId,
                full_name: metadata.full_name,
                username: metadata.username,
                phone: metadata.phone || null,
                county: metadata.county || null,
                preferred_lang: metadata.preferred_lang || 'en',
                interests: metadata.interests || [],
                avatar_url: metadata.avatar_url || null,
                heshima_score: 100
            })
            .select()
            .single();
        return { data, error };
    },

    async signInWithEmail(email, password) {
        if (!sb) return sbError('Supabase not connected');
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        return { data, error };
    },

    async signUpWithPhone(phone, metadata) {
        if (!sb) return sbError('Supabase not connected');
        const { data, error } = await sb.auth.signInWithOtp({
            phone,
            options: { data: metadata }
        });
        return { data, error };
    },

    async verifyOtp(phone, token) {
        if (!sb) return sbError('Supabase not connected');
        const { data, error } = await sb.auth.verifyOtp({ phone, token, type: 'sms' });
        return { data, error };
    },

    async signInWithGoogle() {
        if (!sb) return sbError('Supabase not connected');
        const { data, error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        return { data, error };
    },

    async signOut() {
        if (!sb) return { error: null };
        const { error } = await sb.auth.signOut();
        return { error };
    },

    async getCurrentUser() {
        if (!sb) return { user: null };
        const { data: { user } } = await sb.auth.getUser();
        return { user };
    },

    async getSession() {
        if (!sb) return { session: null };
        const { data: { session } } = await sb.auth.getSession();
        return { session };
    },

    onAuthStateChange(callback) {
        if (!sb) return { data: { subscription: { unsubscribe: () => {} } } };
        return sb.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    },


    // ═══════════════════════════════════════
    // USER PROFILES
    // ═══════════════════════════════════════

    async getProfile(userId) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('profiles').select('*').eq('id', userId).single();
        return { data, error };
    },

    async getProfileByUsername(username) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('profiles').select('*').eq('username', username).single();
        return { data, error };
    },

    async updateProfile(userId, updates) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('profiles').update(updates).eq('id', userId);
        return { error };
    },

    async searchProfiles(query) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('profiles')
            .select('id, full_name, username, avatar_url, county, heshima_score, verified')
            .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(20);
        return { data, error };
    },

    async getTopContributors(limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('profiles')
            .select('id, full_name, username, avatar_url, county, heshima_score, verified, role')
            .order('heshima_score', { ascending: false })
            .limit(limit);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // THREADS
    // ═══════════════════════════════════════

    async createThread(thread) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('threads')
            .insert({
                author_id: thread.authorId,
                space_id: thread.spaceId || null,
                type: thread.type || 'question',
                title: thread.title,
                content: thread.content || '',
                language: thread.language || 'en',
                media_urls: thread.mediaUrls || [],
                tags: thread.tags || [],
                county: thread.county || '',
                is_anonymous: thread.isAnonymous || false
            })
            .select()
            .single();
        if (!error) {
            await sb.rpc('increment_column', { p_table: 'profiles', p_id: thread.authorId, p_column: 'post_count' });
        }
        return { data, error };
    },

    async getFeedThreads({ spaceId, language, type, county, limit = 20, offset = 0 } = {}) {
        if (!sb) return { data: [], error: null };
        let q = sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, county, verified, heshima_score, role),
                space:spaces!threads_space_id_fkey(id, name, slug, icon)
            `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (spaceId) q = q.eq('space_id', spaceId);
        if (language) q = q.eq('language', language);
        if (type) q = q.eq('type', type);
        if (county) q = q.eq('county', county);
        const { data, error } = await q;
        return { data, error };
    },

    async getThreadWithAuthor(threadId) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, county, verified, heshima_score, role),
                space:spaces!threads_space_id_fkey(id, name, slug, icon)
            `)
            .eq('id', threadId).single();
        return { data, error };
    },

    async getReplyWithAuthor(replyId) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('replies')
            .select(`
                *,
                author:profiles!replies_author_id_fkey(id, full_name, username, avatar_url, verified, heshima_score, role)
            `)
            .eq('id', replyId).single();
        return { data, error };
    },

    async getThreadById(threadId) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, county, verified, heshima_score, role),
                space:spaces!threads_space_id_fkey(id, name, slug, icon)
            `)
            .eq('id', threadId).single();
        if (!error) {
            await sb.rpc('increment_column', { p_table: 'threads', p_id: threadId, p_column: 'view_count' });
        }
        return { data, error };
    },

    async updateThread(threadId, updates) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.from('threads').update(updates).eq('id', threadId);
        return { error };
    },

    async deleteThread(threadId, authorId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.from('threads').delete()
            .eq('id', threadId).eq('author_id', authorId);
        return { error };
    },

    async searchThreads(query, limit = 30) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, verified),
                space:spaces!threads_space_id_fkey(id, name, slug, icon)
            `)
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getTrendingThreads(limit = 10) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, verified),
                space:spaces!threads_space_id_fkey(id, name, slug, icon)
            `)
            .order('upvotes_count', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getUserThreads(userId, limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, verified),
                space:spaces!threads_space_id_fkey(id, name, slug, icon)
            `)
            .eq('author_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // REPLIES
    // ═══════════════════════════════════════

    async createReply(reply) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('replies')
            .insert({
                thread_id: reply.threadId,
                author_id: reply.authorId,
                content: reply.content,
                parent_id: reply.parentId || null
            })
            .select()
            .single();
        if (!error) {
            await sb.rpc('increment_column', { p_table: 'profiles', p_id: reply.authorId, p_column: 'answer_count' });
        }
        return { data, error };
    },

    async getReplies(threadId, sortBy = 'upvotes') {
        if (!sb) return { data: [], error: null };
        const col = sortBy === 'newest' ? 'created_at' : sortBy === 'oldest' ? 'created_at' : 'upvotes_count';
        const asc = sortBy === 'oldest';
        const { data, error } = await sb
            .from('replies')
            .select(`
                *,
                author:profiles!replies_author_id_fkey(id, full_name, username, avatar_url, verified, heshima_score, role)
            `)
            .eq('thread_id', threadId)
            .is('parent_id', null)
            .order(col, { ascending: asc })
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async getNestedReplies(replyId) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('replies')
            .select(`
                *,
                author:profiles!replies_author_id_fkey(id, full_name, username, avatar_url, verified)
            `)
            .eq('parent_id', replyId)
            .order('created_at', { ascending: true });
        return { data, error };
    },

    async updateReply(replyId, updates) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.from('replies').update(updates).eq('id', replyId);
        return { error };
    },

    async deleteReply(replyId, authorId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.from('replies').delete()
            .eq('id', replyId).eq('author_id', authorId);
        return { error };
    },

    async acceptReply(replyId, threadAuthorId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('replies').update({ is_accepted: true }).eq('id', replyId);
        return { error };
    },

    async getUserReplies(userId, limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('replies')
            .select(`
                *,
                author:profiles!replies_author_id_fkey(id, full_name, username, avatar_url, verified),
                thread:threads!replies_thread_id_fkey(id, title, type)
            `)
            .eq('author_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // VOTES
    // ═══════════════════════════════════════

    async vote(userId, entityId, entityType, voteType) {
        if (!sb) return sbError('Supabase not connected');
        const { error: voteError } = await sb
            .from('votes')
            .upsert({
                user_id: userId,
                entity_id: entityId,
                entity_type: entityType,
                vote_type: voteType
            }, { onConflict: 'user_id,entity_id,entity_type' });
        if (voteError) return { error: voteError };
        return { error: null };
    },

    async removeVote(userId, entityId, entityType) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.from('votes').delete()
            .eq('user_id', userId).eq('entity_id', entityId).eq('entity_type', entityType);
        return { error };
    },

    async getUserVote(userId, entityId, entityType) {
        if (!sb) return { data: null, error: null };
        const { data, error } = await sb
            .from('votes').select('vote_type')
            .eq('user_id', userId).eq('entity_id', entityId).eq('entity_type', entityType)
            .maybeSingle();
        return { data, error };
    },

    async getUserVotes(userId, entityIds, entityType) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('votes').select('entity_id, vote_type')
            .eq('user_id', userId).eq('entity_type', entityType)
            .in('entity_id', entityIds);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // SPACES / COMMUNITIES
    // ═══════════════════════════════════════

    async getSpaces(limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('spaces').select('*')
            .order('member_count', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getSpaceBySlug(slug) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('spaces').select('*').eq('slug', slug).single();
        return { data, error };
    },

    async getSpaceById(id) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('spaces').select('name').eq('id', id).single();
        return { data, error };
    },

    async joinSpace(userId, spaceId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('user_spaces').upsert({ user_id: userId, space_id: spaceId });
        if (!error) {
            await sb.rpc('increment_column', { p_table: 'spaces', p_id: spaceId, p_column: 'member_count' });
        }
        return { error };
    },

    async leaveSpace(userId, spaceId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('user_spaces').delete().eq('user_id', userId).eq('space_id', spaceId);
        if (!error) {
            await sb.rpc('decrement_column', { p_table: 'spaces', p_id: spaceId, p_column: 'member_count' });
        }
        return { error };
    },

    async getUserSpaces(userId) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('user_spaces').select('space_id, spaces!inner(*)').eq('user_id', userId);
        return { data, error };
    },

    async isUserInSpace(userId, spaceId) {
        if (!sb) return false;
        const { data } = await sb
            .from('user_spaces').select('id')
            .eq('user_id', userId).eq('space_id', spaceId).maybeSingle();
        return !!data;
    },

    async getSpaceThreads(spaceId, limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('threads')
            .select(`
                *,
                author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, verified, heshima_score)
            `)
            .eq('space_id', spaceId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // QUIZZES
    // ═══════════════════════════════════════

    async getDailyQuiz(county) {
        if (!sb) return { data: [], error: null };
        let q = sb.from('quizzes')
            .select('*')
            .eq('is_daily', true)
            .lte('active_from', new Date().toISOString())
            .order('active_from', { ascending: false })
            .limit(3);
        if (county) q = q.eq('county', county);
        const { data, error } = await q;
        return { data, error };
    },

    async getQuizById(quizId) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('quizzes').select('*').eq('id', quizId).single();
        return { data, error };
    },

    async submitQuizResult(userId, quizId, isCorrect, score, timeTaken) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('quiz_results')
            .insert({
                user_id: userId,
                quiz_id: quizId,
                is_correct: isCorrect,
                score: score,
                time_taken_seconds: timeTaken
            });
        if (!error) {
            await sb.rpc('increment_column', { p_table: 'quizzes', p_id: quizId, p_column: 'attempts_count' });
            if (isCorrect) {
                await sb.rpc('increment_column', { p_table: 'quizzes', p_id: quizId, p_column: 'correct_count' });
            }
        }
        return { error };
    },

    async getQuizLeaderboard(quizId, limit = 50) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('quiz_results')
            .select(`
                *,
                user:profiles!quiz_results_user_id_fkey(id, full_name, username, avatar_url, county)
            `)
            .eq('quiz_id', quizId)
            .order('score', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getUserQuizHistory(userId, limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('quiz_results')
            .select(`
                *,
                quiz:quizzes!quiz_results_quiz_id_fkey(id, question, difficulty, county)
            `)
            .eq('user_id', userId)
            .order('completed_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // HESHIMA / KARMA
    // ═══════════════════════════════════════

    async getLeaderboard(limit = 50) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('profiles')
            .select('id, full_name, username, avatar_url, county, heshima_score, verified, role, badges')
            .order('heshima_score', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getHeshimaHistory(userId, limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('heshima_log')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async getHeshimaStats(userId) {
        if (!sb) return { data: null, error: null };
        const profile = await this.getProfile(userId);
        const history = await this.getHeshimaHistory(userId, 100);
        if (!profile.data) return { data: null, error: profile.error };
        const gains = (history.data || []).filter(h => h.points > 0).reduce((s, h) => s + h.points, 0);
        const losses = (history.data || []).filter(h => h.points < 0).reduce((s, h) => s + Math.abs(h.points), 0);
        return {
            data: {
                current: profile.data.heshima_score,
                totalGains: gains,
                totalLosses: losses,
                rank: 0
            },
            error: null
        };
    },


    // ═══════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════

    async getNotifications(userId, limit = 30) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async markNotificationsRead(userId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId).eq('is_read', false);
        return { error };
    },

    async getUnreadCount(userId) {
        if (!sb) return 0;
        const { count } = await sb
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId).eq('is_read', false);
        return count || 0;
    },

    async createNotification(notification) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('notifications')
            .insert({
                user_id: notification.userId,
                type: notification.type,
                actor_id: notification.actorId,
                entity_type: notification.entityType,
                entity_id: notification.entityId,
                content: notification.content
            });
        return { error };
    },

    async deleteNotification(notificationId, userId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('notifications').delete()
            .eq('id', notificationId).eq('user_id', userId);
        return { error };
    },


    // ═══════════════════════════════════════
    // FOLLOWS
    // ═══════════════════════════════════════

    async followUser(followerId, followingId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('follows').insert({ follower_id: followerId, following_id: followingId });
        return { error };
    },

    async unfollowUser(followerId, followingId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('follows').delete()
            .eq('follower_id', followerId).eq('following_id', followingId);
        return { error };
    },

    async isFollowing(followerId, followingId) {
        if (!sb) return false;
        const { data } = await sb
            .from('follows').select('id')
            .eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
        return !!data;
    },

    async getFollowers(userId) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('follows')
            .select('follower:profiles!follows_follower_id_fkey(id, full_name, username, avatar_url, county, heshima_score)')
            .eq('following_id', userId);
        return { data, error };
    },

    async getFollowing(userId) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('follows')
            .select('following:profiles!follows_following_id_fkey(id, full_name, username, avatar_url, county, heshima_score)')
            .eq('follower_id', userId);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════

    async addBookmark(userId, threadId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('bookmarks').insert({ user_id: userId, thread_id: threadId });
        return { error };
    },

    async removeBookmark(userId, threadId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('bookmarks').delete()
            .eq('user_id', userId).eq('thread_id', threadId);
        return { error };
    },

    async isBookmarked(userId, threadId) {
        if (!sb) return false;
        const { data } = await sb
            .from('bookmarks').select('id')
            .eq('user_id', userId).eq('thread_id', threadId).maybeSingle();
        return !!data;
    },

    async getBookmarks(userId, limit = 30) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('bookmarks')
            .select(`
                *,
                thread:threads!bookmarks_thread_id_fkey(
                    *,
                    author:profiles!threads_author_id_fkey(id, full_name, username, avatar_url, verified)
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },


    // ═══════════════════════════════════════
    // TRANSLATIONS CACHE
    // ═══════════════════════════════════════

    async getTranslation(entityId, entityType, targetLang) {
        if (!sb) return { data: null, error: null };
        const { data, error } = await sb
            .from('translations_cache')
            .select('translated_text')
            .eq('entity_id', entityId).eq('entity_type', entityType).eq('target_lang', targetLang)
            .maybeSingle();
        return { data, error };
    },

    async saveTranslation(entityId, entityType, targetLang, originalText, translatedText) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('translations_cache')
            .upsert({
                entity_id: entityId, entity_type: entityType,
                target_lang: targetLang, original_text: originalText,
                translated_text: translatedText
            }, { onConflict: 'entity_id,entity_type,target_lang' });
        return { error };
    },

    async translateText(text, targetLang) {
        if (!sb) return { data: null, error: { message: 'Edge functions require Supabase connection' } };
        try {
            const { data, error } = await sb.functions.invoke('translate', {
                body: { text, target_lang: targetLang }
            });
            return { data, error };
        } catch (e) {
            return { data: null, error: e };
        }
    },


    // ═══════════════════════════════════════
    // REPORTS / MODERATION
    // ═══════════════════════════════════════

    async reportContent(reporterId, entityType, entityId, reason, details) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('reports')
            .insert({
                reporter_id: reporterId, entity_type: entityType,
                entity_id: entityId, reason, details: details || ''
            });
        return { error };
    },

    async getReports(status = 'pending', limit = 50) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('reports')
            .select(`
                *,
                reporter:profiles!reports_reporter_id_fkey(id, full_name, username, avatar_url)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async resolveReport(reportId, resolution) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('reports')
            .update({ status: 'resolved', resolution, resolved_at: new Date().toISOString() })
            .eq('id', reportId);
        return { error };
    },

    async checkContentModeration(text) {
        if (!sb) return { data: null, error: { message: 'Edge functions require Supabase connection' } };
        try {
            const { data, error } = await sb.functions.invoke('moderate-content', {
                body: { text }
            });
            return { data, error };
        } catch (e) {
            return { data: null, error: e };
        }
    },


    // ═══════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════

    async globalSearch(query) {
        if (!sb) return { threads: [], users: [], spaces: [] };
        const [threadsRes, usersRes, spacesRes] = await Promise.all([
            sb.from('threads')
                .select('id, title, type, upvotes_count, reply_count, created_at, author:profiles!threads_author_id_fkey(full_name, username, avatar_url)')
                .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
                .order('created_at', { ascending: false }).limit(10),
            sb.from('profiles')
                .select('id, full_name, username, avatar_url, county, heshima_score, verified')
                .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
                .limit(10),
            sb.from('spaces')
                .select('id, name, slug, icon, member_count')
                .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(10)
        ]);
        return {
            threads: threadsRes.data || [],
            users: usersRes.data || [],
            spaces: spacesRes.data || []
        };
    },


    // ═══════════════════════════════════════
    // STORAGE (AVATARS, MEDIA)
    // ═══════════════════════════════════════

    async uploadAvatar(userId, file) {
        if (!sb) return { url: null, error: { message: 'Not connected' } };
        const ext = file.name.split('.').pop();
        const path = `avatars/${userId}.${ext}`;
        const { error: uploadError } = await sb.storage.from('media').upload(path, file, { upsert: true });
        if (uploadError) return { url: null, error: uploadError };
        const { data: urlData } = sb.storage.from('media').getPublicUrl(path);
        await this.updateProfile(userId, { avatar_url: urlData.publicUrl });
        return { url: urlData.publicUrl, error: null };
    },

    async uploadMedia(userId, file, folder = 'threads') {
        if (!sb) return { url: null, error: { message: 'Not connected' } };
        const ext = file.name.split('.').pop();
        const path = `${folder}/${userId}_${Date.now()}.${ext}`;
        const { error: uploadError } = await sb.storage.from('media').upload(path, file);
        if (uploadError) return { url: null, error: uploadError };
        const { data: urlData } = sb.storage.from('media').getPublicUrl(path);
        return { url: urlData.publicUrl, error: null };
    },

    async deleteMedia(path) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.storage.from('media').remove([path]);
        return { error };
    },

    getOptimizedUrl(url, width = 400) {
        if (!url || !url.includes(SUPABASE_CONFIG.url)) return url;
        return `${url}?width=${width}&quality=75&format=webp`;
    },


    // ═══════════════════════════════════════
    // LIVE ROOMS (Audio Baraza)
    // ═══════════════════════════════════════

    async createLiveRoom(room) {
        if (!sb) return { data: null, error: { message: 'Not connected' } };
        const { data, error } = await sb
            .from('live_rooms')
            .insert({
                title: room.title,
                description: room.description || '',
                host_id: room.hostId,
                space_id: room.spaceId || null,
                room_type: room.roomType || 'audio',
                max_listeners: room.maxListeners || 100
            })
            .select()
            .single();
        return { data, error };
    },

    async getActiveRooms(limit = 20) {
        if (!sb) return { data: [], error: null };
        const { data, error } = await sb
            .from('live_rooms')
            .select(`
                *,
                host:profiles!live_rooms_host_id_fkey(id, full_name, username, avatar_url),
                space:spaces!live_rooms_space_id_fkey(id, name, slug, icon)
            `)
            .eq('is_active', true)
            .order('listener_count', { ascending: false })
            .limit(limit);
        return { data, error };
    },

    async joinLiveRoom(roomId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.rpc('increment_column', { p_table: 'live_rooms', p_id: roomId, p_column: 'listener_count' });
        return { error };
    },

    async leaveLiveRoom(roomId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb.rpc('decrement_column', { p_table: 'live_rooms', p_id: roomId, p_column: 'listener_count' });
        return { error };
    },

    async endLiveRoom(roomId, hostId) {
        if (!sb) return sbError('Supabase not connected');
        const { error } = await sb
            .from('live_rooms')
            .update({ is_active: false, ended_at: new Date().toISOString() })
            .eq('id', roomId).eq('host_id', hostId);
        return { error };
    },

    subscribeToRoomPresence(roomId) {
        if (!sb) return { unsubscribe: () => {} };
        const channel = sb.channel(`room-${roomId}`, { config: { presence: { key: roomId } } });
        return {
            track: (userInfo) => channel.track(userInfo),
            untrack: () => channel.untrack(),
            onSync: (callback) => channel.on('presence', { event: 'sync' }, callback),
            onJoin: (callback) => channel.on('presence', { event: 'join' }, callback),
            onLeave: (callback) => channel.on('presence', { event: 'leave' }, callback),
            unsubscribe: () => sb.removeChannel(channel)
        };
    },

    async sendRoomChat(roomId, userId, message) {
        if (!sb) return sbError('Supabase not connected');
        try {
            const { error } = await sb.functions.invoke('room-chat', {
                body: { room_id: roomId, user_id: userId, message }
            });
            return { error };
        } catch (e) {
            return { error: e };
        }
    },


    // ═══════════════════════════════════════
    // OFFLINE SYNC
    // ═══════════════════════════════════════

    async syncOfflineActions(userId, actions) {
        if (!sb) return { errors: [] };
        const errors = [];
        for (const action of actions) {
            try {
                let result;
                switch (action.type) {
                    case 'createThread':
                        result = await this.createThread(action.payload);
                        break;
                    case 'createReply':
                        result = await this.createReply(action.payload);
                        break;
                    case 'vote':
                        result = await this.vote(action.payload.userId, action.payload.entityId, action.payload.entityType, action.payload.voteType);
                        break;
                    default:
                        break;
                }
                if (result?.error) errors.push({ action, error: result.error });
            } catch (e) {
                errors.push({ action, error: e });
            }
        }
        return { errors };
    },


    // ═══════════════════════════════════════
    // REALTIME SUBSCRIPTIONS
    // ═══════════════════════════════════════

    // ═══ Realtime Health Check ═══
    async checkRealtimeHealth() {
        if (!sb) return false;
        try {
            const channel = sb.channel('health-check');
            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    sb.removeChannel(channel);
                    resolve(false);
                }, 5000);
                channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {})
                    .subscribe((status) => {
                        clearTimeout(timeout);
                        sb.removeChannel(channel);
                        resolve(status === 'SUBSCRIBED');
                    });
            });
        } catch (e) {
            return false;
        }
    },

    subscribeToFeed(callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channel = sb
            .channel('feed-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads' }, (p) => callback('NEW_THREAD', p))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'threads' }, (p) => callback('THREAD_UPDATED', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    },

    subscribeToReplies(threadId, callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channel = sb
            .channel(`replies-${threadId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` }, (p) => callback('NEW_REPLY', p))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'replies', filter: `thread_id=eq.${threadId}` }, (p) => callback('REPLY_UPDATED', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    },

    subscribeToNotifications(userId, callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channel = sb
            .channel(`notifications-${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (p) => callback('NEW_NOTIFICATION', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    },

    subscribeToVotes(entityId, callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channelName = entityId === '*' ? 'votes-global' : `votes-${entityId}`;
        const config = entityId === '*'
            ? { event: '*', schema: 'public', table: 'votes' }
            : { event: '*', schema: 'public', table: 'votes', filter: `entity_id=eq.${entityId}` };
        const channel = sb
            .channel(channelName)
            .on('postgres_changes', config, (p) => callback('VOTE_CHANGE', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    },

    subscribeToHeshima(userId, callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channelName = userId === '*' ? 'heshima-global' : `heshima-${userId}`;
        const config = userId === '*'
            ? { event: 'UPDATE', schema: 'public', table: 'profiles' }
            : { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` };
        const channel = sb
            .channel(channelName)
            .on('postgres_changes', config, (p) => callback('HESHIMA_UPDATE', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    },

    subscribeToSpace(spaceId, callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channel = sb
            .channel(`space-${spaceId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'threads', filter: `space_id=eq.${spaceId}` }, (p) => callback('SPACE_NEW_THREAD', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    },

    subscribeToLiveRooms(callback) {
        if (!sb) return { unsubscribe: () => {} };
        const channel = sb
            .channel('live-rooms')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_rooms' }, (p) => callback('ROOM_CHANGE', p))
            .subscribe();
        return { unsubscribe: () => sb.removeChannel(channel) };
    }
};
