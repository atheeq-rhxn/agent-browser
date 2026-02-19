import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent ${
              currentConversationId === conv.id ? "bg-accent" : ""
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="shrink-0 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
