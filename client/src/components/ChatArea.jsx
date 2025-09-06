import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, User, Bot, ChevronDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loading from './Loading';
import ToolCallRenderer from './ToolCallRenderer';

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const renderPart = (part, index) => {
    switch (part.type) {
      case 'text':
        return isUser ? (
          <div key={index} className="whitespace-pre-wrap">
            {part.text}
          </div>
        ) : (
          <ReactMarkdown key={index} remarkPlugins={[remarkGfm]}>
            {part.text}
          </ReactMarkdown>
        );

      case 'tool-call':
      case 'tool-result':
        // Tool cards are rendered outside of the bubble; ToolCallRenderer
        // returns the card content itself, but the wrapper is added where
        // we place the card in the sequence below.
        return <ToolCallRenderer key={index} part={part} index={index} />;

      default:
        return null;
    }
  };

  // Helper to render a regular message bubble for a given array of text parts
  const renderBubble = (textParts, keySuffix) => {
    return (
      <div key={`bubble-${msg.id}-${keySuffix}`} className={`w-full flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
        <div className={`group relative max-w-[min(85%,700px)] ${isUser ? "ml-12" : "mr-12"}`}>
          {/* Avatar */}
          <div className={`flex items-center mb-2 ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm ${isUser ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"}`}>
              {isUser ? <User className="h-4 w-4"/> : <Bot className="h-4 w-4"/>}
            </div>
          </div>

          <div className={`relative ${isUser ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"} rounded-2xl px-5 py-4`}>
            <div className={`text-sm leading-relaxed ${isUser ? "text-white" : "text-gray-800 dark:text-gray-200 prose prose-sm prose-gray dark:prose-invert max-w-none"}`}>
              {textParts.map((part, idx) => renderPart(part, `inner-${keySuffix}-${idx}`))}
            </div>

            <div className={`text-xs mt-3 ${isUser ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
              {new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(parseInt(msg.id) || Date.now()))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Build sequence preserving original order: flush text segments into bubbles,
  // and render tool cards as separate elements in the stream.
  const nodes = [];
  const parts = msg.parts || [];
  let textBuffer = [];
  let seq = 0;

  const flushTextBuffer = () => {
    if (textBuffer.length > 0) {
      nodes.push(renderBubble(textBuffer, seq));
      seq += 1;
      textBuffer = [];
    }
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === 'text') {
      textBuffer.push(part);
    } else if (part.type === 'tool-call' || part.type === 'tool-result') {
      // Flush any accumulated text first, then render the tool card aligned to the same side
      flushTextBuffer();
      nodes.push(
        <div key={`tool-${msg.id}-${i}`} className={`w-full flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[min(85%,700px)] ${isUser ? "ml-12" : "mr-12"}`}>
            {renderPart(part, i)}
          </div>
        </div>
      );
      seq += 1;
    }
  }

  flushTextBuffer();

  return <>{nodes}</>;
}

export default function ChatArea({ messages, status, isAuthenticated, isLoadingMessages }) {
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
        {messages.length === 0 && !isLoadingMessages ? (
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
        ) : messages.length === 0 && isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <Loading />
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
