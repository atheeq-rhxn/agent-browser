import { useEffect, useRef, useState } from "react";
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

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a simulated response. Connect your backend API to get real responses from your AI model.",
        createdAt: Date.now(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
                updatedAt: Date.now(),
              }
            : conv
        )
      );
      setIsLoading(false);
    }, 1000);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
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
              {currentConversation.messages.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {isLoading && <ChatMessage role="assistant" content="Thinking..." />}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-2xl font-semibold">Start a new chat</h2>
              <p className="text-muted-foreground">
                Click "New Chat" to begin a conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
