import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { chatMessageStream, fetchChatData } from "@/api/chat";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export const useChat = (
  sessionId: string,
  pushSession: (id: string, title: string) => void
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setMessages([]);
    fetchChatData(sessionId)
      .then((history) => {
        if (!history || history.length === 0) return; // 👈 new session = no history, just show empty
        const mapped = history.map((msg: any) => ({
          id: msg.id.toString(),
          sender: msg.role === "user" ? "user" : "bot",
          text: msg.content,
        }));
        setMessages(mapped);
      })
      .catch((err) => {
        console.error("Failed to load chat history:", err);
        // 👈 don't crash — just start with empty messages
      });
  }, [sessionId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading || !sessionId) return; // 👈 guard against empty sessionId

      pushSession(sessionId, message.trim());

      const userMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: "user",
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setIsStreaming(true);

      const botId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: botId, text: "", sender: "bot" }]);

      try {
        await chatMessageStream(message.trim(), sessionId, (token: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botId ? { ...msg, text: msg.text + token } : msg
            )
          );
        });
      } catch (error) {
        console.error("Chat error:", error);
        toast.error("Failed to send message. Please try again.");
        setMessages((prev) => prev.filter((msg) => msg.id !== botId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [isLoading, sessionId, pushSession]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, isStreaming, sendMessage, clearMessages };
};