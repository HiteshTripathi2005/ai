import Header from '../components/Header'
import History from '../components/History'
import ChatArea from '../components/ChatArea'
import Composer from '../components/Composer'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    messages,
    status,
    sidebarOpen,
    sidebarW,
    chatHistory,
    currentChatId,
    isStreaming,
    sendMessage,
    handleNewChat,
    deleteChat,
    selectChat,
    fetchChats,
    setCurrentChatId,
    setMessages,
    setSidebarOpen, 
    setSidebarW,
    toggleSidebar
  } = useChatStore();

  const handleSelectChat = async (chatId) => {
    await selectChat(chatId);
  };

  const handleDeleteChat = (chatId) => {
    if (chatHistory.length > 1) {
      deleteChat(chatId);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated, fetchChats]);

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex">
      <div className="hidden md:block" style={{ width: sidebarW }}>
        <History
          width={sidebarW}
          setWidth={setSidebarW}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onNewChat={isAuthenticated ? handleNewChat : () => toast.error('Please login to create new chats')}
          onDeleteChat={handleDeleteChat}
          onSelectChat={handleSelectChat}
          currentChatId={currentChatId}
          chatHistory={chatHistory}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <main className="flex flex-col w-full relative h-full">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950">
          <Header width={sidebarW} setWidth={setSidebarW} />
        </div>
        {/* Scrollable ChatArea */}
        <div className="flex-1 flex-col-reverse overflow-y-auto">
          <ChatArea messages={messages} status={status} isAuthenticated={isAuthenticated} />
        </div>
        {/* Fixed Composer */}
        <div className="sticky bottom-0 z-10 bg-white dark:bg-zinc-950">
          <Composer 
            onSend={isAuthenticated ? sendMessage : () => toast.error('Please login to send messages')} 
            isStreaming={isStreaming} 
            width={sidebarW} 
            disabled={!isAuthenticated}
          />
        </div>
      </main>
    </div>
  )
}

export default HomePage