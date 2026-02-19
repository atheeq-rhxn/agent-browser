import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Plus, MessageSquare, Trash2, X } from "lucide-react-native";

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
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <Text className="text-lg font-semibold text-foreground">Chats</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <TouchableOpacity
          onPress={onNewChat}
          className="flex-row items-center gap-2 rounded-lg border border-border bg-background px-4 py-3"
        >
          <Plus size={20} color="#666" />
          <Text className="flex-1 text-foreground">New Chat</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 pb-2">
        <Text className="text-xs font-semibold text-muted-foreground">RECENT</Text>
      </View>

      <ScrollView className="flex-1 px-2">
        {conversations.length === 0 ? (
          <View className="px-4 py-8">
            <Text className="text-center text-sm text-muted-foreground">
              No conversations yet
            </Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => onSelectConversation(conv.id)}
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
          ))
        )}
      </ScrollView>
    </View>
  );
}
