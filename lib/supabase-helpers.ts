import { supabase } from './supabase';

/** True for placeholder IDs like mock-nw, mock-3 — must never be sent to Postgres UUID columns. */
export function isMockId(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return true;
  return id.startsWith('mock-') || id === '1' || id === 'undefined' || id === 'null';
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, user_id, username, full_name, avatar_url, bio, county, language, role, heshima, is_verified, is_online, interests, mpesa_number, notification_prefs, privacy_prefs, expertise_areas, teaching_levels, hourly_rate, created_at, updated_at')
    .eq('user_id', user.id)
    .single();
  return profile;
}

export async function toggleVote(userId: string, targetType: 'thread' | 'reply', targetId: string, value: 1 | -1) {
  if (isMockId(userId) || isMockId(targetId)) return { voted: false, delta: 0 };

  const { data: existing } = await supabase
    .from('votes')
    .select('id, value')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single();

  if (existing) {
    if (existing.value === value) {
      await supabase.from('votes').delete().eq('id', existing.id);
      return { voted: false, delta: -value };
    } else {
      await supabase.from('votes').update({ value }).eq('id', existing.id);
      return { voted: true, delta: value * 2 };
    }
  } else {
    await supabase.from('votes').insert({ user_id: userId, target_type: targetType, target_id: targetId, value });
    return { voted: true, delta: value };
  }
}

export async function checkVote(userId: string, targetType: 'thread' | 'reply', targetId: string) {
  if (isMockId(userId) || isMockId(targetId)) return null;

  const { data } = await supabase
    .from('votes')
    .select('id, value')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single();
  return data;
}

export async function toggleSave(userId: string, targetType: 'thread' | 'reply' | 'listing', targetId: string) {
  if (isMockId(userId) || isMockId(targetId)) return false;

  const { data: existing } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single();

  if (existing) {
    await supabase.from('saved_items').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('saved_items').insert({ user_id: userId, target_type: targetType, target_id: targetId });
    return true;
  }
}

export async function checkSaved(userId: string, targetType: 'thread' | 'reply' | 'listing', targetId: string) {
  if (isMockId(userId) || isMockId(targetId)) return false;

  const { data } = await supabase
    .from('saved_items')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .single();
  return !!data;
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (isMockId(followerId) || isMockId(followingId)) return false;

  const { data: existing } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();

  if (existing) {
    await supabase.from('follows').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    return true;
  }
}

export async function checkFollowing(followerId: string, followingId: string) {
  if (isMockId(followerId) || isMockId(followingId)) return false;

  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  return !!data;
}

export async function createThread(authorId: string, title: string, body: string, type: string = 'post', tags: string[] = [], bountyAmount?: number, spaceId?: string) {
  if (isMockId(authorId)) return { data: null, error: new Error('Invalid author') };

  const { data, error } = await supabase
    .from('threads')
    .insert({
      author_id: authorId,
      title,
      body,
      type,
      tags,
      bounty_amount: bountyAmount || null,
      space_id: spaceId || null,
    })
    .select('id, author_id, title, body, type, bounty_amount, tags, likes_count, comments_count, created_at')
    .single();
  return { data, error };
}

export async function createReply(threadId: string, authorId: string, body: string) {
  if (isMockId(threadId) || isMockId(authorId)) return { data: null, error: new Error('Invalid id') };

  const { data, error } = await supabase
    .from('replies')
    .insert({ thread_id: threadId, author_id: authorId, body })
    .select('id, thread_id, author_id, body, likes_count, created_at')
    .single();
  return { data, error };
}

export async function fetchReplies(threadId: string) {
  if (isMockId(threadId)) return { data: [], error: null };

  const { data, error } = await supabase
    .from('replies')
    .select('id, thread_id, author_id, body, likes_count, created_at, profiles:author_id (full_name, username, avatar_url, county, is_verified)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  if (isMockId(conversationId) || isMockId(senderId)) return { data: null, error: new Error('Invalid id') };

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select('id, conversation_id, sender_id, body, created_at')
    .single();

  if (!error) {
    await supabase
      .from('conversations')
      .update({ last_message: body, last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
  }

  return { data, error };
}

export async function createConversation(participantIds: string[], firstMessage?: string) {
  if (participantIds.some(isMockId)) return { data: null, error: new Error('Invalid participant') };

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({ last_message: firstMessage || null, last_message_at: firstMessage ? new Date().toISOString() : null })
    .select('id, last_message, last_message_at, created_at')
    .single();

  if (convError || !conv) return { data: null, error: convError };

  const participants = participantIds.map(uid => ({
    conversation_id: conv.id,
    user_id: uid,
  }));
  await supabase.from('conversation_participants').insert(participants);

  if (firstMessage) {
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_id: participantIds[0],
      body: firstMessage,
    });
  }

  return { data: conv, error: null };
}

export async function joinSpace(spaceId: string, userId: string) {
  if (isMockId(spaceId) || isMockId(userId)) return false;

  const { data: existing } = await supabase
    .from('space_members')
    .select('id')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('space_members').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('space_members').insert({ space_id: spaceId, user_id: userId });
    return true;
  }
}

