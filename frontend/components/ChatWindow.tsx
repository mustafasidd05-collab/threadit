"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { chatApi } from "@/lib/api";
import type { Message, Conversation } from "@/lib/types";

interface Props {
  currentUserId: string;
  sendMessage: (receiverId: string, content: string) => void;
  markRead: (senderId: string) => void;
  incomingMessages: Message[];
}

export default function ChatWindow({
  currentUserId,
  sendMessage,
  markRead,
  incomingMessages,
}: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [activeUsername, setActiveUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.conversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    if (incomingMessages.length === 0) return;
    const latest = incomingMessages[incomingMessages.length - 1];
    if (
      activeConvo &&
      (latest.sender_id === activeConvo ||
        latest.receiver_id === activeConvo)
    ) {
      setMessages((prev) => [...prev, latest]);
      markRead(activeConvo);
    }
    chatApi.conversations().then(setConversations).catch(() => {});
  }, [incomingMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (otherUserId: string, otherUsername: string) => {
    setActiveConvo(otherUserId);
    setActiveUsername(otherUsername);
    setLoading(true);
    try {
      const msgs = await chatApi.messages(otherUserId);
      setMessages(msgs);
      markRead(otherUserId);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvo) return;
    sendMessage(activeConvo, input.trim());
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: activeConvo,
      content: input.trim(),
      sent_time: new Date().toISOString(),
      read_status: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Conversation list */}
      <div className="w-64 border-r border-border bg-surface-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="font-heading font-bold text-base text-gold mb-4">
            Messages
          </h2>
          {conversations.length === 0 && (
            <p className="text-sm text-txt-muted">No conversations yet</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.other_user}
              onClick={() => openConversation(c.other_user, c.other_username)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all duration-150
                ${activeConvo === c.other_user
                  ? "bg-gold/10 border border-gold/20"
                  : "hover:bg-surface-3"
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-txt">
                  @{c.other_username}
                </span>
                {c.unread_count > 0 && (
                  <span className="bg-gold text-base text-xs font-mono px-1.5 py-0.5 rounded-full">
                    {c.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-txt-muted mt-0.5 truncate">
                {c.last_message}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col">
        {activeConvo ? (
          <>
            <div className="px-6 py-3 border-b border-border bg-surface-1">
              <span className="font-heading font-semibold text-txt">
                @{activeUsername}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const mine = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                          ${mine
                            ? "bg-gold/15 text-txt rounded-br-md"
                            : "bg-surface-3 text-txt rounded-bl-md"
                          }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-[10px] mt-1 font-mono ${
                            mine ? "text-gold/60" : "text-txt-muted"
                          }`}
                        >
                          {formatDistanceToNow(new Date(msg.sent_time), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-border bg-surface-1"
            >
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary text-sm">
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-txt-muted font-mono text-sm">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
