'use client';

import { useParams } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  const params = useParams();
  return <ChatInterface sessionId={params.id as string} />;
}
