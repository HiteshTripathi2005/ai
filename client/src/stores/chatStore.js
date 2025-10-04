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
  streamingChatId: null,

  // Actions
  setMessages: (messages) => set({ messages }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarW: (sidebarW) => set({ sidebarW }),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setCurrentChatId: (currentChatId) => set({ currentChatId }),
  setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  setStreamingChatId: (streamingChatId) => set({ streamingChatId }),

  // Chat functions
  sendMessage: async (prompt) => {
    if (!prompt.trim()) return;

    const { messages, setMessages, setStatus, setError, chatHistory, setChatHistory, currentChatId, fetchChats, setCurrentChatId, setStreamingChatId } = get();

    const userMsg = {
      id: Date.now() + "",
      role: "user",
      parts: [{ type: "text", text: prompt }]
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStatus("streaming");
    setStreamingChatId(currentChatId); // Track which chat is streaming
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
              // Handle different event types from the AI SDK
              
              // Text streaming
              if (evt?.type === "text-delta" && evt.delta) {
                get().upsertAssistantText(assistantId, evt.delta);
              } 
              // Tool input available (complete tool call)
              else if (evt?.type === "tool-input-available" && evt.toolCallId && evt.toolName) {
                get().upsertAssistantToolCall(assistantId, {
                  toolCallId: evt.toolCallId,
                  toolName: evt.toolName,
                  args: evt.input || {}
                });
              }
              // Tool input start (tool call initiated)
              else if (evt?.type === "tool-input-start" && evt.toolCallId && evt.toolName) {
                get().upsertAssistantToolCall(assistantId, {
                  toolCallId: evt.toolCallId,
                  toolName: evt.toolName,
                  args: {}
                });
              }
              // Tool output available (result ready)
              else if (evt?.type === "tool-output-available" && evt.toolCallId) {
                get().upsertAssistantToolResult(assistantId, {
                  toolCallId: evt.toolCallId,
                  result: evt.output
                });
              }
              // Legacy formats
              else if (evt?.type === "text-delta" && typeof evt.textDelta === "string") {
                get().upsertAssistantText(assistantId, evt.textDelta);
              } 
              else if (evt?.type === "tool-call" && evt.toolCallId && evt.toolName) {
                get().upsertAssistantToolCall(assistantId, {
                  toolCallId: evt.toolCallId,
                  toolName: evt.toolName,
                  args: evt.args || {}
                });
              } 
              else if (evt?.type === "tool-result" && evt.toolCallId) {
                get().upsertAssistantToolResult(assistantId, {
                  toolCallId: evt.toolCallId,
                  result: evt.result
                });
              } 
              else if (typeof evt === "string") {
                get().upsertAssistantText(assistantId, evt);
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
              
              // Text streaming
              if (evt?.type === "text-delta" && evt.delta) {
                get().upsertAssistantText(assistantId, evt.delta);
              } 
              // Tool input available (complete tool call)
              else if (evt?.type === "tool-input-available" && evt.toolCallId && evt.toolName) {
                get().upsertAssistantToolCall(assistantId, {
                  toolCallId: evt.toolCallId,
                  toolName: evt.toolName,
                  args: evt.input || {}
                });
              }
              // Tool input start (tool call initiated)
              else if (evt?.type === "tool-input-start" && evt.toolCallId && evt.toolName) {
                get().upsertAssistantToolCall(assistantId, {
                  toolCallId: evt.toolCallId,
                  toolName: evt.toolName,
                  args: {}
                });
              }
              // Tool output available (result ready)
              else if (evt?.type === "tool-output-available" && evt.toolCallId) {
                get().upsertAssistantToolResult(assistantId, {
                  toolCallId: evt.toolCallId,
                  result: evt.output
                });
              }
              // Legacy formats
              else if (evt?.type === "text-delta" && typeof evt.textDelta === "string") {
                get().upsertAssistantText(assistantId, evt.textDelta);
              } 
              else if (evt?.type === "tool-call" && evt.toolCallId && evt.toolName) {
                get().upsertAssistantToolCall(assistantId, {
                  toolCallId: evt.toolCallId,
                  toolName: evt.toolName,
                  args: evt.args || {}
                });
              } 
              else if (evt?.type === "tool-result" && evt.toolCallId) {
                get().upsertAssistantToolResult(assistantId, {
                  toolCallId: evt.toolCallId,
                  result: evt.result
                });
              } 
              else if (typeof evt === "string") {
                get().upsertAssistantText(assistantId, evt);
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
      const streamingChat = streamingChatId; // Save before clearing
      setStreamingChatId(null); // Clear streaming chat

      // Update the chatHistory with the latest messages and title
      const { chatHistory, setChatHistory } = get();
      const chatIdToUpdate = streamingChat || currentChatId;
      
      // Get the messages from chatHistory for the chat that was streaming
      const streamingChatData = chatHistory.find(chat => (chat._id || chat.id) === chatIdToUpdate);
      const finalMessages = streamingChatData ? streamingChatData.messages : [];
      
      const updatedChatHistory = chatHistory.map(chat => {
        if ((chat._id || chat.id) === chatIdToUpdate) {
          let updatedChat = { ...chat, messages: finalMessages };
          
          // Update title if this is the first message and title is still "New Chat"
          if (chat.title === 'New Chat' && finalMessages.length >= 1) {
            const userMessage = finalMessages.find(msg => msg.role === 'user');
            if (userMessage && userMessage.parts) {
              const textPart = userMessage.parts.find(p => p.type === 'text');
              const userText = textPart?.text || '';
              
              // Create title from user prompt, limited to 50 characters
              let newTitle = userText.substring(0, 50);
              if (userText.length > 50) {
                newTitle += '...';
              }
              
              // If the title would be too short, use more of the prompt
              if (newTitle.length < 10 && userText.length > 10) {
                newTitle = userText.substring(0, 100) + (userText.length > 100 ? '...' : '');
              }
              
              if (newTitle.trim()) {
                updatedChat.title = newTitle;
              }
            }
          }
          
          return updatedChat;
        }
        return chat;
      });
      setChatHistory(updatedChatHistory);

      // If we were on the default chat, refresh the chat list to get the new chat
      if (currentChatId === "default-chat") {
        try {
          // Refresh chats to get the newly created chat
          await get().fetchChats();
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

    const { messages, setMessages, chatHistory, setChatHistory, currentChatId, streamingChatId } = get();

    // Get the base messages for the streaming chat from chatHistory
    const streamingChatData = chatHistory.find(chat => (chat._id || chat.id) === streamingChatId);
    const baseMessages = streamingChatData ? streamingChatData.messages : messages;

    let messageExists = false;
    const updatedMessages = baseMessages.map((m) => {
      if (m.id === assistantId) {
        messageExists = true;
        const parts = m.parts || [];
        const lastPart = parts[parts.length - 1];

        // If last part is text, append to it
        if (lastPart && lastPart.type === 'text') {
          const updatedParts = [...parts];
          updatedParts[updatedParts.length - 1] = {
            ...lastPart,
            text: lastPart.text + textDelta
          };
          return { ...m, parts: updatedParts };
        } else {
          // Add new text part
          return { ...m, parts: [...parts, { type: 'text', text: textDelta }] };
        }
      }
      return m;
    });

    // If message doesn't exist, create it
    if (!messageExists) {
      const newMessage = {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: textDelta }]
      };
      updatedMessages.push(newMessage);
    }

    // Only update UI messages if this is the current chat
    if (currentChatId === streamingChatId) {
      setMessages(updatedMessages);
    }

    // Update the streaming chat in chatHistory
    const chatIdToUpdate = streamingChatId || currentChatId;
    const updatedChatHistory = chatHistory.map(chat =>
      (chat._id || chat.id) === chatIdToUpdate
        ? { ...chat, messages: updatedMessages }
        : chat
    );
    setChatHistory(updatedChatHistory);
  },

  // Handle tool call updates
  upsertAssistantToolCall: (assistantId, toolCallData) => {
    if (!toolCallData) return;

    const { messages, setMessages, chatHistory, setChatHistory, currentChatId, streamingChatId } = get();

    // Get the base messages for the streaming chat from chatHistory
    const streamingChatData = chatHistory.find(chat => (chat._id || chat.id) === streamingChatId);
    const baseMessages = streamingChatData ? streamingChatData.messages : messages;

    let messageExists = false;
    const updatedMessages = baseMessages.map((m) => {
      if (m.id === assistantId) {
        messageExists = true;
        const parts = m.parts || [];
        
        // Check if this tool call already exists
        const existingPartIndex = parts.findIndex(
          p => p.type === 'tool-call' && p.toolCallId === toolCallData.toolCallId
        );
        
        if (existingPartIndex >= 0) {
          // Update existing tool call
          const updatedParts = [...parts];
          updatedParts[existingPartIndex] = {
            ...updatedParts[existingPartIndex],
            toolName: toolCallData.toolName || updatedParts[existingPartIndex].toolName,
            args: toolCallData.args || updatedParts[existingPartIndex].args
          };
          return { ...m, parts: updatedParts };
        } else {
          // Add new tool call part
          return {
            ...m,
            parts: [...parts, {
              type: 'tool-call',
              toolCallId: toolCallData.toolCallId,
              toolName: toolCallData.toolName,
              args: toolCallData.args || {},
              result: null
            }]
          };
        }
      }
      return m;
    });

    // If message doesn't exist, create it
    if (!messageExists) {
      const newMessage = {
        id: assistantId,
        role: "assistant",
        parts: [{
          type: 'tool-call',
          toolCallId: toolCallData.toolCallId,
          toolName: toolCallData.toolName,
          args: toolCallData.args || {},
          result: null
        }]
      };
      updatedMessages.push(newMessage);
    }

    // Only update UI messages if this is the current chat
    if (currentChatId === streamingChatId) {
      setMessages(updatedMessages);
    }

    // Update the streaming chat in chatHistory
    const chatIdToUpdate = streamingChatId || currentChatId;
    const updatedChatHistory = chatHistory.map(chat =>
      (chat._id || chat.id) === chatIdToUpdate
        ? { ...chat, messages: updatedMessages }
        : chat
    );
    setChatHistory(updatedChatHistory);
  },

  // Handle tool result updates
  upsertAssistantToolResult: (assistantId, toolResultData) => {
    if (!toolResultData) return;

    const { messages, setMessages, chatHistory, setChatHistory, currentChatId, streamingChatId } = get();

    // Get the base messages for the streaming chat from chatHistory
    const streamingChatData = chatHistory.find(chat => (chat._id || chat.id) === streamingChatId);
    const baseMessages = streamingChatData ? streamingChatData.messages : messages;

    const updatedMessages = baseMessages.map((m) => {
      if (m.id === assistantId) {
        const parts = m.parts || [];
        const updatedParts = parts.map(part => {
          if (part.type === 'tool-call' && part.toolCallId === toolResultData.toolCallId) {
            return {
              ...part,
              result: toolResultData.result
            };
          }
          return part;
        });
        
        return { ...m, parts: updatedParts };
      }
      return m;
    });

    // Only update UI messages if this is the current chat
    if (currentChatId === streamingChatId) {
      setMessages(updatedMessages);
    }

    // Update the streaming chat in chatHistory
    const chatIdToUpdate = streamingChatId || currentChatId;
    const updatedChatHistory = chatHistory.map(chat =>
      (chat._id || chat.id) === chatIdToUpdate
        ? { ...chat, messages: updatedMessages }
        : chat
    );
    setChatHistory(updatedChatHistory);
  },  // Chat management functions
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

  handleNewChat: async (navigate) => {
    const result = await get().createChat('New Chat');
    if (result && result.success && result.chat) {
      navigate(`/chat/${result.chat._id}`);
    }
    return result;
  },

  selectChat: async (chatId) => {
    const { setCurrentChatId, setMessages, setIsLoadingMessages, chatHistory, streamingChatId } = get();
    
    // Set loading state immediately
    setIsLoadingMessages(true);
    setCurrentChatId(chatId);
    
    // First, try to load messages from chatHistory for immediate display
    const chatFromHistory = chatHistory.find(chat => (chat._id || chat.id) === chatId);
    if (chatFromHistory && chatFromHistory.messages) {
      setMessages(chatFromHistory.messages);
    } else {
      setMessages([]); // Clear current messages to show skeleton
    }
    
    // If this chat is currently streaming, don't fetch from server to avoid overwriting fresh data
    if (chatId === streamingChatId) {
      setIsLoadingMessages(false);
      return { success: true };
    }
    
    try {
      const response = await api.get(`/chat/chats/${chatId}`);
      const chat = response.data.data;
      setMessages(chat.messages || []);
      return { success: true };
    } catch (error) {
      console.error('Failed to fetch chat:', error);
      // If server fetch fails, keep the chatHistory messages
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
    streamingChatId: null,
  }),

  toggleSidebar: () => {
    const { sidebarOpen, setSidebarOpen } = get();
    setSidebarOpen(!sidebarOpen);
  },
}));