export async function checkSpaceMember(spaceId: string, userId: string) {
  if (isMockId(spaceId) || isMockId(userId)) return false;

  const { data } = await supabase
    .from('space_members')
    .select('id')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function sendTip(fromUserId: string, toUserId: string, amount: number, rating: number, comment?: string, sessionId?: string) {
  if (isMockId(fromUserId) || isMockId(toUserId)) return { data: null, error: new Error('Invalid user') };

  const platformFee = Math.round(amount * 0.1);
  const netAmount = amount - platformFee;
  const { data, error } = await supabase
    .from('tips')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      rating,
      comment: comment || null,
      session_id: sessionId || null,
      status: 'completed',
    })
    .select('id, from_user_id, to_user_id, amount, platform_fee, net_amount, rating, comment, session_id, status, created_at')
    .single();
  return { data, error };
}

export async function createListing(sellerId: string, title: string, description: string, price: number, category: string, location?: string) {
  if (isMockId(sellerId)) return { data: null, error: new Error('Invalid seller') };

  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({ seller_id: sellerId, title, description, price, category, location: location || null })
    .select('id, seller_id, title, description, price, category, location, is_available, created_at')
    .single();
  return { data, error };
}

export async function markListingSold(listingId: string) {
  if (isMockId(listingId)) return { error: new Error('Invalid listing') };

  const { error } = await supabase
    .from('marketplace_listings')
    .update({ is_available: false })
    .eq('id', listingId);
  return { error };
}

export async function createAlert(reporterId: string, type: string, title: string, description: string, location: string, county: string) {
  if (isMockId(reporterId)) return { data: null, error: new Error('Invalid reporter') };

  const { data, error } = await supabase
    .from('nyumba_kumi_alerts')
    .insert({ reporter_id: reporterId, type, title, description, location, county })
    .select('id, reporter_id, type, title, description, location, county, confirmations_count, created_at')
    .single();
  return { data, error };
}

export async function confirmAlert(alertId: string) {
  if (isMockId(alertId)) return { error: new Error('Invalid alert') };

  const { data: alert } = await supabase
    .from('nyumba_kumi_alerts')
    .select('confirmations_count')
    .eq('id', alertId)
    .single();

  if (alert) {
    const { error } = await supabase
      .from('nyumba_kumi_alerts')
      .update({ confirmations_count: alert.confirmations_count + 1 })
      .eq('id', alertId);
    return { error };
  }
  return { error: null };
}

export async function submitQuizResult(quizId: string, userId: string, score: number, totalQuestions: number, timeTaken?: number) {
  if (isMockId(quizId) || isMockId(userId)) return { data: null, error: new Error('Invalid id') };

  const { data, error } = await supabase
    .from('quiz_results')
    .insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      total_questions: totalQuestions,
      time_taken_seconds: timeTaken || null,
    })
    .select('id, quiz_id, user_id, score, total_questions, time_taken_seconds, created_at')
    .single();
  return { data, error };
}

export async function requestSession(studentId: string, professionalId: string, title: string, description?: string) {
  if (isMockId(studentId) || isMockId(professionalId)) {
    return { data: null, error: new Error('Cannot request session for placeholder professional') };
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      student_id: studentId,
      professional_id: professionalId,
      title,
      description: description || null,
    })
    .select('id, student_id, professional_id, title, description, status, created_at')
    .single();
  return { data, error };
}

const PROFILE_ALLOWED_FIELDS = [
  'username', 'full_name', 'avatar_url', 'bio', 'county', 'language',
  'interests', 'mpesa_number', 'notification_prefs', 'privacy_prefs',
  'expertise_areas', 'teaching_levels', 'hourly_rate',
];

export async function updateProfile(userId: string, updates: Record<string, any>) {
  if (isMockId(userId)) return { error: new Error('Invalid user') };

  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => PROFILE_ALLOWED_FIELDS.includes(k))
  );
  if (Object.keys(safeUpdates).length === 0) return { error: new Error('No valid fields to update') };
  const { error } = await supabase
    .from('profiles')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  return { error };
}

export async function createReport(reporterId: string, targetType: string, targetId: string, reason: string, description?: string) {
  if (isMockId(reporterId) || isMockId(targetId)) return { data: null, error: new Error('Invalid id') };

  const { data, error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      description: description || null,
    })
    .select('id, reporter_id, target_type, target_id, reason, description, created_at')
    .single();
  return { data, error };
}

export async function markNotificationRead(notificationId: string) {
  if (isMockId(notificationId)) return;
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  if (isMockId(userId)) return;
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function toggleReaction(userId: string, targetType: 'thread' | 'reply', targetId: string, emoji: string) {
  if (isMockId(userId) || isMockId(targetId)) return { reacted: false };

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', userId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('emoji', emoji)
    .single();

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id);
    return { reacted: false };
  } else {
    await supabase.from('reactions').insert({ user_id: userId, target_type: targetType, target_id: targetId, emoji });
    return { reacted: true };
  }
}

export async function getReactions(targetType: 'thread' | 'reply', targetId: string) {
  if (isMockId(targetId)) return [];

  const { data } = await supabase
    .from('reactions')
    .select('emoji, user_id')
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  return data || [];
}
