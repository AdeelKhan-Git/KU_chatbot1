import tokenManager from "@/lib/tokenManager";

const getBaseURL = () => import.meta.env.VITE_BASE_URL || "https://kuchatbot-production.up.railway.app/";

const authHeaders = () => {
  const token = tokenManager.getToken();
  if (!token) throw new Error("No authentication token available");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ── Chat stream ──────────────────────────────────────────────────────────────

export const chatMessageStream = async (
  message: string,
  sessionId: string,
  onToken: (token: string) => void
) => {
  const possibleBaseURLs = [
    import.meta.env.VITE_BASE_URL,
    "https://kuchatbot-production.up.railway.app/"
  ].filter(Boolean);

  let lastError = null;

  for (const baseURL of possibleBaseURLs) {
    try {
      const response = await fetch(`${baseURL}bot/chat/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ prompt: message, session_id: sessionId }),
      });

      if (!response.ok) {
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) return;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const token = line.slice(6);
            if (token !== "") onToken(token.replace(/\\n/g, "\n"));
          }
        }
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All base URLs failed");
};

// ── Chat history ─────────────────────────────────────────────────────────────

export const fetchChatData = async (sessionId: string) => {
  const response = await fetch(
    `${getBaseURL()}bot/chat-data/?session_id=${sessionId}`,
    { method: "GET", headers: authHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch chat data");
  const data = await response.json();
  return data.data ?? [];  // 👈 fallback to empty array if null
};

// ── Sessions ─────────────────────────────────────────────────────────────────

export const fetchSessions = async () => {
  const response = await fetch(`${getBaseURL()}bot/sessions/`, {
    method: "GET",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch sessions");
  const data = await response.json();
  return data.sessions ?? [];  // 👈 fallback to empty array
};

export const deleteSessionApi = async (sessionId: string) => {
  const response = await fetch(`${getBaseURL()}bot/sessions/${sessionId}/delete/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete session");
};