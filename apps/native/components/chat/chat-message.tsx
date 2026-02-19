import { useState } from "react";
import { View, Text, TouchableOpacity, Clipboard } from "react-native";
import { User, Bot, Copy, RotateCw } from "lucide-react-native";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function ChatMessage({ 
  role, 
  content, 
  isStreaming = false,
  onRegenerate
}: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      className={`w-full border-b border-border py-6 ${
        isUser ? "bg-background" : "bg-muted/30"
      }`}
    >
      <View className="mx-4 flex-row gap-4">
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${
            isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-pink-500"
          }`}
          style={!isUser ? { backgroundColor: "#a855f7" } : undefined}
        >
          {isUser ? (
            <User size={16} color="#fff" />
          ) : (
            <Bot size={16} color="#fff" />
          )}
        </View>
        <View className="flex-1">
          <Text className="leading-6 text-foreground">
            {content}
            {isStreaming && <Text className="text-foreground"> ▊</Text>}
          </Text>
          <View className="mt-2 flex-row gap-2">
            <TouchableOpacity
              onPress={handleCopy}
              className="rounded p-1"
            >
              <Copy size={14} color={copied ? "#22c55e" : "#666"} />
            </TouchableOpacity>
            {onRegenerate && (
              <TouchableOpacity
                onPress={onRegenerate}
                className="rounded p-1"
              >
                <RotateCw size={14} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
