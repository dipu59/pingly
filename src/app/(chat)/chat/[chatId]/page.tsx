import ChatWindow from '@/components/chat/ChatWindow';

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;
  return <ChatWindow chatId={chatId} />;
}
