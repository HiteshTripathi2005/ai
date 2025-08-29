import { useState, useRef, useEffect } from "react";
import cx from "clsx";
import { Send, Loader2 } from "lucide-react";

function Composer({ onSend, isStreaming, width }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);
  const disabled = isStreaming || !value.trim();

  // Auto-focus the textarea when component mounts
  useEffect(() => {
    if (textareaRef.current && !isStreaming) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

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
    if (!disabled && value.trim()) {
      try {
        onSend(value.trim());
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

  return (
    <div className="dark:border-zinc-800/60 p-3  bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 shadow-sm">
          <input
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            placeholder="Message AI..."
            className="flex-1 resize-none bg-transparent outline-none placeholder:text-zinc-400 leading-6 pt-2 min-h-[36px] max-h-32 overflow-y-auto"
            rows={1}
            disabled={isStreaming}
            onKeyDown={handleKeyDown}
            aria-label="Type your message"
            autoComplete="off"
            spellCheck="true"
          />
          
          <button
            onClick={handleSend}
            disabled={disabled}
            className={cx(
              "inline-flex h-9 w-9 flex-none items-center justify-center rounded-full transition-all duration-200",
              disabled
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 hover:scale-105 active:scale-95"
            )}
            title={isStreaming ? "AI is responding..." : "Send message"}
            aria-label={isStreaming ? "AI is responding" : "Send message"}
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