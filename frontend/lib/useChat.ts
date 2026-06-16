"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "./types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useChat(currentUserId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [online, setOnline] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!currentUserId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setOnline(true);
    ws.onclose = () => setOnline(false);
    ws.onerror = () => setOnline(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setIncomingMessages((prev) => [...prev, data as Message]);
      }
    };

    return () => ws.close();
  }, [currentUserId]);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          receiver_id: receiverId,
          content,
        })
      );
    }
  }, []);

  const markRead = useCallback((senderId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "read", sender_id: senderId })
      );
    }
  }, []);

  const clearIncoming = useCallback(
    () => setIncomingMessages([]),
    []
  );

  return { online, sendMessage, markRead, incomingMessages, clearIncoming };
}
