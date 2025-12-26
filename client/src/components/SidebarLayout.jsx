import React from "react";
import { Menu } from "lucide-react";
import History from "./History";

const SidebarLayout = ({
  children,
  sidebarOpen,
  setSidebarOpen,
  onNewChat,
  onDeleteChat,
  onSelectChat,
  currentChatId,
  chatHistory,
  isAuthenticated,
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
      <main className="flex flex-col flex-1 relative h-full transition-all duration-300 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
