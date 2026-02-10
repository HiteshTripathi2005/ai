import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Loading from './Loading';
import ToolCallRenderer from './ToolCallRenderer';
import MultiModelResponse from './MultiModelResponse';
import ComparisonResponse from './ComparisonResponse';

function MessageBubble({ msg, onSelectModel }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const getTimestamp = () => {
    const timestamp = parseInt(msg.id.replace('-ai', ''));
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = async () => {
    const text = msg.parts
      ?.filter(part => part.type === 'text')
      ?.map(part => part.text)
      ?.join(' ') || '';

    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Check if this is a comparison message
  if (msg.isComparison) {
    return <ComparisonResponse msg={msg} />;
  }

  // Multi-model response
  if (msg.isMultiModel && msg.multiModelResponses) {
    return <MultiModelResponse msg={msg} onSelectModel={onSelectModel} />;
  }

  const parts = msg.parts || [];
  const images = parts.filter(p => p.type === 'image');
  const textParts = parts.filter(p => p.type === 'text');
  const toolCalls = parts.filter(p => p.type === 'tool-call');

  return (
    <div className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] ${isUser ? "ml-12" : "mr-12"}`}>
        {/* Images */}
        {images.length > 0 && (
          <div className="flex gap-2 mb-2">
            {images.map((img, i) => (
              <img
                key={i}
                src={img.image}
                alt="uploaded"
                className="max-w-[200px] max-h-[200px] rounded-lg border border-zinc-200 dark:border-zinc-700"
              />
            ))}
          </div>
        )}

        {/* Text */}
        {textParts.length > 0 && (
          <div className={`px-4 py-3 rounded-lg ${isUser ? "bg-blue-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"}`}>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {textParts.map((part, i) => (
                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>
                  {part.text}
                </ReactMarkdown>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-xs text-zinc-500">{getTimestamp()}</span>
          {textParts.length > 0 && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
              title="Copy"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Tool calls */}
        {toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {toolCalls.map((part, i) => (
              <ToolCallRenderer key={i} part={part} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatArea({ messages, status, isAuthenticated, isLoadingMessages, onSelectModel }) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isBottom);
  };

  useEffect(() => {
    if (autoScroll) scrollToBottom();
  }, [messages, status, autoScroll]);

  return (
    <main className="flex flex-col h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        {/* Empty state */}
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Welcome to AI Chat</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                {isAuthenticated
                  ? "Start a conversation below"
                  : "Login to start chatting"}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoadingMessages && (
          <div className="flex items-center justify-center h-full">
            <Loading />
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} onSelectModel={onSelectModel} />
        ))}

        {/* Streaming indicator */}
        {status === "streaming" && (
          <div className="flex justify-start mb-4">
            <div className="text-sm text-zinc-500">AI is thinking...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
