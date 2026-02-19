import { useState } from "react";
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Send } from "lucide-react-native";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View className="border-t border-border bg-background p-4">
        <View className="flex-row items-end gap-2">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Send a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={!disabled}
            className="max-h-32 min-h-[52px] flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground"
            style={{ textAlignVertical: "top" }}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!message.trim() || disabled}
            className={`h-10 w-10 items-center justify-center rounded-lg ${
              message.trim() && !disabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <Send size={18} color={message.trim() && !disabled ? "#fff" : "#999"} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
