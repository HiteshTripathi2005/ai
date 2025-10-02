import React, { useRef, useEffect, useState } from 'react';
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Plus, Settings, MessageCircle, Trash2, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Custom hook to track screen size
function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        width,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

function History({ width, setWidth, open, setOpen, onNewChat, onDeleteChat, onSelectChat, currentChatId, chatHistory, isAuthenticated }) {
  const MIN_W = 280;
  const MAX_W = 480;
  const handleRef = useRef(null);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [dragWidth, setDragWidth] = useState(width);
  const dragWidthRef = useRef(width);
  const { isMobile, isTablet, isDesktop } = useScreenSize();

  // Sync dragWidth with width when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDragWidth(width);
      dragWidthRef.current = width;
    }
  }, [width, isDragging]);

  // Desktop drag resize functionality
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !isDesktop) return; // Only enable on desktop

    let startX = 0;
    let startW = 0;

    const onMouseMove = (e) => {
      const delta = e.clientX - startX;
      const next = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
      dragWidthRef.current = next;
      setDragWidth(next);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = '';

      // Update parent state only when drag ends
      setWidth(dragWidthRef.current);
    };

    const onMouseDown = (e) => {
      startX = e.clientX;
      startW = dragWidthRef.current;
      setIsDragging(true);
      document.body.style.cursor = 'col-resize';
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", onMouseDown);
    return () => handle.removeEventListener("mousedown", onMouseDown);
  }, [setWidth, isDesktop]);

  const handleNewChat = () => {
    onNewChat();
    // Close mobile sheet after creating new chat
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleChatSelect = (chatId) => {
    navigate(`/chat/${chatId}`);
    // Close mobile sheet after selecting chat
    if (isMobile) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Bottom Sheet */}
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out md:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Chat History
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              disabled={!isAuthenticated}
              className={clsx(
                "w-full mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isAuthenticated
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
              )}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 max-h-96">
            {chatHistory && chatHistory.length > 0 ? (
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <div
                    key={chat._id || chat.id}
                    className={clsx(
                      "group relative w-full rounded-xl border transition-all duration-200",
                      (currentChatId === chat._id || currentChatId === chat.id)
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm"
                        : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <button
                      onClick={() => handleChatSelect(chat._id || chat.id)}
                      className="w-full text-left p-4 flex items-center gap-3"
                    >
                      <div className="flex-shrink-0">
                        <MessageCircle className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {chat.title || "New Chat"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {new Date(chat.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </button>

                    {chatHistory.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat._id || chat.id);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                  No chats yet. Start a new conversation!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
            <button className="w-full inline-flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Settings className="h-5 w-5 text-zinc-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tablet/Desktop Sidebar */}
      <aside
        style={{ width: open ? dragWidth : 0 }}
        className={clsx(
          "hidden md:block relative h-full flex-shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 transition-all duration-300 ease-in-out overflow-hidden",
          // Tablet positioning
          "md:fixed md:inset-y-0 md:left-0 md:z-40",
          // Desktop positioning
          "lg:relative lg:z-auto",
          open ? "md:translate-x-0 lg:translate-x-0" : "md:-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={clsx("h-full flex flex-col", open ? "w-full" : "w-0")}>
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className={clsx("font-semibold text-zinc-900 dark:text-zinc-100 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0 md:opacity-100"
            )}>
              {open ? "Chat History" : ""}
            </h2>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => setWidth(open ? 0 : MIN_W)}
              className="hidden md:inline-flex lg:inline-flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>

          {/* New Chat Button */}
          {open && (
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={handleNewChat}
                disabled={!isAuthenticated}
                className={clsx(
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isAuthenticated
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                )}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>
          )}

          {/* Chat List */}
          {open && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat._id || chat.id}
                    className={clsx(
                      "group relative w-full rounded-xl border transition-all duration-200",
                      (currentChatId === chat._id || currentChatId === chat.id)
                        ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm"
                        : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <button
                      onClick={() => handleChatSelect(chat._id || chat.id)}
                      className="w-full text-left p-3 flex items-center gap-3"
                    >
                      <div className="flex-shrink-0">
                        <MessageCircle className="h-4 w-4 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {chat.title || "New Chat"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {new Date(chat.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </button>

                    {chatHistory.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat._id || chat.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                    No chats yet. Start a new conversation!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {open && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
              <button className="w-full inline-flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Settings className="h-5 w-5 text-zinc-400" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Drag Handle */}
        {open && isDesktop && (
          <div
            ref={handleRef}
            className={clsx(
              "absolute top-0 right-0 h-full w-1 cursor-col-resize transition-colors",
              isDragging ? "bg-zinc-300 dark:bg-zinc-600" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
            title="Drag to resize"
          />
        )}
      </aside>

      {/* Backdrop for tablet */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:block lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default History;