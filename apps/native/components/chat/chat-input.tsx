import { useState } from "react";
import { View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { Send, Square, Paperclip } from "lucide-react-native";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function ChatInput({ onSend, onStop, disabled, isGenerating }: ChatInputProps) {
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
        <View className="relative rounded-2xl border border-border bg-background shadow-sm">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Message ChatGPT..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={!disabled}
            className="max-h-32 min-h-[52px] w-full px-4 py-3 pr-24 text-sm text-foreground"
            style={{ textAlignVertical: "top" }}
          />
          <View className="absolute bottom-2 right-2 flex-row gap-1">
            <TouchableOpacity
              disabled={disabled}
              className="h-8 w-8 items-center justify-center"
            >
              <Paperclip size={16} color={disabled ? "#ccc" : "#666"} />
            </TouchableOpacity>
            {isGenerating ? (
              <TouchableOpacity
                onPress={onStop}
                className="h-8 w-8 items-center justify-center rounded-lg bg-foreground"
              >
                <Square size={14} color="#fff" fill="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!message.trim() || disabled}
                className={`h-8 w-8 items-center justify-center rounded-lg ${
                  message.trim() && !disabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <Send size={16} color={message.trim() && !disabled ? "#fff" : "#999"} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
