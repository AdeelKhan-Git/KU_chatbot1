import tokenManager from "@/lib/tokenManager";
import { apiClient } from "./axios";

export const chatMessage = async (message: string) => {
  try {
    const response = await apiClient.post("api/chat/", {
      prompt: message,
    });
    return response;
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
        console.log("Trying streaming request to:", `${baseURL}api/chat/`);

        const response = await fetch(`${baseURL}api/chat/`, {
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