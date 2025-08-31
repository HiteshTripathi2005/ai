import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuthStore } from './authStore';

export const useChatStore = create((set, get) => ({
  // Chat state
  messages: [],
  status: "ready",
  error: null,
  isStreaming: false,
  isLoadingMessages: false,

  // UI state
  sidebarOpen: true,
  sidebarW: 280,

  // Chat history state
  chatHistory: [{
    _id: "default-chat",
    title: "Welcome Chat",
    messages: [],
    createdAt: new Date()
  }],
  currentChatId: "default-chat",

  // Actions
  setMessages: (messages) => set({ messages }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarW: (sidebarW) => set({ sidebarW }),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setCurrentChatId: (currentChatId) => set({ currentChatId }),
  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

  // Chat functions
  sendMessage: async (prompt) => {
    if (!prompt.trim()) return;

    const { messages, setMessages, setStatus, setError, chatHistory, setChatHistory, currentChatId, fetchChats, setCurrentChatId } = get();

    const userMsg = {
      id: Date.now() + "",
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStatus("streaming");
    setError(null);

    // Update the current chat in chatHistory
    const updatedChatHistory = chatHistory.map(chat => 
      (chat._id || chat.id) === currentChatId 
        ? { ...chat, messages: updatedMessages }
        : chat
    );
    setChatHistory(updatedChatHistory);

    // Create assistant placeholder to stream into
    const assistantId = `${Date.now()}-ai`;
    let assistantMessage = null;

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any auth headers if needed
        },
        credentials: 'include', // For cookies
        body: JSON.stringify({
          prompt,
          chatId: currentChatId === "default-chat" ? null : currentChatId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create assistant placeholder to stream into
      const assistantMsgTemplate = {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: "" }]
      };
      const updatedMessages = [...get().messages, assistantMsgTemplate];
      setMessages(updatedMessages);

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      let buffer = "";

      while (!done) {
        const result = await reader.read();
        done = result.done || false;
        const chunk = result.value ? decoder.decode(result.value, { stream: !done }) : "";
        if (!chunk) continue;

        // Try to parse SSE-style "data:" lines with optional JSON payloads
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);
        // Keep the last partial line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("data:")) {
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            try {
              const evt = JSON.parse(payload);
              // Vercel AI SDK emits events like { type: 'text-delta', textDelta: '...' }
              if (evt?.type === "text-delta" && typeof evt.textDelta === "string") {
                get().upsertAssistantText(assistantId, evt.textDelta);
              } else if (typeof evt === "string") {
                get().upsertAssistantText(assistantId, evt);
              } else if (evt?.delta && typeof evt.delta === "string") {
                // Some providers use { delta: '...' }
                get().upsertAssistantText(assistantId, evt.delta);
              }
            } catch {
              // Not JSON, treat as raw text
              get().upsertAssistantText(assistantId, payload);
            }
          } else {
            // Not SSE, treat as plain streamed text
            get().upsertAssistantText(assistantId, line);
          }
        }
      }

      // Flush any remaining buffered text
      if (buffer) {
        if (buffer.startsWith("data:")) {
          const payload = buffer.slice(5).trim();
          if (payload && payload !== "[DONE]") {
            try {
              const evt = JSON.parse(payload);
              if (evt?.type === "text-delta" && typeof evt.textDelta === "string") {
                get().upsertAssistantText(assistantId, evt.textDelta);
              } else if (typeof evt === "string") {
                get().upsertAssistantText(assistantId, evt);
              } else if (evt?.delta && typeof evt.delta === "string") {
                get().upsertAssistantText(assistantId, evt.delta);
              }
            } catch {
              get().upsertAssistantText(assistantId, payload);
            }
          }
        } else {
          get().upsertAssistantText(assistantId, buffer);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error(`Failed to send message: ${errorMessage}`);
    } finally {
      setStatus("ready");
      
      // If we were on the default chat, refresh the chat list to get the new chat
      if (currentChatId === "default-chat") {
        try {
          await fetchChats();
          // Set the current chat to the most recent one
          const updatedChats = get().chatHistory;
          if (updatedChats.length > 0) {
            const mostRecentChat = updatedChats[0];
            setCurrentChatId(mostRecentChat._id || mostRecentChat.id);
            setMessages(mostRecentChat.messages || []);
          }
        } catch (error) {
          console.error('Failed to refresh chats after sending message:', error);
        }
      }
    }
  },

  // Append text to the assistant message with the given id
  upsertAssistantText: (assistantId, textDelta) => {
    if (!textDelta) return;

    const { messages, setMessages, chatHistory, setChatHistory, currentChatId } = get();

    const updatedMessages = messages.map((m) => {
      if (m.id !== assistantId) return m;
      const prev = (m.parts?.[0]?.text || "");
      return {
        ...m,
        parts: [{ type: "text", text: prev + textDelta }],
      };
    });

    setMessages(updatedMessages);

    // Update the current chat in chatHistory
    const updatedChatHistory = chatHistory.map(chat => 
      (chat._id || chat.id) === currentChatId 
        ? { ...chat, messages: updatedMessages }
        : chat
    );
    setChatHistory(updatedChatHistory);
  },

  handleNewChat: () => {
    const { createChat } = get();
    createChat();
  },

  // Chat management functions
  fetchChats: async () => {
    try {
      const response = await api.get('/chat/chats');
      const chats = response.data.data;
      set({ chatHistory: chats });
      return { success: true };
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      return { success: false, message: error.message };
    }
  },

  createChat: async (title) => {
    try {
      const response = await api.post('/chat/chats', { title });
      const newChat = response.data.data;
      const { chatHistory, setChatHistory, setCurrentChatId, setMessages } = get();
      setChatHistory([newChat, ...chatHistory]);
      setCurrentChatId(newChat._id);
      setMessages([]);
      return { success: true, chat: newChat };
    } catch (error) {
      console.error('Failed to create chat:', error);
      return { success: false, message: error.message };
    }
  },

  selectChat: async (chatId) => {
    const { setCurrentChatId, setMessages, setIsLoadingMessages } = get();
    
    // Set loading state immediately
    setIsLoadingMessages(true);
    setCurrentChatId(chatId);
    setMessages([]); // Clear current messages to show skeleton
    
    try {
      const response = await api.get(`/chat/chats/${chatId}`);
      const chat = response.data.data;
      setMessages(chat.messages || []);
      return { success: true };
    } catch (error) {
      console.error('Failed to fetch chat:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoadingMessages(false);
    }
  },

  deleteChat: (chatId) => {
    const { chatHistory, setChatHistory, currentChatId, setCurrentChatId, setMessages } = get();

    // Don't allow deleting the last chat
    if (chatHistory.length <= 1) {
      return false;
    }

    // Optimistically update UI
    const updatedHistory = chatHistory.filter(chat => (chat._id || chat.id) !== chatId);
    setChatHistory(updatedHistory);

    // If we're deleting the current chat, switch to the first available chat
    if (currentChatId === chatId) {
      const nextChat = updatedHistory[0];
      setCurrentChatId(nextChat._id || nextChat.id);
      setMessages(nextChat.messages || []);
    }

    // Make API call to delete
    api.delete(`/chat/chats/${chatId}`)
      .catch(error => {
        console.error('Failed to delete chat:', error);
        // Revert optimistic update on failure
        setChatHistory(chatHistory);
      });

    return true;
  },

  // Utility functions
  addMessage: (message) => {
    const { messages, setMessages } = get();
    setMessages([...messages, message]);
  },

  clearMessages: () => set({ messages: [] }),

  clearAll: () => set({
    messages: [],
    status: "ready",
    error: null,
    isStreaming: false,
    isLoadingMessages: false,
    chatHistory: [{
      _id: "default-chat",
      title: "Welcome Chat",
      messages: [],
      createdAt: new Date()
    }],
    currentChatId: "default-chat",
  }),

  toggleSidebar: () => {
    const { sidebarOpen, setSidebarOpen } = get();
    setSidebarOpen(!sidebarOpen);
  },
}));