import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '../components/Header';
import ChatArea from '../components/ChatArea';
import Composer from '../components/Composer';
import Loading from '../components/Loading';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const MessagePage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  

  const {
    messages,
    status,
    isStreaming,
    isLoadingMessages,
    sendMessage,
    selectChat,
    fetchChats,
    setCurrentChatId,
    setMessages
  } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && chatId) {
      // Set the current chat ID and load messages
      setCurrentChatId(chatId);
      selectChat(chatId).catch((error) => {
        console.error('Failed to load chat:', error);
        toast.error('Failed to load chat. It may not exist or you may not have access.');
        navigate('/');
      });
    }
  }, [isAuthenticated, chatId, selectChat, setCurrentChatId, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated, fetchChats]);

  const handleSendMessage = async (message) => {
    if (!isAuthenticated) {
      toast.error('Please login to send messages');
      return;
    }
    await sendMessage(message, chatId);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please login to view this chat</h2>
          <button
            onClick={() => navigate('/login')}
            className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-6 py-2 rounded-xl hover:opacity-90"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return <Loading />;
  }

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={handleBackToHome}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 cursor-pointer"
            title="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <Header />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ChatArea
            messages={messages}
            status={status}
            isAuthenticated={isAuthenticated}
            isLoadingMessages={isLoadingMessages}
          />
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 z-10 bg-white dark:bg-zinc-950 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Composer
            onSend={handleSendMessage}
            isStreaming={isStreaming}
            disabled={!isAuthenticated}
          />
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
