import { supabase } from './supabase';

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
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  return !!data;
}

export async function createThread(authorId: string, title: string, body: string, type: string = 'post', tags: string[] = [], bountyAmount?: number, spaceId?: string) {
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
  const { data, error } = await supabase
    .from('replies')
    .insert({ thread_id: threadId, author_id: authorId, body })
    .select('id, thread_id, author_id, body, likes_count, created_at')
    .single();
  return { data, error };
}

export async function fetchReplies(threadId: string) {
  const { data, error } = await supabase
    .from('replies')
    .select('id, thread_id, author_id, body, likes_count, created_at, profiles:author_id (full_name, username, avatar_url, county, is_verified)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
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
  const { data } = await supabase
    .from('space_members')
    .select('id')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

export async function sendTip(fromUserId: string, toUserId: string, amount: number, rating: number, comment?: string, sessionId?: string) {
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
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({ seller_id: sellerId, title, description, price, category, location: location || null })
    .select('id, seller_id, title, description, price, category, location, is_available, created_at')
    .single();
  return { data, error };
}

export async function markListingSold(listingId: string) {
  const { error } = await supabase
    .from('marketplace_listings')
    .update({ is_available: false })
    .eq('id', listingId);
  return { error };
}

export async function createAlert(reporterId: string, type: string, title: string, description: string, location: string, county: string) {
  const { data, error } = await supabase
    .from('nyumba_kumi_alerts')
    .insert({ reporter_id: reporterId, type, title, description, location, county })
    .select('id, reporter_id, type, title, description, location, county, confirmations_count, created_at')
    .single();
  return { data, error };
}

export async function confirmAlert(alertId: string) {
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
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}

export async function toggleReaction(userId: string, targetType: 'thread' | 'reply', targetId: string, emoji: string) {
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
  const { data } = await supabase
    .from('reactions')
    .select('emoji, user_id')
    .eq('target_type', targetType)
    .eq('target_id', targetId);
  return data || [];
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  media_duration_seconds: number | null;
  caption: string;
  created_at: string;
  expires_at: string;
  profiles?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    county: string | null;
    is_verified: boolean;
  };
  view_count?: number;
  has_viewed?: boolean;
}

const STORY_SELECT = `
  id, user_id, media_url, media_type, media_duration_seconds, caption, created_at, expires_at,
  profiles:user_id (
    full_name, username, avatar_url, county, is_verified
  )
`;

export async function fetchActiveStories() {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  return { data: data as Story[] | null, error };
}

export async function createStory(userId: string, mediaUrl: string, mediaType: 'image' | 'video', caption: string, durationSeconds?: number) {
  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      media_url: mediaUrl,
      media_type: mediaType,
      caption: caption || '',
      media_duration_seconds: durationSeconds || null,
    })
    .select(STORY_SELECT)
    .single();
  return { data: data as Story | null, error };
}

export async function viewStory(storyId: string, viewerId: string) {
  await supabase
    .from('story_views')
    .upsert({ story_id: storyId, viewer_id: viewerId }, { onConflict: 'story_id,viewer_id' });
}

export async function getStoryViewCount(storyId: string) {
  const { count } = await supabase
    .from('story_views')
    .select('id', { count: 'exact', head: true })
    .eq('story_id', storyId);
  return count || 0;
}

export async function deleteStory(storyId: string) {
  const { error } = await supabase.from('stories').delete().eq('id', storyId);
  return { error };
}

export async function uploadStoryMedia(file: File, userId: string, onProgress?: (pct: number) => void): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('stories').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return { url: null, error: error.message };
  if (onProgress) onProgress(100);
  const { data } = supabase.storage.from('stories').getPublicUrl(path);
  return { url: data?.publicUrl || null, error: null };
}
