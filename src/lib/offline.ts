import Dexie from 'dexie';
import type { Thread, Reply, Profile, Space } from '@/types';

let db: Dexie | null = null;

export function getOfflineDB() {
  if (db) return db;
  db = new Dexie('KikwetuConnect');
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
  synced: boolean;
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
      synced: false,
    });
  },
  async getPendingCount(): Promise<number> {
    const d = getOfflineDB();
    return d.table('syncQueue').where('synced').equals(0).count();
  },
  async getPendingActions(): Promise<SyncAction[]> {
    const d = getOfflineDB();
    return d.table('syncQueue').where('synced').equals(0).toArray();
  },
  async markSynced(id: number) {
    const d = getOfflineDB();
    await d.table('syncQueue').update(id, { synced: true });
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
    const pending = await d.table('syncQueue').where('synced').equals(0).toArray();
    let drained = 0;
    for (const action of pending) {
      try {
        if (action.type === 'createThread') {
          await sb.from('threads').insert(action.payload).select().single();
        } else if (action.type === 'createReply') {
          await sb.from('replies').insert(action.payload).select().single();
        } else if (action.type === 'vote') {
          const p = action.payload as Record<string, string>;
          await sb.rpc('toggle_vote', {
            p_user_id: action.userId,
            p_entity_id: p.entityId,
            p_entity_type: p.entityType,
            p_vote_type: p.voteType,
          });
        }
        if (action.id) await d.table('syncQueue').update(action.id, { synced: true });
        drained++;
      } catch (err) {
        console.error('[Offline] Sync failed for action', action.id, action.type, err);
      }
    }
    return drained;
  },
};
