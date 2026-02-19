import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`group w-full border-b py-6 ${
        isUser ? "bg-background" : "bg-muted/30"
      }`}
    >
      <div className="mx-auto flex max-w-3xl gap-4 px-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
            isUser ? "bg-primary text-primary-foreground" : "bg-accent"
          }`}
        >
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        <div className="flex-1 space-y-2 overflow-hidden">
          <p className="whitespace-pre-wrap break-words leading-7">{content}</p>
        </div>
      </div>
    </div>
  );
}
