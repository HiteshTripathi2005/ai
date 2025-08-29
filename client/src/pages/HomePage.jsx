import Header from '../components/Header'
import History from '../components/History'
import ChatArea from '../components/ChatArea'
import Composer from '../components/Composer'
import { useChatStore } from '../stores/chatStore'

const HomePage = () => {
  const {
    messages,
    status,
    error,
    sidebarOpen,
    sidebarW,
    chatHistory,
    currentChatId,
    isStreaming,
    sendMessage,
    handleNewChat,
    setSidebarOpen, 
    setSidebarW,
    toggleSidebar
  } = useChatStore();

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex">
      <div className="hidden md:block" style={{ width: sidebarW }}>
        <History
          width={sidebarW}
          setWidth={setSidebarW}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onNewChat={handleNewChat}
          currentChatId={currentChatId}
          chatHistory={chatHistory}
        />
      </div>

      <main className="flex flex-col w-full relative h-full">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950">
          <Header width={sidebarW} setWidth={setSidebarW} />
        </div>
        {/* Scrollable ChatArea */}
        <div className="flex-1 flex-col-reverse overflow-y-auto">
          <ChatArea messages={messages} status={status} error={error} />
        </div>
        {/* Fixed Composer */}
        <div className="sticky bottom-0 z-10 bg-white dark:bg-zinc-950">
          <Composer onSend={sendMessage} isStreaming={isStreaming} width={sidebarW} />
        </div>
      </main>
    </div>
  )
}

export default HomePage