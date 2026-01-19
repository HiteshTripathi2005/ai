import React from 'react';
import { Menu } from 'lucide-react';
import History from './History';

const SidebarLayout = ({
  children,
  sidebarOpen,
  setSidebarOpen,
  onNewChat,
  onDeleteChat,
  onSelectChat,
  currentChatId,
  chatHistory,
  isAuthenticated
}) => {
  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex">
      {/* History Component */}
      <History
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onNewChat={onNewChat}
        onDeleteChat={onDeleteChat}
        onSelectChat={onSelectChat}
        currentChatId={currentChatId}
        chatHistory={chatHistory}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content Area */}
      <main className="flex flex-col flex-1 relative h-screen transition-all duration-300 overflow-hidden">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2 rounded bg-zinc-900 text-white hover:bg-zinc-700 shadow"
          >
            <Menu size={20} />
          </button>
        )}
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;