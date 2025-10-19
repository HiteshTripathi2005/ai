import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loading from './Loading';
import ToolCallRenderer from './ToolCallRenderer';
import MultiModelResponse from './MultiModelResponse';

function MessageBubble({ msg, onSelectModel }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  // Extract timestamp from message id
  const getTimestamp = () => {
    const timestamp = parseInt(msg.id.replace('-ai', ''));
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get all text content from message parts
  const getMessageText = () => {
    return msg.parts
      ?.filter(part => part.type === 'text')
      ?.map(part => part.text)
      ?.join(' ') || '';
  };

  const handleCopy = async () => {
    const text = getMessageText();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const renderPart = (part, index) => {
    if (part.type === 'text') {
      return (
        <div key={`part-${msg.id}-${index}`} className={`w-full flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[min(85%,700px)] ${isUser ? "ml-12" : "mr-12"}`}>
            <div className={`inline-block px-4 py-3 rounded-lg ${isUser ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-900"}`}>
              <div className="markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    ul: ({children}) => <ul style={{listStyleType: 'disc'}}>{children}</ul>,
                    ol: ({children}) => <ol style={{listStyleType: 'decimal'}}>{children}</ol>,
                    li: ({children}) => <li>{children}</li>
                  }}
                >
                  {part.text}
                </ReactMarkdown>
              </div>
            </div>
            {/* Time and Copy Button */}
            <div className={`flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400 ${isUser ? "justify-end" : "justify-start"}`}>
              <span>{getTimestamp()}</span>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Copy message"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      );
    } else if (part.type === 'tool-call') {
      return (
        <div key={`part-${msg.id}-${index}`} className={`w-full flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[min(85%,700px)] ${isUser ? "ml-12" : "mr-12"}`}>
            <ToolCallRenderer part={part} index={index} />
          </div>
        </div>
      );
    }
    return null;
  };

  // Check if this is a multi-model message
  if (msg.isMultiModel && msg.multiModelResponses) {
    return <MultiModelResponse msg={msg} onSelectModel={onSelectModel} />;
  }

  const parts = msg.parts || [];

  return (
    <>
      {parts.map((part, index) => renderPart(part, index))}
    </>
  );
}

export default function ChatArea({ messages, status, isAuthenticated, isLoadingMessages, onSelectModel }) {
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
          <div className="flex-1 h-[calc(100vh-200px)] flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                Welcome to AI Chat
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onSelectModel={onSelectModel} />)
        )}

        {status === "streaming" && (
          <div className="w-full flex mb-6 justify-start">
            <div className="max-w-[min(85%,700px)] mr-12">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                AI is thinking...
              </div>
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
