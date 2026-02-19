import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Plus, MessageSquare, Trash2 } from "lucide-react-native";

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
  onClose: () => void;
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onClose,
}: ChatSidebarProps) {
  return (
    <View className="flex-1 bg-background">
      <View className="p-4">
        <TouchableOpacity
          onPress={() => {
            onNewChat();
            onClose();
          }}
          className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-4 py-3"
        >
          <Plus size={20} color="#666" />
          <Text className="flex-1 text-foreground">New Chat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-2">
        {conversations.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            onPress={() => {
              onSelectConversation(conv.id);
              onClose();
            }}
            className={`mb-2 flex-row items-center gap-3 rounded-lg px-3 py-3 ${
              currentConversationId === conv.id ? "bg-accent" : ""
            }`}
          >
            <MessageSquare size={18} color="#666" />
            <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
              {conv.title}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
