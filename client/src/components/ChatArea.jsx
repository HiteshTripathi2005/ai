import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, ChevronDown, Sparkles, Award } from "lucide-react";
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

  // Check if this is a multi-model message
  if (msg.isMultiModel && msg.multiModelResponses) {
    return <MultiModelResponse msg={msg} onSelectModel={onSelectModel} />;
  }

  const parts = msg.parts || [];

  // Separate images, text, and tool calls
  const images = parts.filter(p => p.type === 'image');
  const textParts = parts.filter(p => p.type === 'text');
  const toolCalls = parts.filter(p => p.type === 'tool-call');

  // If only tool calls, render them separately
  if (toolCalls.length > 0 && images.length === 0 && textParts.length === 0) {
    return (
      <>
        {toolCalls.map((part, index) => (
          <div key={`part-${msg.id}-${index}`} className={`w-full flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[min(85%,700px)] ${isUser ? "ml-12" : "mr-12"}`}>
              <ToolCallRenderer part={part} index={index} />
            </div>
          </div>
        ))}
      </>
    );
  }

  // Combine images and text into one message bubble
  return (
    <div className={`w-full flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[min(85%,700px)] ${isUser ? "ml-12" : "mr-12"}`}>
        <div className="inline-block">
          {/* Images at the top */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((img, imgIndex) => (
                <div key={`img-${imgIndex}`} className="inline-block rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={img.image}
                    alt={`Uploaded image ${imgIndex + 1}`}
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Comparison Result Badge */}
          {msg.comparisonResult && !isUser && (
            <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs">
              <Award className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-700 dark:text-purple-300">
                Best Response: {msg.comparisonResult.selectedModel}
              </span>
              <span className="text-purple-600 dark:text-purple-400 border-l border-purple-300 dark:border-purple-700 pl-2">
                {msg.comparisonResult.reasoning}
              </span>
            </div>
          )}

          {/* Text below images */}
          {textParts.length > 0 && (
            <div className={`px-4 py-3 rounded-lg ${isUser ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-900"}`}>
              <div className="markdown-content">
                {textParts.map((part, index) => (
                  <ReactMarkdown
                    key={`text-${index}`}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      ul: ({children}) => <ul style={{listStyleType: 'disc'}}>{children}</ul>,
                      ol: ({children}) => <ol style={{listStyleType: 'decimal'}}>{children}</ol>,
                      li: ({children}) => <li>{children}</li>
                    }}
                  >
                    {part.text}
                  </ReactMarkdown>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time and Copy Button */}
        <div className={`flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400 ${isUser ? "justify-end" : "justify-start"}`}>
          <span>{getTimestamp()}</span>
          {textParts.length > 0 && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Tool calls below */}
        {toolCalls.length > 0 && (
          <div className="mt-2">
            {toolCalls.map((part, index) => (
              <ToolCallRenderer key={`tool-${index}`} part={part} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
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
    <main className="flex flex-col h-full w-full">
      <div
        ref={messagesContainerRef}
        className="h-full overflow-y-auto overflow-x-hidden px-2 md:px-6 py-4 md:py-6 space-y-3"
        id="messages-root"
        style={{ WebkitOverflowScrolling: 'touch' }}
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
    </main>
  );
}
