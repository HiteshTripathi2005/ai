import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = (msg.parts || [])
      .map((p) => (p.type === 'text' ? p.text : ''))
      .join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={`w-full flex mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`group relative max-w-[min(85%,700px)] ${
        isUser ? "ml-12" : "mr-12"
      }`}>
        {/* Avatar */}
        <div className={`flex items-center mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${
            isUser 
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
              : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"
          }`}>
            {isUser ? <User className="h-4 w-4"/> : <Bot className="h-4 w-4"/>}
          </div>
        </div>

        {/* Message bubble */}
        <div className={`relative ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        } rounded-2xl px-5 py-4`}>
          

          {/* Message content */}
          <div className={`text-sm leading-relaxed ${
            isUser 
              ? "text-white" 
              : "text-gray-800 dark:text-gray-200 prose prose-sm prose-gray dark:prose-invert max-w-none"
          }`}>
            {isUser ? (
              <div className="whitespace-pre-wrap">
                {(msg.parts || [])
                  .map((p) => (p.type === 'text' ? p.text : ''))
                  .join('')}
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(msg.parts || [])
                  .map((p) => (p.type === 'text' ? p.text : ''))
                  .join('')}
              </ReactMarkdown>
            )}
          </div>

          {/* Timestamp - subtle */}
          <div className={`text-xs mt-3 ${
            isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          }`}>
            {new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit"
            }).format(new Date(parseInt(msg.id) || Date.now()))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({ messages, status, isAuthenticated }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const scrollToBottom = (smooth = true) => {
    const el = messagesEndRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
  };

  const isAtBottom = (el) => {
    if (!el) return true;
    // allow a small threshold to account for rounding/zoom
    const threshold = 8;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setIsUserScrolledUp(!isAtBottom(el));
  };

  // Attach scroll listener
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    // Initial state
    setIsUserScrolledUp(!isAtBottom(el));
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll on new messages/status if user is at (or near) bottom
  useEffect(() => {
    if (!isUserScrolledUp) {
      scrollToBottom(true);
    }
  }, [messages, status, isUserScrolledUp]);

  // Follow growth during streaming or image loads using ResizeObserver
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !("ResizeObserver" in window)) return;

    const ro = new ResizeObserver(() => {
      if (!isUserScrolledUp) {
        // use auto to avoid “rubber-band” feel on continuous growth
        scrollToBottom(false);
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isUserScrolledUp]);

  return (
    <main className="flex-1 flex flex-col relative">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-auto px-2 md:px-6 py-4 md:py-6 space-y-3 overscroll-contain"
        id="messages-root"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-600 dark:text-blue-400 mb-6">
                <Bot className="h-8 w-8"/>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Welcome to AI Chat
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {isAuthenticated 
                  ? "Start a conversation by typing a message below. I'm here to help with any questions you have!" 
                  : "Please login to start chatting with AI and get personalized assistance."
                }
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {status === "streaming" && (
          <div className="w-full flex mb-6 justify-start">
            <div className="relative max-w-[min(85%,700px)] mr-12">
              {/* Avatar */}
              <div className="flex items-center mb-2 justify-start">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300 animate-pulse">
                  <Bot className="h-4 w-4"/>
                </div>
              </div>

              {/* Typing bubble */}
              <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-2xl px-5 py-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Assistant is typing...</span>
                </div>
              </div>

              {/* Message tail */}
              <div className="absolute top-10 w-4 h-4 transform rotate-45 -left-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* “Scroll to latest” button (shows only when user scrolled up) */}
      {isUserScrolledUp && (
        <button
          onClick={() => {
            scrollToBottom(true);
            setIsUserScrolledUp(false);
          }}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 px-3 py-2 text-sm shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title="Scroll to latest"
        >
          <ChevronDown className="h-4 w-4" />
          Latest
        </button>
      )}
    </main>
  );
}
