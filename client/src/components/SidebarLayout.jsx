import React from 'react';
import History from './History';

const SidebarLayout = ({
  children,
  sidebarWidth,
  setSidebarWidth,
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
      {/* History Component - Responsive positioning */}
      <History
        width={sidebarWidth}
        setWidth={setSidebarWidth}
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
      <main className="flex flex-col w-full relative h-full lg:flex-1 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;