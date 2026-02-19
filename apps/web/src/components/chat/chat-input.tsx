import { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip } from "lucide-react";
import { Button } from "../ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function ChatInput({ onSend, onStop, disabled, isGenerating }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!isGenerating) {
      textareaRef.current?.focus();
    }
  }, [isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="relative rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT..."
            disabled={disabled}
            rows={1}
            className="max-h-48 min-h-[52px] w-full resize-none bg-transparent px-4 py-3 pr-24 text-sm focus:outline-none disabled:opacity-50"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {isGenerating ? (
              <Button
                type="button"
                size="icon"
                onClick={onStop}
                className="h-8 w-8 bg-foreground hover:bg-foreground/90"
              >
                <Square className="h-3 w-3 fill-background" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || disabled}
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          ChatGPT can make mistakes. Check important info.
        </p>
      </form>
    </div>
  );
}
