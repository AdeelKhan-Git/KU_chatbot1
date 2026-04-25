import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { fetchSessions, deleteSessionApi } from "@/api/chat";

export interface Session {
  session_id: string;
  title: string;
  last_activity: string;
}

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    // on refresh, restore last session from localStorage
    return localStorage.getItem("active_session_id") || uuidv4();
});

  useEffect(() => {
    fetchSessions()
      .then(data => setSessions(data))
      .catch(err => console.error("Failed to load sessions:", err));
  }, []);

  // persist active session to localStorage
  useEffect(() => {
    localStorage.setItem("active_session_id", activeSessionId);
  }, [activeSessionId]);

  const createNewSession = useCallback(() => {
    const id = uuidv4();
    setActiveSessionId(id);
    return id;
  }, []);

  const deleteSession = useCallback(async (session_id: string) => {
    await deleteSessionApi(session_id);
    setSessions(prev => prev.filter(s => s.session_id !== session_id));
    // if deleted session was active, start a fresh one
    if (activeSessionId === session_id) {
      const id = uuidv4();
      setActiveSessionId(id);
    }
  }, [activeSessionId]);

  // called after first message to push session to sidebar
  const pushSession = useCallback((session_id: string, title: string) => {
    setSessions(prev => {
      if (prev.find(s => s.session_id === session_id)) return prev;
      return [
        { session_id, title: title.slice(0, 60), last_activity: new Date().toISOString() },
        ...prev,
      ];
    });
  }, []);

  return { sessions, activeSessionId, setActiveSessionId, createNewSession, deleteSession, pushSession };
};