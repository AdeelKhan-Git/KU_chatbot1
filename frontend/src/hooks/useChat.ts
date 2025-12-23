// useChat.ts
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { chatMessage, fetchChatData } from "@/api/chat";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load historical chat messages from API
  const loadChatHistory = useCallback(async () => {
    try {
      const history = await fetchChatData(); // fetch chat-data API
      const mapped = history.map((msg: any) => ({
        id: msg.id.toString(),
        sender: msg.role === "user" ? "user" : "bot",
        text: msg.content,
      }));
      setMessages(mapped);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Send new user message and receive bot response
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: "user",
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const botResponse = await chatMessage(message.trim());
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: "bot",
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Chat error:", error);
        toast.error("Failed to send message. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // Clear all messages
  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
};
