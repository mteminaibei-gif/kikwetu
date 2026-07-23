/* ═══════════════════════════════════════════════════════════════════
   KikwetuConnect - Offline First Layer (IndexedDB via Dexie.js)
   Cache threads, drafts, and sync queue for background sync
   ═══════════════════════════════════════════════════════════════════ */

let offlineDB = null;

function initOfflineDB() {
    if (typeof Dexie === 'undefined') {
        console.warn('[Offline] Dexie.js not loaded');
        return false;
    }

    offlineDB = new Dexie('KikwetuConnect');

    offlineDB.version(1).stores({
        threads: 'id, space_id, author_id, created_at, upvotes_count, cached_at',
        replies: 'id, thread_id, author_id, parent_id, created_at',
        profiles: 'id, username, heshima_score',
        spaces: 'id, slug, name',
        syncQueue: '++id, type, userId, entityId, created_at, synced',
        drafts: 'id, threadId, content, updated_at',
        votes: '[entity_id+entity_type], user_id',
        notifications: 'id, user_id, created_at, is_read',
        quizResults: 'id, user_id, quiz_id, completed_at'
    });

    console.log('[Offline] IndexedDB initialized');
    return true;
}

const Offline = {

    isOnline() {
        return navigator.onLine;
    },

    // ═══════════════════════════════════════
    // THREAD CACHE
    // ═══════════════════════════════════════

    async cacheThreads(threads) {
        if (!offlineDB) return;
        try {
            const items = threads.map(t => ({ ...t, cached_at: Date.now() }));
            await offlineDB.threads.bulkPut(items);
        } catch (e) {
            console.error('[Offline] Cache threads error', e);
        }
    },

    async getCachedThreads({ spaceId, limit = 50, offset = 0 } = {}) {
        if (!offlineDB) return [];
        try {
            let col = offlineDB.threads.orderBy('created_at').reverse();
            if (spaceId) col = offlineDB.threads.where('space_id').equals(spaceId).reverse();
            return await col.offset(offset).limit(limit).toArray();
        } catch (e) {
            console.error('[Offline] Get cached threads error', e);
            return [];
        }
    },

    async getCachedThread(threadId) {
        if (!offlineDB) return null;
        try {
            return await offlineDB.threads.get(threadId) || null;
        } catch (e) {
            return null;
        }
    },

    async cacheThread(thread) {
        if (!offlineDB) return;
        try {
            await offlineDB.threads.put({ ...thread, cached_at: Date.now() });
        } catch (e) {
            console.error('[Offline] Cache thread error', e);
        }
    },

    async deleteCachedThread(threadId) {
        if (!offlineDB) return;
        try {
            await offlineDB.threads.delete(threadId);
        } catch (e) {}
    },

    async getThreadCount() {
        if (!offlineDB) return 0;
        try {
            return await offlineDB.threads.count();
        } catch (e) {
            return 0;
        }
    },

    async pruneOldThreads(maxAge = 7 * 24 * 60 * 60 * 1000) {
        if (!offlineDB) return;
        try {
            const cutoff = Date.now() - maxAge;
            await offlineDB.threads.where('cached_at').below(cutoff).delete();
        } catch (e) {}
    },


    // ═══════════════════════════════════════
    // REPLY CACHE
    // ═══════════════════════════════════════

    async cacheReplies(replies) {
        if (!offlineDB) return;
        try {
            await offlineDB.replies.bulkPut(replies);
        } catch (e) {
            console.error('[Offline] Cache replies error', e);
        }
    },

    async getCachedReplies(threadId) {
        if (!offlineDB) return [];
        try {
            return await offlineDB.replies.where('thread_id').equals(threadId).sortBy('created_at');
        } catch (e) {
            return [];
        }
    },


    // ═══════════════════════════════════════
    // DRAFTS (Auto-save while composing)
    // ═══════════════════════════════════════

    async saveDraft(draft) {
        if (!offlineDB) return;
        try {
            await offlineDB.drafts.put({
                id: draft.id || `draft-${Date.now()}`,
                threadId: draft.threadId || null,
                content: draft.content,
                title: draft.title || '',
                tags: draft.tags || [],
                updated_at: Date.now()
            });
        } catch (e) {
            console.error('[Offline] Save draft error', e);
        }
    },

    async getDraft(draftId) {
        if (!offlineDB) return null;
        try {
            return await offlineDB.drafts.get(draftId) || null;
        } catch (e) {
            return null;
        }
    },

    async getAllDrafts() {
        if (!offlineDB) return [];
        try {
            return await offlineDB.drafts.orderBy('updated_at').reverse().toArray();
        } catch (e) {
            return [];
        }
    },

    async deleteDraft(draftId) {
        if (!offlineDB) return;
        try {
            await offlineDB.drafts.delete(draftId);
        } catch (e) {}
    },

    async clearOldDrafts(maxAge = 30 * 24 * 60 * 60 * 1000) {
        if (!offlineDB) return;
        try {
            const cutoff = Date.now() - maxAge;
            await offlineDB.drafts.where('updated_at').below(cutoff).delete();
        } catch (e) {}
    },


    // ═══════════════════════════════════════
    // OFFLINE ACTION QUEUE
    // ═══════════════════════════════════════

    async queueAction(action) {
        if (!offlineDB) return;
        try {
            await offlineDB.syncQueue.add({
                type: action.type,
                userId: action.userId,
                entityId: action.entityId || null,
                payload: action.payload,
                created_at: Date.now(),
                synced: false,
                retries: 0
            });
            console.log(`[Offline] Queued action: ${action.type}`);
        } catch (e) {
            console.error('[Offline] Queue action error', e);
        }
    },

    async getPendingActions() {
        if (!offlineDB) return [];
        try {
            return await offlineDB.syncQueue
                .where('synced').equals(0)
                .toArray();
        } catch (e) {
            return [];
        }
    },

    async markSynced(actionId) {
        if (!offlineDB) return;
        try {
            await offlineDB.syncQueue.update(actionId, { synced: true });
        } catch (e) {}
    },

    async markFailed(actionId) {
        if (!offlineDB) return;
        try {
            await offlineDB.syncQueue.update(actionId, { retries: 99 });
        } catch (e) {}
    },

    async clearSyncedActions() {
        if (!offlineDB) return;
        try {
            await offlineDB.syncQueue.where('synced').equals(1).delete();
        } catch (e) {}
    },

    async getPendingCount() {
        if (!offlineDB) return 0;
        try {
            return await offlineDB.syncQueue.where('synced').equals(0).count();
        } catch (e) {
            return 0;
        }
    },

    async retryFailedActions() {
        if (!offlineDB) return [];
        try {
            return await offlineDB.syncQueue
                .where('retries').below(3)
                .and(item => !item.synced)
                .toArray();
        } catch (e) {
            return [];
        }
    },


    // ═══════════════════════════════════════
    // VOTE CACHE (Optimistic updates)
    // ═══════════════════════════════════════

    async cacheVote(entityId, entityType, voteType) {
        if (!offlineDB) return;
        try {
            await offlineDB.votes.put({ entity_id: entityId, entity_type: entityType, vote_type: voteType });
        } catch (e) {}
    },

    async getCachedVote(entityId, entityType) {
        if (!offlineDB) return null;
        try {
            return await offlineDB.votes.get([entityId, entityType]) || null;
        } catch (e) {
            return null;
        }
    },

    async removeCachedVote(entityId, entityType) {
        if (!offlineDB) return;
        try {
            await offlineDB.votes.delete([entityId, entityType]);
        } catch (e) {}
    },


    // ═══════════════════════════════════════
    // NOTIFICATION CACHE
    // ═══════════════════════════════════════

    async cacheNotifications(notifications) {
        if (!offlineDB) return;
        try {
            await offlineDB.notifications.bulkPut(notifications);
        } catch (e) {}
    },

    async getCachedNotifications(userId, limit = 30) {
        if (!offlineDB) return [];
        try {
            return await offlineDB.notifications
                .where('user_id').equals(userId)
                .reverse().limit(limit).toArray();
        } catch (e) {
            return [];
        }
    },

    async markNotificationRead(id) {
        if (!offlineDB) return;
        try {
            await offlineDB.notifications.update(id, { is_read: true });
        } catch (e) {}
    },


    // ═══════════════════════════════════════
    // PROFILE CACHE
    // ═══════════════════════════════════════

    async cacheProfile(profile) {
        if (!offlineDB) return;
        try {
            await offlineDB.profiles.put(profile);
        } catch (e) {}
    },

    async getCachedProfile(userId) {
        if (!offlineDB) return null;
        try {
            return await offlineDB.profiles.get(userId) || null;
        } catch (e) {
            return null;
        }
    },

    async cacheSpace(space) {
        if (!offlineDB) return;
        try {
            await offlineDB.spaces.put(space);
        } catch (e) {}
    },

    async getCachedSpace(spaceId) {
        if (!offlineDB) return null;
        try {
            return await offlineDB.spaces.get(spaceId) || null;
        } catch (e) {
            return null;
        }
    },


    // ═══════════════════════════════════════
    // SYNC ENGINE
    // ═══════════════════════════════════════

    async syncPendingActions() {
        if (!this.isOnline() || !sb) return { synced: 0, failed: 0 };

        const actions = await this.getPendingActions();
        if (actions.length === 0) return { synced: 0, failed: 0 };

        let synced = 0;
        let failed = 0;

        for (const action of actions) {
            try {
                let result;
                switch (action.type) {
                    case 'createThread':
                        result = await DB.createThread(action.payload);
                        break;
                    case 'createReply':
                        result = await DB.createReply(action.payload);
                        break;
                    case 'vote':
                        result = await DB.vote(action.payload.userId, action.payload.entityId, action.payload.entityType, action.payload.voteType);
                        break;
                    case 'removeVote':
                        result = await DB.removeVote(action.payload.userId, action.payload.entityId, action.payload.entityType);
                        break;
                    case 'follow':
                        result = await DB.followUser(action.payload.followerId, action.payload.followingId);
                        break;
                    case 'unfollow':
                        result = await DB.unfollowUser(action.payload.followerId, action.payload.followingId);
                        break;
                    case 'bookmark':
                        result = await DB.addBookmark(action.payload.userId, action.payload.threadId);
                        break;
                    default:
                        result = { error: { message: 'Unknown action type' } };
                }

                if (result?.error) {
                    await this.markFailed(action.id);
                    failed++;
                } else {
                    await this.markSynced(action.id);
                    synced++;
                }
            } catch (e) {
                await this.markFailed(action.id);
                failed++;
            }
        }

        console.log(`[Offline] Sync complete: ${synced} synced, ${failed} failed`);
        return { synced, failed };
    },

    async startAutoSync(intervalMs = 30000) {
        if (this._syncInterval) clearInterval(this._syncInterval);

        this._syncInterval = setInterval(async () => {
            if (this.isOnline()) {
                const result = await this.syncPendingActions();
                if (result.synced > 0 || result.failed > 0) {
                    window.dispatchEvent(new CustomEvent('offline-sync', { detail: result }));
                }
                await this.clearSyncedActions();
            }
        }, intervalMs);

        window.addEventListener('online', async () => {
            console.log('[Offline] Back online - syncing...');
            const result = await this.syncPendingActions();
            window.dispatchEvent(new CustomEvent('offline-sync', { detail: result }));
            await this.clearSyncedActions();
        });
    },

    stopAutoSync() {
        if (this._syncInterval) {
            clearInterval(this._syncInterval);
            this._syncInterval = null;
        }
    },

    async getStatus() {
        return {
            online: this.isOnline(),
            pending: await this.getPendingCount(),
            threadCacheCount: await this.getThreadCount()
        };
    }
};
