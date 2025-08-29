import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MessageBubble({ msg }) {
  const isUser = msg.role === "user"; // user -> right, assistant -> left
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = (msg.parts || [])
      .map((p) => (p.type === 'text' ? p.text : ''))
      .join('');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const timestamp = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(parseInt(msg.id) || Date.now()));

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`group relative max-w-[min(82%,800px)] w-fit ${
        isUser
          ? "bg-blue-500 text-white"
          : "bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70"
      } rounded-2xl px-4 md:px-5 py-3 shadow-sm`}>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
          <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
            isUser ? "bg-blue-600 text-white" : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
          }`}>
            {isUser ? <User className="h-3.5 w-3.5"/> : <Bot className="h-3.5 w-3.5"/>}
          </div>
          <span className={`font-medium ${isUser ? "text-blue-100" : "text-zinc-600 dark:text-zinc-300"}`}>
            {isUser ? "You" : "Assistant"}
          </span>
          <span className={isUser ? "text-blue-200" : "text-zinc-400"}>•</span>
          <span className={isUser ? "text-blue-200" : "text-zinc-400"}>{timestamp}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              title="Copy"
            >
              {copied ? <Check className="h-3.5 w-3.5"/> : <Copy className="h-3.5 w-3.5"/>}
            </button>
          )}
        </div>
        <div className={`prose prose-zinc dark:prose-invert max-w-none prose-p:my-3 prose-pre:my-3 ${
          isUser ? "prose-invert" : ""
        }`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(msg.parts || [])
              .map((p) => (p.type === 'text' ? p.text : ''))
              .join('')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

export default function ChatArea({ messages, status, error }) {
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
          <div className="text-center mt-8">
            <div className="text-gray-500 text-lg mb-2">Welcome to AI Chat</div>
            <div className="text-gray-400 text-sm">
              Start a conversation by typing a message below
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {status === "streaming" && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                  Assistant
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-400">typing...</span>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
              {String(error.message || error)}
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
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-2 text-sm shadow hover:opacity-90"
          title="Scroll to latest"
        >
          <ChevronDown className="h-4 w-4" />
          Latest
        </button>
      )}
    </main>
  );
}
