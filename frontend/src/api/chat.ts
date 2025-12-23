import tokenManager from "@/lib/tokenManager";
import { apiClient } from "./axios";

export const chatMessage = async (message: string) => {
  try {
    const response = await apiClient.post("bot/chat/", { prompt: message });
    return response.data.response; // full text
  } catch (error) {
    console.error("Chat API error:", error);
    throw error;
  }
};

export const chatMessageStream = async (
  message: string,
  onToken: (token: string) => void
) => {
  try {
    const token = tokenManager.getToken();
    if (!token) {
      throw new Error("No authentication token available");
    }
    const possibleBaseURLs = [
      import.meta.env.VITE_BASE_URL,
      "http://127.0.0.1:8000/",
      "http://localhost:8000/",
    ].filter(Boolean);

    let lastError = null;

    for (const baseURL of possibleBaseURLs) {
      try {
        console.log("Trying streaming request to:", `${baseURL}bot/chat/`);

        const response = await fetch(`${baseURL}bot/chat/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prompt: message }),
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "Streaming response error:",
            response.status,
            errorText
          );
          lastError = new Error(`HTTP error! status: ${response.status}`);
          continue;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          lastError = new Error("No response body reader available");
          continue;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let tokenCount = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("Stream completed, total tokens:", tokenCount);
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const token = line.slice(6);
              if (token.trim()) {
                tokenCount++;
                onToken(token);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed with baseURL ${baseURL}:`, error);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error("All base URLs failed");
  } catch (error) {
    console.error("Chat streaming error:", error);
    throw error;
  }
};
// chat.ts
export const fetchChatData = async () => {
  try {
    const token = tokenManager.getToken();
    if (!token) throw new Error("No authentication token available");

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}bot/chat-data/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to fetch chat data");
    }

    const data = await response.json();
    return data.data; // array of chat messages
  } catch (error) {
    console.error("Fetch chat data error:", error);
    throw error;
  }
};
