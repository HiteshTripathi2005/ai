import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, User, Plus, Settings, MessageCircle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

function History({ open, setOpen, onNewChat, onDeleteChat, onSelectChat, currentChatId, chatHistory, isAuthenticated }) {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(280);
  const [isMobile, setIsMobile] = useState(false);
  const isResizing = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing.current && !isMobile) {
        const newWidth = e.clientX;
        if (newWidth > 60 && newWidth < 480) {
          setWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMobile]);

  const handleNewChat = () => {
    onNewChat();
    if (isMobile) {
      setOpen(false);
    }
  };

  const handleChatSelect = (chatId) => {
    navigate(`/chat/${chatId}`);
    if (isMobile) {
      setOpen(false);
    }
  };

  console.log(collapsed)

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.div
          animate={{ width: open ? (collapsed ? 60 : width) : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-lg overflow-hidden flex flex-col border-r border-zinc-200 dark:border-zinc-800 ${
            open ? '' : 'w-0'
          }`}
        >
          {open && (
            <>
              {/* Header - Fixed at top */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className={`text-lg font-semibold transition-all ${collapsed ? 'hidden' : 'block'}`}>Chat History</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCollapsed(!collapsed)}
                      className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                  </div>
                </div>
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={handleNewChat}
                    disabled={!isAuthenticated}
                    className={clsx(
                      'w-full flex items-center gap-2 rounded-xl text-sm font-medium transition-colors',
                      isAuthenticated
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90'
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600',
                      collapsed ? 'p-1' : 'p-3'
                    )}
                  >
                    <Plus size={18} />
                    {!collapsed && 'New Chat'}
                  </button>
                </div>
              </div>

              {/* Chat List - Takes remaining space */}
              <div className="flex-1 overflow-y-auto p-4">
                {!collapsed && (
                  <div className="space-y-2 h-full">
                    {chatHistory && chatHistory.length > 0 ? (
                      chatHistory.map((chat) => (
                        <div
                          key={chat._id || chat.id}
                          className={clsx(
                            'group relative w-full rounded-xl border transition-all duration-200 p-3',
                            (currentChatId === chat._id || currentChatId === chat.id)
                              ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'
                              : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                          )}
                        >
                          <button
                            onClick={() => handleChatSelect(chat._id || chat.id)}
                            className="w-full text-left flex items-center gap-3"
                          >
                            <MessageCircle size={16} className="text-zinc-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {chat.title || 'New Chat'}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                          No chats yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile at Bottom - Fixed at bottom */}
              <div className="flex-shrink-0 p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <User size={18} />
                </div>
                {!collapsed && <p className="text-sm font-medium">Profile</p>}
              </div>

              {/* Resizer */}
              {!collapsed && (
                <div
                  onMouseDown={() => (isResizing.current = true)}
                  className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-zinc-300 dark:bg-zinc-600 hover:bg-zinc-400 dark:hover:bg-zinc-500"
                />
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Mobile Bottom Dialog */}
      {isMobile && open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-4 rounded-t-2xl shadow-2xl z-50 max-h-[85vh] overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-lg font-semibold">Chat History</h2>
          </div>
          <div className="mt-4 space-y-2">
            <button
              onClick={handleNewChat}
              disabled={!isAuthenticated}
              className={clsx(
                'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                isAuthenticated
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600'
              )}
            >
              <Plus size={18} />
              New Chat
            </button>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((chat) => (
                  <div
                    key={chat._id || chat.id}
                    className={clsx(
                      'group relative w-full rounded-xl border transition-all duration-200 p-3',
                      (currentChatId === chat._id || currentChatId === chat.id)
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'
                        : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    )}
                  >
                    <button
                      onClick={() => handleChatSelect(chat._id || chat.id)}
                      className="w-full text-left flex items-center gap-3"
                    >
                      <MessageCircle size={16} className="text-zinc-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {chat.title || 'New Chat'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                    No chats yet. Start a new conversation!
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Profile at Bottom in Mobile */}
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700">
              <User size={18} />
            </div>
            <p className="text-sm font-medium">Profile</p>
          </div>
        </motion.div>
      )}

      {/* Backdrop for mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

export default History;