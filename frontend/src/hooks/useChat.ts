import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { chatMessageStream, fetchChatData } from "@/api/chat";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const loadChatHistory = useCallback(async () => {
    try {
      const history = await fetchChatData();
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

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: "user",
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setIsStreaming(false);

      // Add empty bot message that we'll fill in as chunks arrive
      const botId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: botId, text: "", sender: "bot" },
      ]);

      try {
        await chatMessageStream(message.trim(), (token: string) => {
          // Append each chunk to the bot message in real time
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botId
                ? { ...msg, text: msg.text + token }
                : msg
            )
          );
        });
      } catch (error) {
        console.error("Chat error:", error);
        toast.error("Failed to send message. Please try again.");
        // Remove the empty bot message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== botId));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading,isStreaming, sendMessage, clearMessages };
};