import { useState, useRef, useEffect } from "react";
import cx from "clsx";
import { Send, Loader2, ChevronDown } from "lucide-react";

function Composer({ onSend, isStreaming, width, disabled = false }) {
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  const sendDisabled = isStreaming || !value.trim() || disabled;
  const inputDisabled = isStreaming;

  // Available models
  const models = [
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "Google" },
    { id: "z-ai/glm-4.5-air:free", name: "Gemini 4.5 Air", provider: "z-ai" },
    { id: "qwen/qwen3-coder:free", name: "Qwen 3 Coder", provider: "qwen" },
    { id: "mistralai/mistral-small-3.2-24b-instruct:free", name: "Mistral Small 3.2", provider: "mistralai" },
    { id: "openai/gpt-oss-20b:free", name: "GPT-OSS 20B", provider: "openai" },
  ];

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current && !isStreaming) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px'; // Max 8 lines (128px)
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleSend = () => {
    if (!sendDisabled && value.trim()) {
      try {
        onSend({ message: value.trim(), model: selectedModel });
        setValue("");
      } catch (error) {
        console.error('Failed to send message:', error);
        // You could add error handling here, like showing a toast
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
  };

  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
  };

  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <div className="dark:border-zinc-800/60 p-3 bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl">
        {/* Model Selector */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              disabled={isStreaming}
              className={cx(
                "inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors",
                isStreaming
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border-zinc-200"
                  : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              )}
            >
              <span className="font-medium">{currentModel?.name || "Select Model"}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentModel?.provider}
              </span>
              <ChevronDown className={cx(
                "h-3 w-3 transition-transform",
                isModelDropdownOpen ? "rotate-180" : ""
              )} />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-1 left-0 z-50 w-64 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg">
                <div className="py-1 max-h-48 overflow-y-auto">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelSelect(model.id)}
                      className={cx(
                        "w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors",
                        selectedModel === model.id
                          ? "bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{model.provider}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 shadow-sm">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            placeholder={disabled ? "Please login to send messages..." : "Message AI..."}
            className="flex-1 resize-none bg-transparent outline-none placeholder:text-zinc-400 leading-6 pt-2 min-h-[36px] max-h-32 overflow-y-auto"
            rows={1}
            disabled={inputDisabled}
            onKeyDown={handleKeyDown}
            aria-label="Type your message"
            autoComplete="off"
            spellCheck="true"
          />
          
          <button
            onClick={handleSend}
            disabled={sendDisabled}
            className={cx(
              "inline-flex h-9 w-9 flex-none items-center justify-center rounded-full transition-all duration-200",
              sendDisabled
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 hover:scale-105 active:scale-95"
            )}
            title={isStreaming ? "AI is responding..." : disabled ? "Please login to send messages" : "Send message"}
            aria-label={isStreaming ? "AI is responding" : disabled ? "Please login to send messages" : "Send message"}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Composer;