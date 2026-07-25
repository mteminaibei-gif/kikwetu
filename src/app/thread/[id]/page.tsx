import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import ThreadView from '@/components/ThreadView';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const sb = await createClient();
  const { data: thread } = await sb.from('threads').select('title, content').eq('id', resolvedParams.id).single();
  
  if (!thread) {
    return { title: 'Thread Not Found | Kikwetu Connect' };
  }
  
  return {
    title: `${thread.title} | Kikwetu Connect`,
    description: thread.content.slice(0, 150) + '...',
  };
}

export default async function ThreadPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const sb = await createClient();
  
  const [tRes, rRes] = await Promise.all([
    sb.from('threads').select('*, author:profiles(full_name, avatar_url, verified, county), space:spaces(name)').eq('id', id).single(),
    sb.from('replies').select('*, author:profiles(full_name, avatar_url, verified)').eq('thread_id', id).order('created_at', { ascending: true }),
  ]);

  return <ThreadView threadId={id} initialThread={tRes.data as any || null} initialReplies={rRes.data as any || []} />;
}
