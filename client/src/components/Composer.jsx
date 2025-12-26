import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ChevronDown, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

function Composer({
  onSend,
  isStreaming,
  width,
  disabled = false,
  onMultiModelSend,
}) {
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [selectedModels, setSelectedModels] = useState([
    "gemini-2.0-flash-exp",
  ]);
  const textareaRef = useRef(null);

  const sendDisabled = isStreaming || !value.trim() || disabled;

  // Available models
  const models = [
    {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash",
      provider: "Google",
    },
    { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air", provider: "z-ai" },
    { id: "qwen/qwen3-coder:free", name: "Qwen 3 Coder", provider: "qwen" },
    {
      id: "mistralai/mistral-small-3.2-24b-instruct:free",
      name: "Mistral Small 3.2",
      provider: "mistralai",
    },
    { id: "openai/gpt-oss-20b:free", name: "GPT-OSS 20B", provider: "openai" },
  ];

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
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px"; // Max 8 lines (128px)
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleSend = () => {
    if (!sendDisabled && value.trim()) {
      try {
        if (isMultiMode && onMultiModelSend) {
          onMultiModelSend({ message: value.trim(), models: selectedModels });
        } else {
          onSend({ message: value.trim(), model: selectedModel });
        }
        setValue("");
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMultiMode = () => {
    setIsMultiMode(!isMultiMode);
    if (!isMultiMode && selectedModels.length === 0) {
      setSelectedModels([selectedModel]);
    }
  };

  const handleModelSelect = (modelId) => {
    if (isMultiMode) {
      setSelectedModels((prev) => {
        if (prev.includes(modelId)) {
          if (prev.length === 1) return prev;
          return prev.filter((id) => id !== modelId);
        } else {
          return [...prev, modelId];
        }
      });
    } else {
      setSelectedModel(modelId);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className="relative flex flex-col w-full bg-background border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message AI..."
          className="w-full p-4 bg-transparent border-none focus:ring-0 resize-none min-h-[60px] max-h-[200px] text-sm"
          disabled={isStreaming}
        />

        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/30 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-xs font-medium"
                >
                  {isMultiMode ? (
                    <>
                      <Layers className="h-3.5 w-3.5" /> {selectedModels.length}{" "}
                      Models
                    </>
                  ) : (
                    models.find((m) => m.id === selectedModel)?.name
                  )}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {models.map((model) => (
                  <DropdownMenuCheckboxItem
                    key={model.id}
                    checked={
                      isMultiMode
                        ? selectedModels.includes(model.id)
                        : selectedModel === model.id
                    }
                    onCheckedChange={() => handleModelSelect(model.id)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {model.provider}
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleMultiMode} className="text-xs">
                  <Layers className="mr-2 h-3.5 w-3.5" />
                  {isMultiMode
                    ? "Switch to Single Model"
                    : "Switch to Multi-Model"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={sendDisabled}
            onClick={handleSend}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-center text-muted-foreground mt-2">
        AI can make mistakes. Check important info.
      </p>
    </div>
  );
}

export default Composer;
