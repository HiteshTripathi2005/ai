import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  // Chat state
  messages: [],
  status: "ready",
  error: null,
  isStreaming: false,

  // UI state
  sidebarOpen: true,
  sidebarW: 280,

  // Chat history state
  chatHistory: [],
  currentChatId: null,

  // Actions
  setMessages: (messages) => set({ messages }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarW: (sidebarW) => set({ sidebarW }),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setCurrentChatId: (currentChatId) => set({ currentChatId }),

  // Chat functions
  sendMessage: async (prompt) => {
    if (!prompt.trim()) return;

    const { messages, setMessages, setStatus, setError } = get();

    const userMsg = {
      id: Date.now() + "",
      role: "user",
      parts: [{ type: "text", text: prompt }],
    };

    setMessages([...messages, userMsg]);
    setStatus("streaming");
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt, // only send input as prompt
        }),
      });

      if (!res.ok) throw new Error("Network error");

      // Create assistant placeholder to stream into
      const assistantId = `${Date.now()}-ai`;
      const updatedMessages = [...get().messages, {
        id: assistantId,
        role: "assistant",
        parts: [{ type: "text", text: "" }]
      }];
      setMessages(updatedMessages);

      // If the response supports streaming, progressively read and append
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        // Fallback: no stream body, just read all text
        const fullText = await res.text();
        get().upsertAssistantText(assistantId, fullText);
      } else {
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
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setStatus("ready");
    }
  },

  // Append text to the assistant message with the given id
  upsertAssistantText: (assistantId, textDelta) => {
    if (!textDelta) return;

    const { messages, setMessages } = get();

    const updatedMessages = messages.map((m) => {
      if (m.id !== assistantId) return m;
      const prev = (m.parts?.[0]?.text || "");
      return {
        ...m,
        parts: [{ type: "text", text: prev + textDelta }],
      };
    });

    setMessages(updatedMessages);
  },

  handleNewChat: () => {
    const { setChatHistory, setCurrentChatId, setMessages } = get();

    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };

    setChatHistory([newChat, ...get().chatHistory]);
    setCurrentChatId(newChatId);
    setMessages([]);
  },

  // Utility functions
  addMessage: (message) => {
    const { messages, setMessages } = get();
    setMessages([...messages, message]);
  },

  clearMessages: () => set({ messages: [] }),

  toggleSidebar: () => {
    const { sidebarOpen, setSidebarOpen } = get();
    setSidebarOpen(!sidebarOpen);
  },
}));