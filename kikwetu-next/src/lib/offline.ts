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
    const tx = d.transaction('rw', 'replies', () =>
      replies.map(r => d.table('replies').put({ ...r, thread_id: threadId }))
    );
    await tx;
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
};
