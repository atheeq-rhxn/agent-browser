import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

export function ChatContainer() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversationId, conversations]);

  const currentConversation = conversations.find(
    (c) => c.id === currentConversationId
  );

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
  };

  const handleSendMessage = async (content: string) => {
    let conversationId = currentConversationId;

    if (!conversationId) {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: content.slice(0, 50),
        updatedAt: Date.now(),
        messages: [],
      };
      setConversations([newConversation, ...conversations]);
      conversationId = newConversation.id;
      setCurrentConversationId(conversationId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              updatedAt: Date.now(),
              title: conv.messages.length === 0 ? content.slice(0, 50) : conv.title,
            }
          : conv
      )
    );

    setIsLoading(true);
    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);

    // Simulate streaming response
    const fullResponse = "This is a simulated response. Connect your backend API to get real responses from your AI model. You can integrate with OpenAI, Anthropic, or any other LLM provider to get actual AI responses.";
    let currentText = "";
    
    const words = fullResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      currentText += (i > 0 ? " " : "") + words[i];
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: conv.messages.find(m => m.id === assistantMessageId)
                  ? conv.messages.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, content: currentText }
                        : m
                    )
                  : [...conv.messages, {
                      id: assistantMessageId,
                      role: "assistant" as const,
                      content: currentText,
                      createdAt: Date.now(),
                    }],
                updatedAt: Date.now(),
              }
            : conv
        )
      );
    }

    setIsLoading(false);
    setStreamingMessageId(null);
  };

  const handleStopGeneration = () => {
    setIsLoading(false);
    setStreamingMessageId(null);
  };

  const handleRegenerateResponse = (messageId: string) => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const previousMessage = conversation.messages[messageIndex - 1];
    if (previousMessage.role !== "user") return;

    // Remove the assistant message and regenerate
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: conv.messages.filter(m => m.id !== messageId),
            }
          : conv
      )
    );

    handleSendMessage(previousMessage.content);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversationId
          ? {
              ...conv,
              messages: conv.messages.map(m =>
                m.id === messageId ? { ...m, content: newContent } : m
              ),
            }
          : conv
      )
    );
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={setCurrentConversationId}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />

      <div className="flex flex-1 flex-col">
        {currentConversation ? (
          <>
            <div className="flex-1 overflow-y-auto">
              {currentConversation.messages.map((msg, index) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.id === streamingMessageId}
                  onRegenerate={msg.role === "assistant" ? () => handleRegenerateResponse(msg.id) : undefined}
                  onEdit={msg.role === "user" ? (newContent) => handleEditMessage(msg.id, newContent) : undefined}
                  showRegenerate={msg.role === "assistant" && index === currentConversation.messages.length - 1 && !isLoading}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput 
              onSend={handleSendMessage} 
              onStop={handleStopGeneration}
              disabled={isLoading}
              isGenerating={isLoading}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-3 text-3xl font-semibold">How can I help you today?</h2>
            <p className="mb-8 text-center text-muted-foreground">
              Start a conversation by typing a message below or select a previous chat from the sidebar
            </p>
            <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
              {[
                { title: "Explain a concept", desc: "in simple terms" },
                { title: "Help me debug", desc: "code issues" },
                { title: "Write some code", desc: "for a specific task" },
                { title: "Brainstorm ideas", desc: "for a project" },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(`${item.title} ${item.desc}`)}
                  className="group rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent"
                >
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
