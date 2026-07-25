import Dexie from 'dexie';
import type { Thread, Reply, Profile } from '@/types';

let db: Dexie | null = null;

export function getOfflineDB() {
  if (db) return db;
  db = new Dexie('KikwetuConnect');
  // synced is 0 | 1 (IndexedDB cannot reliably query boolean false with equals(0))
  db.version(1).stores({
    threads: 'id, space_id, author_id, created_at, upvotes_count, cached_at',
    replies: 'id, thread_id, author_id, parent_id, created_at',
    profiles: 'id, username, heshima_score',
    spaces: 'id, slug, name',
    syncQueue: '++id, type, userId, created_at, synced',
    drafts: 'id, threadId, content, updated_at',
    votes: '[entity_id+entity_type], user_id',
    notifications: 'id, user_id, created_at, is_read',
  });
  return db;
}

export interface SyncAction {
  id?: number;
  type: 'createThread' | 'createReply' | 'vote';
  userId: string;
  payload: Record<string, unknown>;
  created_at: string;
  /** 0 = pending, 1 = synced — must be numeric for Dexie index queries */
  synced: number;
}

function isPendingSynced(value: unknown): boolean {
  return value === 0 || value === false || value === '0';
}

export const Offline = {
  async cacheThread(thread: Thread) {
    const d = getOfflineDB();
    await d.table('threads').put({ ...thread, cached_at: new Date().toISOString() });
  },
  async cacheReplies(threadId: string, replies: Reply[]) {
    const d = getOfflineDB();
    await d.transaction('rw', 'replies', async () => {
      for (const r of replies) {
        await d.table('replies').put({ ...r, thread_id: threadId });
      }
    });
  },
  async cacheProfile(profile: Profile) {
    const d = getOfflineDB();
    await d.table('profiles').put(profile);
  },
  async queueAction(action: Omit<SyncAction, 'id' | 'created_at' | 'synced'>) {
    const d = getOfflineDB();
    await d.table('syncQueue').add({
      ...action,
      created_at: new Date().toISOString(),
      synced: 0,
    });
  },
  async getPendingCount(): Promise<number> {
    const d = getOfflineDB();
    // Support both legacy boolean false and numeric 0
    const rows = await d.table('syncQueue').toArray();
    return rows.filter(r => isPendingSynced(r.synced)).length;
  },
  async getPendingActions(): Promise<SyncAction[]> {
    const d = getOfflineDB();
    const rows = await d.table('syncQueue').toArray();
    return rows.filter(r => isPendingSynced(r.synced)) as SyncAction[];
  },
  async markSynced(id: number) {
    const d = getOfflineDB();
    await d.table('syncQueue').update(id, { synced: 1 });
  },
  async getThread(id: string): Promise<Thread | undefined> {
    const d = getOfflineDB();
    return d.table('threads').get(id);
  },
  async getCachedThreads(): Promise<Thread[]> {
    const d = getOfflineDB();
    return d.table('threads').orderBy('created_at').reverse().toArray();
  },

  async drainSyncQueue(sb: ReturnType<typeof import('./supabase').createClient>): Promise<number> {
    const d = getOfflineDB();
    const pending = await Offline.getPendingActions();
    let drained = 0;
    for (const action of pending) {
      try {
        if (action.type === 'createThread') {
          const p = action.payload;
          const { error } = await sb.from('threads').insert({
            author_id: p.author_id ?? action.userId,
            space_id: p.space_id ?? null,
            type: p.type || 'question',
            title: p.title,
            content: p.content,
            language: p.language || 'en',
            tags: p.tags || [],
            county: p.county || '',
          }).select().single();
          if (error) throw error;
        } else if (action.type === 'createReply') {
          const p = action.payload;
          const { error } = await sb.from('replies').insert({
            thread_id: p.thread_id,
            author_id: p.author_id ?? action.userId,
            content: p.content,
          }).select().single();
          if (error) throw error;
        } else if (action.type === 'vote') {
          const p = action.payload as Record<string, string>;
          const { error } = await sb.rpc('toggle_vote', {
            p_user_id: action.userId,
            p_entity_id: p.entityId,
            p_entity_type: p.entityType,
            p_vote_type: p.voteType,
          });
          if (error) throw error;
        }
        if (action.id != null) await d.table('syncQueue').update(action.id, { synced: 1 });
        drained++;
      } catch (err) {
        console.error('[Offline] Sync failed for action', action.id, action.type, err);
      }
    }
    return drained;
  },
};
