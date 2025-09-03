import { chatMessageStream } from "@/api/chat";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isStreaming?: boolean;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const botMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: botMessageId, text: '', sender: 'bot', isStreaming: true },
      ]);

      try {
 
        console.log("Calling chatMessageStream...");
        await chatMessageStream(message.trim(), (token) => {
          console.log("Received token:", token); {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, text: msg.text + token, isStreaming: true }
                : msg
            )
          );
        }      });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      } catch (error: any) {
        console.error('Chat error:', error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? {
                  ...msg,
                  text:
                    error.response?.data?.error ||
                    'Sorry, there was an error. Please try again.',
                  isStreaming: false,
                }
              : msg
          )
        );
        toast.error('Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};
