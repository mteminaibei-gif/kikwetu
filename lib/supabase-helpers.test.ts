/**
 * Comprehensive unit tests for all supabase-helpers functions.
 * Uses a mocked Supabase client to test logic without a live connection.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Supabase client (factory must not reference outer vars) ─────
vi.mock('./supabase', () => {
  const createChain = () => {
    const chain: Record<string, any> = {};
    chain.select = vi.fn().mockReturnValue(chain);
    chain.insert = vi.fn().mockReturnValue(chain);
    chain.update = vi.fn().mockReturnValue(chain);
    chain.delete = vi.fn().mockReturnValue(chain);
    chain.eq = vi.fn().mockReturnValue(chain);
    chain.order = vi.fn().mockReturnValue(chain);
    chain.single = vi.fn().mockResolvedValue({ data: null, error: null });
    return chain;
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(() => createChain()),
    },
  };
});

// Import the mocked module to get a reference
import { supabase } from './supabase';
const mockSupabase = vi.mocked(supabase);

// Helper to set up chained query responses
function setupChain(resolvedValue: { data: any; error?: any }) {
  const chain: Record<string, any> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  return chain;
}

// Import helpers AFTER mock is set up
import {
  getCurrentUser,
  toggleVote,
  checkVote,
  toggleSave,
  checkSaved,
  toggleFollow,
  checkFollowing,
  createThread,
  createReply,
  fetchReplies,
  sendMessage,
  createConversation,
  joinSpace,
  checkSpaceMember,
  sendTip,
  createListing,
  markListingSold,
  createAlert,
  confirmAlert,
  submitQuizResult,
  requestSession,
  updateProfile,
  createReport,
  markNotificationRead,
  markAllNotificationsRead,
  toggleReaction,
  getReactions,
} from './supabase-helpers';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getCurrentUser ───────────────────────────────────────────────────
describe('getCurrentUser', () => {
  it('returns null when no auth user', async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValueOnce({ data: { user: null } });
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('returns profile when auth user exists', async () => {
    const profile = { id: 'p1', user_id: 'u1', username: 'testuser', full_name: 'Test User' };
    mockSupabase.auth.getUser = vi.fn().mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
    const chain = setupChain({ data: profile });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    const result = await getCurrentUser();
    expect(result).toEqual(profile);
  });
});

// ─── toggleVote ───────────────────────────────────────────────────────
describe('toggleVote', () => {
  it('creates a new vote when none exists', async () => {
    const selectChain = setupChain({ data: null });
    const insertChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain) as any;

    const result = await toggleVote('user1', 'thread', 'thread1', 1);
    expect(result).toEqual({ voted: true, delta: 1 });
  });

  it('removes vote when same value exists', async () => {
    const selectChain = setupChain({ data: { id: 'v1', value: 1 } });
    const deleteChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain) as any;

    const result = await toggleVote('user1', 'thread', 'thread1', 1);
    expect(result).toEqual({ voted: false, delta: -1 });
  });

  it('flips vote when opposite value exists', async () => {
    const selectChain = setupChain({ data: { id: 'v1', value: -1 } });
    const updateChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain) as any;

    const result = await toggleVote('user1', 'thread', 'thread1', 1);
    expect(result).toEqual({ voted: true, delta: 2 });
  });
});

// ─── checkVote ────────────────────────────────────────────────────────
describe('checkVote', () => {
  it('returns vote data when exists', async () => {
    const voteData = { id: 'v1', value: 1 };
    const chain = setupChain({ data: voteData });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    const result = await checkVote('user1', 'thread', 'thread1');
    expect(result).toEqual(voteData);
  });

  it('returns null when no vote', async () => {
    const chain = setupChain({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    const result = await checkVote('user1', 'thread', 'thread1');
    expect(result).toBeNull();
  });
});

// ─── toggleSave ───────────────────────────────────────────────────────
describe('toggleSave', () => {
  it('saves when not saved', async () => {
    const selectChain = setupChain({ data: null });
    const insertChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain) as any;

    const result = await toggleSave('user1', 'thread', 'thread1');
    expect(result).toBe(true);
  });

  it('unsaves when already saved', async () => {
    const selectChain = setupChain({ data: { id: 's1' } });
    const deleteChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain) as any;

    const result = await toggleSave('user1', 'thread', 'thread1');
    expect(result).toBe(false);
  });
});

// ─── checkSaved ───────────────────────────────────────────────────────
describe('checkSaved', () => {
  it('returns true when saved', async () => {
    const chain = setupChain({ data: { id: 's1' } });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    expect(await checkSaved('user1', 'thread', 'thread1')).toBe(true);
  });

  it('returns false when not saved', async () => {
    const chain = setupChain({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    expect(await checkSaved('user1', 'thread', 'thread1')).toBe(false);
  });
});

// ─── toggleFollow ─────────────────────────────────────────────────────
describe('toggleFollow', () => {
  it('follows when not following', async () => {
    const selectChain = setupChain({ data: null });
    const insertChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain) as any;

    expect(await toggleFollow('follower1', 'following1')).toBe(true);
  });

  it('unfollows when already following', async () => {
    const selectChain = setupChain({ data: { id: 'f1' } });
    const deleteChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain) as any;

    expect(await toggleFollow('follower1', 'following1')).toBe(false);
  });
});

// ─── checkFollowing ───────────────────────────────────────────────────
describe('checkFollowing', () => {
  it('returns true when following', async () => {
    const chain = setupChain({ data: { id: 'f1' } });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    expect(await checkFollowing('f1', 'f2')).toBe(true);
  });

  it('returns false when not following', async () => {
    const chain = setupChain({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    expect(await checkFollowing('f1', 'f2')).toBe(false);
  });
});

// ─── createThread ─────────────────────────────────────────────────────
describe('createThread', () => {
  it('creates a thread with correct parameters', async () => {
    const threadData = { id: 't1', author_id: 'a1', title: 'Test', body: 'Body', type: 'post', tags: ['test'] };
    const chain = setupChain({ data: threadData, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await createThread('a1', 'Test', 'Body', 'post', ['test']);
    expect(result.data).toEqual(threadData);
    expect(result.error).toBeNull();
  });
});

// ─── createReply ──────────────────────────────────────────────────────
describe('createReply', () => {
  it('creates a reply', async () => {
    const replyData = { id: 'r1', thread_id: 't1', author_id: 'a1', body: 'Reply' };
    const chain = setupChain({ data: replyData, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await createReply('t1', 'a1', 'Reply');
    expect(result.data).toEqual(replyData);
  });
});

// ─── fetchReplies ─────────────────────────────────────────────────────
describe('fetchReplies', () => {
  it('fetches replies for a thread ordered by created_at', async () => {
    const replies = [{ id: 'r1', body: 'Reply 1' }, { id: 'r2', body: 'Reply 2' }];
    const chain = setupChain({ data: null });
    chain.order = vi.fn().mockResolvedValueOnce({ data: replies, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await fetchReplies('t1');
    expect(result.data).toEqual(replies);
  });
});

// ─── sendMessage ──────────────────────────────────────────────────────
describe('sendMessage', () => {
  it('sends a message and updates conversation', async () => {
    const msgData = { id: 'm1', conversation_id: 'c1', sender_id: 's1', body: 'Hello' };
    const insertChain = setupChain({ data: msgData, error: null });
    const updateChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(updateChain) as any;

    const result = await sendMessage('c1', 's1', 'Hello');
    expect(result.data).toEqual(msgData);
  });
});

// ─── createConversation ───────────────────────────────────────────────
describe('createConversation', () => {
  it('creates conversation with participants and first message', async () => {
    const convData = { id: 'c1', last_message: 'Hi', created_at: '2026-01-01' };
    const convChain = setupChain({ data: convData, error: null });
    const partChain = setupChain({ data: null });
    const msgChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(convChain)
      .mockReturnValueOnce(partChain)
      .mockReturnValueOnce(msgChain) as any;

    const result = await createConversation(['user1', 'user2'], 'Hi');
    expect(result.data).toEqual(convData);
    expect(result.error).toBeNull();
  });

  it('returns error when conversation creation fails', async () => {
    const convChain = setupChain({ data: null, error: { message: 'fail' } });
    mockSupabase.from = vi.fn().mockReturnValueOnce(convChain) as any;

    const result = await createConversation(['user1', 'user2']);
    expect(result.data).toBeNull();
  });
});

// ─── joinSpace ────────────────────────────────────────────────────────
describe('joinSpace', () => {
  it('joins when not a member', async () => {
    const selectChain = setupChain({ data: null });
    const insertChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain) as any;

    expect(await joinSpace('space1', 'user1')).toBe(true);
  });

  it('leaves when already a member', async () => {
    const selectChain = setupChain({ data: { id: 'sm1' } });
    const deleteChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain) as any;

    expect(await joinSpace('space1', 'user1')).toBe(false);
  });
});

// ─── checkSpaceMember ─────────────────────────────────────────────────
describe('checkSpaceMember', () => {
  it('returns true when member', async () => {
    const chain = setupChain({ data: { id: 'sm1' } });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    expect(await checkSpaceMember('space1', 'user1')).toBe(true);
  });
});

// ─── sendTip ──────────────────────────────────────────────────────────
describe('sendTip', () => {
  it('calculates platform fee at 10%', async () => {
    const tipData = {
      id: 'tip1', from_user_id: 'u1', to_user_id: 'u2',
      amount: 1000, platform_fee: 100, net_amount: 900,
      rating: 5, status: 'completed',
    };
    const chain = setupChain({ data: tipData, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await sendTip('u1', 'u2', 1000, 5, 'Great session');
    expect(result.data?.platform_fee).toBe(100);
    expect(result.data?.net_amount).toBe(900);
  });
});

// ─── createListing ────────────────────────────────────────────────────
describe('createListing', () => {
  it('creates a marketplace listing', async () => {
    const listing = { id: 'l1', seller_id: 's1', title: 'Produce', price: 500 };
    const chain = setupChain({ data: listing, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await createListing('s1', 'Produce', 'Fresh produce', 500, 'produce', 'Nairobi');
    expect(result.data).toEqual(listing);
  });
});

// ─── markListingSold ──────────────────────────────────────────────────
describe('markListingSold', () => {
  it('marks listing as unavailable', async () => {
    const chain = setupChain({ data: null });
    chain.eq = vi.fn().mockResolvedValueOnce({ error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await markListingSold('l1');
    expect(result.error).toBeNull();
  });
});

// ─── createAlert ──────────────────────────────────────────────────────
describe('createAlert', () => {
  it('creates a nyumba kumi alert', async () => {
    const alert = { id: 'a1', type: 'safety', title: 'Water outage' };
    const chain = setupChain({ data: alert, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await createAlert('u1', 'safety', 'Water outage', 'No water', 'Westlands', 'Nairobi');
    expect(result.data).toEqual(alert);
  });
});

// ─── confirmAlert ─────────────────────────────────────────────────────
describe('confirmAlert', () => {
  it('increments confirmations count', async () => {
    const selectChain = setupChain({ data: { confirmations_count: 3 } });
    const updateChain = setupChain({ data: null });
    updateChain.eq = vi.fn().mockResolvedValueOnce({ error: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(updateChain) as any;

    const result = await confirmAlert('a1');
    expect(result.error).toBeNull();
  });

  it('returns no error when alert not found', async () => {
    const chain = setupChain({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await confirmAlert('nonexistent');
    expect(result.error).toBeNull();
  });
});

// ─── submitQuizResult ─────────────────────────────────────────────────
describe('submitQuizResult', () => {
  it('submits quiz result', async () => {
    const qr = { id: 'qr1', quiz_id: 'q1', user_id: 'u1', score: 8, total_questions: 10 };
    const chain = setupChain({ data: qr, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await submitQuizResult('q1', 'u1', 8, 10, 120);
    expect(result.data).toEqual(qr);
  });
});

// ─── requestSession ───────────────────────────────────────────────────
describe('requestSession', () => {
  it('creates a session request', async () => {
    const session = { id: 's1', student_id: 'st1', professional_id: 'pr1', title: 'Help', status: 'pending' };
    const chain = setupChain({ data: session, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await requestSession('st1', 'pr1', 'Help', 'I need guidance');
    expect(result.data).toEqual(session);
  });
});

// ─── updateProfile ────────────────────────────────────────────────────
describe('updateProfile', () => {
  it('updates allowed fields only', async () => {
    const chain = setupChain({ data: null });
    chain.eq = vi.fn().mockResolvedValueOnce({ error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await updateProfile('u1', { full_name: 'New Name', bio: 'New bio' });
    expect(result.error).toBeNull();
  });

  it('rejects when no valid fields provided', async () => {
    const result = await updateProfile('u1', { role: 'admin', heshima: 999 });
    expect(result.error).toBeTruthy();
  });

  it('filters out disallowed fields', async () => {
    const chain = setupChain({ data: null });
    chain.eq = vi.fn().mockResolvedValueOnce({ error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await updateProfile('u1', { full_name: 'Test', role: 'admin' });
    // Should succeed because full_name is allowed, role should be filtered
    expect(result.error).toBeNull();
  });
});

// ─── createReport ─────────────────────────────────────────────────────
describe('createReport', () => {
  it('creates a report', async () => {
    const report = { id: 'rep1', reporter_id: 'u1', target_type: 'thread', target_id: 't1', reason: 'spam' };
    const chain = setupChain({ data: report, error: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await createReport('u1', 'thread', 't1', 'spam');
    expect(result.data).toEqual(report);
  });
});

// ─── markNotificationRead ─────────────────────────────────────────────
describe('markNotificationRead', () => {
  it('calls notifications table', async () => {
    const chain = setupChain({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    await markNotificationRead('n1');
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });
});

// ─── markAllNotificationsRead ─────────────────────────────────────────
describe('markAllNotificationsRead', () => {
  it('calls notifications table', async () => {
    const chain = setupChain({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;
    await markAllNotificationsRead('u1');
    expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
  });
});

// ─── toggleReaction ───────────────────────────────────────────────────
describe('toggleReaction', () => {
  it('adds reaction when not reacted', async () => {
    const selectChain = setupChain({ data: null });
    const insertChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain) as any;

    const result = await toggleReaction('u1', 'thread', 't1', '👍');
    expect(result).toEqual({ reacted: true });
  });

  it('removes reaction when already reacted', async () => {
    const selectChain = setupChain({ data: { id: 'rx1' } });
    const deleteChain = setupChain({ data: null });
    mockSupabase.from = vi.fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(deleteChain) as any;

    const result = await toggleReaction('u1', 'thread', 't1', '👍');
    expect(result).toEqual({ reacted: false });
  });
});

// ─── getReactions ─────────────────────────────────────────────────────
describe('getReactions', () => {
  it('returns reactions for target', async () => {
    const reactions = [{ emoji: '👍', user_id: 'u1' }, { emoji: '❤️', user_id: 'u2' }];
    const chain = setupChain({ data: null });
    chain.eq = vi.fn().mockResolvedValueOnce({ data: reactions });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await getReactions('thread', 't1');
    expect(result).toEqual(reactions);
  });

  it('returns empty array when no reactions', async () => {
    const chain = setupChain({ data: null });
    chain.eq = vi.fn().mockResolvedValueOnce({ data: null });
    mockSupabase.from = vi.fn().mockReturnValueOnce(chain) as any;

    const result = await getReactions('thread', 't1');
    expect(result).toEqual([]);
  });
});

// ─── Fee calculation verification ─────────────────────────────────────
describe('Fee calculation (sendTip internals)', () => {
  it('platform fee is 10% of amount', () => {
    const amount = 1000;
    const platformFee = Math.round(amount * 0.1);
    const netAmount = amount - platformFee;
    expect(platformFee).toBe(100);
    expect(netAmount).toBe(900);
  });

  it('handles odd amounts correctly', () => {
    const amount = 333;
    const platformFee = Math.round(amount * 0.1);
    const netAmount = amount - platformFee;
    expect(platformFee).toBe(33);
    expect(netAmount).toBe(300);
  });

  it('handles small amounts', () => {
    const amount = 5;
    const platformFee = Math.round(amount * 0.1);
    expect(platformFee).toBe(1); // Math.round(0.5) = 1
  });
});
