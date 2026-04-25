import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";
import { Loader2, Send, Trash2, Plus, Menu } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Header from "./Header";
import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatInterface() {
  const { sessions, activeSessionId, setActiveSessionId, createNewSession, deleteSession, pushSession } = useSessions();
  const { messages, isLoading, sendMessage, clearMessages } = useChat(activeSessionId, pushSession);
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    // Only run on mobile screens
    if (window.innerWidth >= 768) return;

    if (
      sidebarRef.current &&
      !sidebarRef.current.contains(event.target as Node)
    ) {
      setSidebarOpen(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    createNewSession();
    clearMessages();
  };

  const handleSelectSession = (session_id: string) => {
    setActiveSessionId(session_id);
  };

  // group sessions by date for sidebar
  const groupByDate = (sessions: any[]) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    return sessions.reduce((acc: any, s: any) => {
      const d = new Date(s.last_activity).toDateString();
      const label = d === today ? "Today" : d === yesterday ? "Yesterday" : d;
      if (!acc[label]) acc[label] = [];
      acc[label].push(s);
      return acc;
    }, {});
  };

  const grouped = groupByDate(sessions);

  return (
    <div className="flex min-h-screen bg-[#0C0E16]">

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <aside 
          ref={sidebarRef}
          className={`fixed top-0 left-0 z-40 h-screen w-[300px] bg-[#13151E] border-r border-[#23242a] flex flex-col transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
          <div className="p-3 border-b border-[#23242a]">
            <button
              onClick={handleNewChat}
              className="relative w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-900/30 border border-blue-800/40 text-blue-400 text-sm hover:bg-blue-900/50"
            >
              <Plus className="w-4 h-4 right-2 top-2.5" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {Object.entries(grouped).map(([label, items]) => (
              <div key={label}>
                <p className="text-xs text-gray-600 px-2 py-1 mt-2">{label}</p>
                {(items as any[]).map((s) => (
                  <div
                    key={s.session_id}
                    onClick={() => handleSelectSession(s.session_id)}
                    className={`relative mb-2 group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer text-xs transition-colors ${
                      activeSessionId === s.session_id
                        ? "bg-[#23242a] text-white"
                        : "text-gray-400 bg-[#242424] hover:bg-[#1a1c24]"
                    }`}
                  >
                    <span className="truncate flex-1">{s.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(s.session_id); }}
                      className="opacity-100 group-hover:opacity-100 text-gray-600 hover:text-red-400 ml-1 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 top-[15px] right-[15px]" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* ── Main chat area — your existing UI, barely touched ── */}
      <section
        className={`flex flex-col justify-between flex-1 bg-[#0C0E16] transition-all duration-300 
        ${sidebarOpen ? "md:ml-[300px]" : "ml-0"}`}
      >

        {/* Header row with sidebar toggle */}
        <div className="text-white p-5 mb-5 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5 top-[37px]" />
          </button>
          <Header />
        </div>

        <div className="w-full rounded-2xl shadow-xl flex flex-col bg-[#181A20] border border-[#23242a] min-h-[86vh]">
          <div className="flex items-center justify-between p-4 border-b border-[#23242a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">AskUoK Assistant</h3>
                <p className="text-gray-400 text-xs">University of Karachi AI</p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="text-gray-400 cta hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Messages — unchanged from your original */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-16 h-56 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white text-2xl font-bold">KU</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Welcome to AskUoK!</h3>
                <p className="text-gray-400 text-sm max-w-md">
                  Ask me anything about University of Karachi - admissions, fees,
                  departments, campus life, or any other university-related questions.
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-base shadow ${
                    msg.sender === "user"
                      ? "bg-[#23242a] text-white border border-[#23242a] overflow-hidden [border-radius:16px_6px_16px_16px]"
                      : "bg-[#23242a] text-gray-100 border border-[#23242a] [border-radius:6px_16px_16px_16px]"
                  }`}
                >
                  <div className="markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table({ node, children, ...props }) {
                          return (
                            <div className="table-wrapper sm:overflow-x-hidden overflow-x-scroll">
                              <table {...props}>{children}</table>
                            </div>
                          );
                        },
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input — unchanged from your original */}
          <form
            className="border-t border-[#23242a] bg-[#181A20] p-4 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <input
              type="text"
              className="flex-1 sm:min-w-auto min-w-[177px] rounded-lg px-4 py-3 bg-[#23242a] text-white border border-[#23242a] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
              placeholder="Ask anything about University of Karachi..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 cta h-full hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}