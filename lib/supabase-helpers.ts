import { supabase } from './supabase';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
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
    .select()
    .single();
  return { data, error };
}

export async function createReply(threadId: string, authorId: string, body: string) {
  const { data, error } = await supabase
    .from('replies')
    .insert({ thread_id: threadId, author_id: authorId, body })
    .select()
    .single();
  return { data, error };
}

export async function fetchReplies(threadId: string) {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      profiles:author_id (full_name, username, avatar_url, county, is_verified)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  return { data, error };
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select()
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
    .select()
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
    .select()
    .single();
  return { data, error };
}

export async function createListing(sellerId: string, title: string, description: string, price: number, category: string, location?: string) {
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({ seller_id: sellerId, title, description, price, category, location: location || null })
    .select()
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
    .select()
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
    .select()
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
    .select()
    .single();
  return { data, error };
}

export async function updateProfile(userId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
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
    .select()
    .single();
  return { data, error };
}

export async function markNotificationRead(notificationId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
}
