import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Menu, Sparkles } from "lucide-react-native";
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [currentConversationId, conversations]);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations([newConversation, ...conversations]);
    setCurrentConversationId(newConversation.id);
    setSidebarVisible(false);
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
    const fullResponse = "This is a simulated response. Connect your backend API to get real responses from your AI model. You can integrate with OpenAI, Anthropic, or any other LLM provider.";
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

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const handleRegenerateResponse = (messageId: string) => {
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    const previousMessage = conversation.messages[messageIndex - 1];
    if (previousMessage.role !== "user") return;

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

  const suggestionPrompts = [
    { title: "Explain a concept", desc: "in simple terms" },
    { title: "Help me debug", desc: "code issues" },
    { title: "Write some code", desc: "for a specific task" },
    { title: "Brainstorm ideas", desc: "for a project" },
  ];

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => setSidebarVisible(true)} className="mr-3">
          <Menu size={24} color="#666" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground">
          {currentConversation?.title || "DIVINE"}
        </Text>
      </View>

      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={(id) => {
            setCurrentConversationId(id);
            setSidebarVisible(false);
          }}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onClose={() => setSidebarVisible(false)}
        />
      </Modal>

      {currentConversation ? (
        <>
          <ScrollView ref={scrollViewRef} className="flex-1">
            {currentConversation.messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.id === streamingMessageId}
                onRegenerate={
                  msg.role === "assistant" && 
                  index === currentConversation.messages.length - 1 && 
                  !isLoading
                    ? () => handleRegenerateResponse(msg.id)
                    : undefined
                }
              />
            ))}
          </ScrollView>
          <ChatInput 
            onSend={handleSendMessage} 
            onStop={handleStopGeneration}
            disabled={isLoading}
            isGenerating={isLoading}
          />
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Sparkles size={40} color="#8b5cf6" />
          </View>
          <Text className="mb-2 text-center text-2xl font-semibold text-foreground">
            How can I help you today?
          </Text>
          <Text className="mb-6 text-center text-muted-foreground">
            Start a conversation or select a previous chat
          </Text>
          <View className="w-full gap-3">
            {suggestionPrompts.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSendMessage(`${item.title} ${item.desc}`)}
                className="rounded-xl border border-border bg-card p-4"
              >
                <Text className="font-medium text-foreground">{item.title}</Text>
                <Text className="text-sm text-muted-foreground">{item.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
