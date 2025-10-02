import Header from '../components/Header'
import ChatArea from '../components/ChatArea'
import Composer from '../components/Composer'
import SidebarLayout from '../components/SidebarLayout'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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
    isLoadingMessages,
    sendMessage,
    handleNewChat,
    deleteChat,
    selectChat,
    fetchChats,
    setSidebarOpen, 
    setSidebarW,
    toggleSidebar
  } = useChatStore();

  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectChat = async (chatId) => {
    await selectChat(chatId);
  };

  const handleDeleteChat = (chatId) => {
    if (chatHistory.length > 1) {
      deleteChat(chatId);
    }
    navigate('/');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated, fetchChats]);

  // Reset sidebar width on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarW > 0) {
        setSidebarW(0);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarW, setSidebarW]);

  // Handle URL-based chat loading
  useEffect(() => {
    const path = location.pathname;
    const chatIdMatch = path.match(/^\/chat\/(.+)$/);
    if (chatIdMatch && chatIdMatch[1]) {
      // Only load if it's different from current chat
      if (chatIdMatch[1] !== currentChatId) {
        selectChat(chatIdMatch[1]);
      }
    } else if (path === '/' && currentChatId) {
      // If on home page and we have a current chat, clear it to show welcome
      // This is optional - you might want to keep the last chat visible
      // setCurrentChatId(null);
      // setMessages([]);
    }
  }, [location.pathname, currentChatId, selectChat]);

  return (
    <SidebarLayout
      sidebarWidth={sidebarW}
      setSidebarWidth={setSidebarW}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onNewChat={isAuthenticated ? () => handleNewChat(navigate) : () => toast.error('Please login to create new chats')}
      onDeleteChat={handleDeleteChat}
      onSelectChat={handleSelectChat}
      currentChatId={currentChatId}
      chatHistory={chatHistory}
      isAuthenticated={isAuthenticated}
    >
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950">
        <Header width={sidebarW} setWidth={setSidebarW} setOpen={setSidebarOpen} />
      </div>
      {/* Scrollable ChatArea */}
      <div className="flex-1 flex-col-reverse overflow-y-auto">
        <ChatArea 
          messages={messages} 
          status={status} 
          isAuthenticated={isAuthenticated} 
          isLoadingMessages={isLoadingMessages}
        />
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
    </SidebarLayout>
  )
}

export default HomePage