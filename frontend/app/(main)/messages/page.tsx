"use client";

import { useAuth } from "@/lib/auth";
import { useChat } from "@/lib/useChat";
import ChatWindow from "@/components/ChatWindow";

export default function MessagesPage() {
  const { user } = useAuth();
  const { sendMessage, markRead, incomingMessages } = useChat(
    user?.id || null
  );

  if (!user) return null;

  return (
    <ChatWindow
      currentUserId={user.id}
      sendMessage={sendMessage}
      markRead={markRead}
      incomingMessages={incomingMessages}
    />
  );
}
