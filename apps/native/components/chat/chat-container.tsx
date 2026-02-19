import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal } from "react-native";
import { Menu } from "lucide-react-native";
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
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
    <View className="flex-1 bg-background">
      <View className="flex-row items-center border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => setSidebarVisible(true)} className="mr-3">
          <Menu size={24} color="#666" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground">
          {currentConversation?.title || "Chat"}
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
          onSelectConversation={setCurrentConversationId}
          onNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
          onClose={() => setSidebarVisible(false)}
        />
      </Modal>

      {currentConversation ? (
        <>
          <ScrollView ref={scrollViewRef} className="flex-1">
            {currentConversation.messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <ChatMessage role="assistant" content="Thinking..." />}
          </ScrollView>
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-2 text-center text-2xl font-semibold text-foreground">
            Start a new chat
          </Text>
          <Text className="text-center text-muted-foreground">
            Tap the menu icon to create a conversation
          </Text>
        </View>
      )}
    </View>
  );
}
