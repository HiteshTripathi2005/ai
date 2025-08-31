import React, { useRef, useEffect, useState } from 'react';
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Plus, Settings, MessageCircle, Trash2 } from "lucide-react";

function History({ width, setWidth, open, setOpen, onNewChat, onDeleteChat, onSelectChat, currentChatId, chatHistory, isAuthenticated }) {
  const MIN_W = 220;
  const MAX_W = 520;
  const handleRef = useRef(null);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    let startX = 0;
    let startW = 0;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      let next = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
      setWidth(next);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    const onMouseDown = (e) => {
      startX = e.clientX;
      startW = width;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);
    return () => handle.removeEventListener("mousedown", onMouseDown);
  }, [width, setWidth]);

  const handleNewChat = () => {
    onNewChat();
  };

  return (
    <aside
      style={{ width: open ? width : 0 }}
      className={clsx(
        "relative h-full flex-shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-900 transition-[width] duration-200 overflow-hidden"
      )}
    >
      <div className={clsx("h-full flex flex-col", open ? "px-3" : "px-0")}>
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => setWidth(0)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            {open ? <ChevronLeft className="h-5 w-5"/> : <ChevronRight className="h-5 w-5"/>}
          </button>

          {open && (
            <button
              onClick={handleNewChat}
              disabled={!isAuthenticated}
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl px-2 py-1.5 cursor-pointer text-xs font-medium",
                isAuthenticated
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
            >
              <Plus className="h-3 w-3"/>
              New chat
            </button>
          )}
        </div>

        {open && (
          <div className="mt-2 flex-1 overflow-auto space-y-2 pr-1">
            {chatHistory && chatHistory.length > 0 ? (
              chatHistory.map((chat) => (
                <div
                  key={chat._id || chat.id}
                  className={clsx(
                    "group relative w-full rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700",
                    (currentChatId === chat._id || currentChatId === chat.id) && "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  <button
                    onClick={() => onSelectChat(chat._id || chat.id)}
                    className="w-full text-left truncate px-3 py-2 text-sm hover:bg-white dark:hover:bg-zinc-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-zinc-400" />
                      <span className="truncate">{chat.title || "New Chat"}</span>
                    </div>
                  </button>
                  
                  {chatHistory.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat._id || chat.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 transition-all"
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 text-sm mt-8">
                No chats yet. Start a new conversation!
              </div>
            )}
          </div>
        )}

        <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-3">
          <div className="flex items-center gap-2 px-2">
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800" title="Settings">
              <Settings className="h-5 w-5"/>
            </button>
            {open && <span className="text-sm text-zinc-500">Settings</span>}
          </div>
        </div>
      </div>

      {/* Drag handle */}
      {open && (
        <div
          ref={handleRef}
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          title="Drag to resize"
        />
      )}
    </aside>
  );
}

export default History;