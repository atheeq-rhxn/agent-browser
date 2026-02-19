import { View, Text } from "react-native";
import { User, Bot } from "lucide-react-native";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <View
      className={`w-full border-b border-border py-4 ${
        isUser ? "bg-background" : "bg-muted/30"
      }`}
    >
      <View className="mx-4 flex-row gap-3">
        <View
          className={`h-8 w-8 items-center justify-center rounded ${
            isUser ? "bg-primary" : "bg-accent"
          }`}
        >
          {isUser ? (
            <User size={20} color={isUser ? "#fff" : "#666"} />
          ) : (
            <Bot size={20} color="#666" />
          )}
        </View>
        <View className="flex-1">
          <Text className="leading-6 text-foreground">{content}</Text>
        </View>
      </View>
    </View>
  );
}
