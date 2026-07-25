import type { SupabaseClient } from '@/lib/supabase';
import type { Notification } from '@/types';

/** Insert a user-facing notification with schema-aligned fields. */
export async function insertNotification(
  sb: SupabaseClient,
  row: {
    user_id: string;
    actor_id?: string;
    type: Notification['type'];
    title: string;
    body?: string;
    related_id?: string;
  },
) {
  if (row.actor_id && row.actor_id === row.user_id) return;
  const { error } = await sb.from('notifications').insert({
    user_id: row.user_id,
    actor_id: row.actor_id ?? null,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    related_id: row.related_id ?? null,
    is_read: false,
  });
  if (error) console.warn('[notifications] insert failed', error.message);
}

export function notificationHref(n: Notification): string | null {
  if (!n.related_id) return null;
  if (n.type === 'reply' || n.type === 'upvote' || n.type === 'accept') {
    return `/thread/${n.related_id}`;
  }
  return null;
}
