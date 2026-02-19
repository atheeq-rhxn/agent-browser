import { useState } from "react";
import { User, Bot, Copy, Check, RotateCw, Edit2, Save, X } from "lucide-react";
import { Button } from "../ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  showRegenerate?: boolean;
}

export function ChatMessage({ 
  role, 
  content, 
  isStreaming = false,
  onRegenerate,
  onEdit,
  showRegenerate = false
}: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(editedContent);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <div
      className={`group w-full border-b py-8 ${
        isUser ? "bg-background" : "bg-muted/30"
      }`}
    >
      <div className="mx-auto flex max-w-3xl gap-6 px-4">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isUser ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-purple-500 to-pink-500"
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-white" />}
        </div>
        <div className="flex-1 space-y-3 overflow-hidden">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap break-words leading-7 m-0">
                  {content}
                  {isStreaming && <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-foreground" />}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                {showRegenerate && onRegenerate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRegenerate}
                    className="h-8 px-2"
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                )}
                {isUser && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8 px-2"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
