import { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from "react-native"
import { nanoid } from "nanoid"
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Copy,
  RotateCw,
  Sparkles,
  User,
  Bot,
  Send,
  Menu,
} from "lucide-react-native"
import { useMutation, useQuery } from "convex/react"
import { api } from "@browser-agent/backend/convex/_generated/api"
import type { Id } from "@browser-agent/backend/convex/_generated/dataModel"

interface MessageVersion {
  id: string
  content: string
}

interface MessageType {
  key: string
  role: "user" | "assistant"
  versions: MessageVersion[]
}

const mockResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles.",
  "I'd be happy to explain this topic in detail. From my understanding, there are several important factors to consider when approaching this problem.",
  "This is an interesting topic. Let me break it down for you step by step to make it easier to understand.",
]

const suggestions = [
  "Explain a complex concept",
  "Help me write code",
  "Brainstorm creative ideas",
  "Analyze a problem",
]

export function ProfessionalChatNative() {
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready">("ready")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const chats = useQuery(api.chats.list) || []
  const currentChat = useQuery(
    api.chats.get,
    currentChatId ? { chatId: currentChatId } : "skip"
  )
  const createChat = useMutation(api.chats.create)
  const deleteChat = useMutation(api.chats.deleteChat)
  const addMessage = useMutation(api.chats.addMessage)

  useEffect(() => {
    if (currentChat?.messages) {
      const loadedMessages: MessageType[] = currentChat.messages.map(msg => ({
        key: msg._id,
        role: msg.role,
        versions: [{ id: msg._id, content: msg.content }],
      }))
      setMessages(loadedMessages)
    } else {
      setMessages([])
    }
  }, [currentChat])

  const streamResponse = useCallback(async (messageId: string, content: string) => {
    setStatus("streaming")
    setStreamingMessageId(messageId)
    const words = content.split(" ")
    let currentContent = ""

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? " " : "") + words[i]
      setMessages(prev =>
        prev.map(msg => {
          if (msg.versions.some(v => v.id === messageId)) {
            return {
              ...msg,
              versions: msg.versions.map(v =>
                v.id === messageId ? { ...v, content: currentContent } : v
              ),
            }
          }
          return msg
        })
      )
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    setStatus("ready")
    setStreamingMessageId(null)
    return currentContent
  }, [])

  const handleNewChat = async () => {
    try {
      const newChatId = await createChat({ title: "New Chat" })
      setCurrentChatId(newChatId as Id<"chats">)
      setMessages([])
      setSidebarVisible(false)
    } catch (error) {
      console.error("Failed to create chat")
    }
  }

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      await deleteChat({ chatId })
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
    } catch (error) {
      console.error("Failed to delete chat")
    }
  }

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      let chatId = currentChatId

      if (!chatId) {
        try {
          const newChatId = await createChat({ title: text.slice(0, 50) })
          chatId = newChatId as Id<"chats">
          setCurrentChatId(chatId)
        } catch (error) {
          console.error("Failed to create chat")
          return
        }
      }

      setStatus("submitted")
      setInputValue("")

      const userMessageKey = nanoid()
      const userMessage: MessageType = {
        key: userMessageKey,
        role: "user",
        versions: [{ id: userMessageKey, content: text }],
      }
      setMessages(prev => [...prev, userMessage])

      try {
        await addMessage({
          chatId,
          role: "user",
          content: text,
        })
      } catch (error) {
        console.error("Failed to save message")
      }

      setTimeout(async () => {
        const assistantMessageId = nanoid()
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
        const assistantMessage: MessageType = {
          key: assistantMessageId,
          role: "assistant",
          versions: [{ id: assistantMessageId, content: "" }],
        }
        setMessages(prev => [...prev, assistantMessage])

        const fullResponse = await streamResponse(assistantMessageId, randomResponse)

        if (chatId) {
          try {
            await addMessage({
              chatId,
              role: "assistant",
              content: fullResponse,
            })
          } catch (error) {
            console.error("Failed to save response")
          }
        }
      }, 500)
    },
    [currentChatId, createChat, addMessage, streamResponse]
  )

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => setSidebarVisible(true)} className="mr-3">
          <Menu size={24} color="#666" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground">
          {currentChat?.title || "ChatGPT"}
        </Text>
      </View>

      {/* Sidebar Modal */}
      <Modal
        visible={sidebarVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View className="flex-1 bg-background">
          {/* Sidebar Header */}
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text className="text-lg font-semibold text-foreground">Chats</Text>
            <TouchableOpacity onPress={() => setSidebarVisible(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* New Chat Button */}
          <View className="p-4">
            <TouchableOpacity
              onPress={handleNewChat}
              className="flex-row items-center gap-2 rounded-2xl border border-border bg-background px-4 py-3"
            >
              <Plus size={20} color="#666" />
              <Text className="flex-1 font-medium text-foreground">New Chat</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Label */}
          <View className="px-6 pb-2">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent
            </Text>
          </View>

          {/* Chat List */}
          <ScrollView className="flex-1 px-2">
            {chats.length === 0 ? (
              <View className="px-4 py-12">
                <Text className="text-center text-sm text-muted-foreground">
                  No conversations yet
                </Text>
              </View>
            ) : (
              <View className="gap-1">
                {chats.map(chat => (
                  <TouchableOpacity
                    key={chat._id}
                    onPress={() => {
                      setCurrentChatId(chat._id as Id<"chats">)
                      setSidebarVisible(false)
                    }}
                    className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 ${
                      currentChatId === chat._id ? "bg-accent" : ""
                    }`}
                  >
                    <MessageSquare size={18} color="#666" />
                    <Text className="flex-1 font-medium text-foreground" numberOfLines={1}>
                      {chat.title}
                    </Text>
                    <TouchableOpacity
                      onPress={e => {
                        e.stopPropagation()
                        handleDeleteChat(chat._id as Id<"chats">)
                      }}
                      className="rounded-lg p-1"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Messages Area */}
      <ScrollView className="flex-1">
        {messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-12">
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-purple-500/10">
              <Sparkles size={40} color="#a855f7" />
            </View>
            <Text className="mb-2 text-center text-2xl font-semibold text-foreground">
              How can I help you today?
            </Text>
            <Text className="mb-6 text-center text-muted-foreground">
              Choose a suggestion below or start typing
            </Text>
            <View className="w-full gap-3">
              {suggestions.map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSubmit(suggestion)}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <Text className="font-medium text-foreground">{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View className="px-4 py-6">
            {messages.map(message => {
              const version = message.versions[0]
              const isUser = message.role === "user"

              return (
                <View
                  key={message.key}
                  className={`mb-6 flex-row gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <View
                    className={`h-8 w-8 items-center justify-center rounded-full ${
                      isUser ? "bg-primary" : ""
                    }`}
                    style={!isUser ? { backgroundColor: "#a855f7" } : undefined}
                  >
                    {isUser ? (
                      <User size={16} color="#fff" />
                    ) : (
                      <Bot size={16} color="#fff" />
                    )}
                  </View>

                  {/* Message Bubble */}
                  <View className="flex-1">
                    <View
                      className={`rounded-2xl px-4 py-3 ${
                        isUser
                          ? "bg-primary self-end"
                          : "border border-border bg-card self-start"
                      }`}
                      style={{ maxWidth: "85%" }}
                    >
                      <Text
                        className={`text-sm leading-relaxed ${
                          isUser ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {version.content}
                        {version.id === streamingMessageId && (
                          <Text className="text-foreground"> ▊</Text>
                        )}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    {!isUser && (
                      <View className="mt-2 flex-row gap-2">
                        <TouchableOpacity className="rounded-lg p-1.5">
                          <Copy size={14} color="#666" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={status === "streaming"}
                          className="rounded-lg p-1.5"
                        >
                          <RotateCw size={14} color="#666" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="border-t border-border bg-background p-4">
          <View className="relative rounded-3xl border border-border bg-background shadow-lg">
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Message ChatGPT..."
              placeholderTextColor="#999"
              multiline
              maxLength={2000}
              editable={status !== "streaming"}
              className="max-h-32 min-h-[56px] w-full rounded-3xl bg-transparent px-5 py-4 pr-14 text-sm text-foreground"
              style={{ textAlignVertical: "top" }}
            />
            <TouchableOpacity
              onPress={() => handleSubmit(inputValue)}
              disabled={!inputValue.trim() || status === "streaming"}
              className={`absolute bottom-2 right-2 h-10 w-10 items-center justify-center rounded-full ${
                inputValue.trim() && status !== "streaming" ? "bg-primary" : "bg-muted"
              }`}
            >
              <Send
                size={18}
                color={inputValue.trim() && status !== "streaming" ? "#fff" : "#999"}
              />
            </TouchableOpacity>
          </View>
          <Text className="mt-2 text-center text-xs text-muted-foreground">
            ChatGPT can make mistakes. Check important info.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}
