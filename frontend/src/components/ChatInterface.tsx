import { useChat } from "@/hooks/useChat";
import { Loader2, Send, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Header from "./Header";
import { Button } from "./ui/button";

export default function ChatInterface() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <section className="flex flex-col justify-between min-h-screen bg-[#0C0E16]">
      <div className="text-white p-5 mb-5 border-b border-gray-100">
        <Header />
      </div>

      <div className="w-full rounded-2xl shadow-xl flex flex-col h-[34rem] bg-[#181A20] border border-[#23242a]">
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-16 h-56 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-2xl font-bold">KU</span>
              </div>
              <h3 className="text-white font-semibold mb-2">
                Welcome to AskUoK!
              </h3>
              <p className="text-gray-400 text-sm max-w-md">
                Ask me anything about University of Karachi - admissions, fees,
                departments, campus life, or any other university-related
                questions.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-base shadow ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white [border-radius:16px_6px_16px_16px]"
                    : "bg-[#23242a] text-gray-100 border border-[#23242a] [border-radius:6px_16px_16px_16px]"
                }`}
              >
                <div className="whitespace-pre-line">
                  {msg.text}
                   {msg.isStreaming && msg.text.length < 1 && (
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 bg-blue-800 rounded-full animate-bounce [animation-delay:0s]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-blue-800 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="border-t border-[#23242a] bg-[#181A20] p-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="flex-1 rounded-lg px-4 py-3 bg-[#23242a] text-white border border-[#23242a] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
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
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </section>
  );
}
