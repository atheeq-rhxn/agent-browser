import { Plus, MessageSquare, Trash2, PanelLeftClose } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="flex h-full w-16 flex-col items-center border-r bg-background py-3">
        <Button
          onClick={() => setIsCollapsed(false)}
          size="icon"
          variant="ghost"
          className="mb-2"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          onClick={onNewChat}
          size="icon"
          variant="ghost"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex items-center justify-between p-3">
        <Button
          onClick={onNewChat}
          className="flex-1 justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
        <Button
          onClick={() => setIsCollapsed(true)}
          size="icon"
          variant="ghost"
          className="ml-2"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="mb-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
          Recent
        </div>
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
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
          ))
        )}
      </div>
    </div>
  );
}
