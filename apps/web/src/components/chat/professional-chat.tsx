"use client"

import { useState, useCallback, useEffect } from "react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  PanelLeftClose, 
  PanelLeft,
  Copy,
  RotateCw,
  Sparkles,
  User,
  Bot
} from "lucide-react"
import type { UIMessage } from "ai"
import { useMutation, useQuery } from "convex/react"
import { api } from "@browser-agent/backend/convex/_generated/api"
import type { Id } from "@browser-agent/backend/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MessageVersion {
  id: string
  content: string
}

interface MessageType {
  key: string
  role: UIMessage["role"]
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

export function ProfessionalChat() {
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready">("ready")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
      toast.success("New chat created")
    } catch (error) {
      toast.error("Failed to create chat")
    }
  }

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      await deleteChat({ chatId })
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        setMessages([])
      }
      toast.success("Chat deleted")
    } catch (error) {
      toast.error("Failed to delete chat")
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
          toast.error("Failed to create chat")
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
        toast.error("Failed to save message")
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
            toast.error("Failed to save response")
          }
        }
      }, 500)
    },
    [currentChatId, createChat, addMessage, streamResponse]
  )

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(inputValue)
    }
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex h-full flex-col border-r bg-background transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b p-3">
              <Button 
                onClick={handleNewChat} 
                className="flex-1 justify-start gap-2 rounded-xl" 
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
              <Button
                onClick={() => setSidebarOpen(false)}
                size="icon"
                variant="ghost"
                className="rounded-xl"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="mb-2 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </div>
              {chats.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.map(chat => (
                    <div
                      key={chat._id}
                      className={cn(
                        "group relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all hover:bg-accent/50",
                        currentChatId === chat._id && "bg-accent"
                      )}
                      onClick={() => setCurrentChatId(chat._id as Id<"chats">)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate font-medium">{chat.title}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteChat(chat._id as Id<"chats">)
                        }}
                        className="shrink-0 rounded-lg p-1 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        {!sidebarOpen && (
          <div className="border-b p-3">
            <Button 
              onClick={() => setSidebarOpen(true)} 
              size="icon" 
              variant="ghost"
              className="rounded-xl"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <Sparkles className="h-10 w-10 text-purple-500" />
              </div>
              <h2 className="mb-3 text-3xl font-semibold">How can I help you today?</h2>
              <p className="mb-8 text-center text-muted-foreground">
                Choose a suggestion below or start typing your question
              </p>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSubmit(suggestion)}
                    className="group rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent hover:shadow-md"
                  >
                    <div className="font-medium transition-colors group-hover:text-primary">
                      {suggestion}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-8">
              {messages.map(message => {
                const version = message.versions[0]
                const isUser = message.role === "user"

                return (
                  <div
                    key={message.key}
                    className={cn(
                      "mb-6 flex gap-4",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                          {version.content}
                          {version.id === streamingMessageId && (
                            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-current" />
                          )}
                        </p>
                      </div>
                      
                      {!isUser && (
                        <div className="flex items-center gap-1 opacity-0 transition-opacity hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(version.content)}
                            className="h-7 rounded-lg px-2"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={status === "streaming"}
                            className="h-7 rounded-lg px-2"
                          >
                            <RotateCw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-3xl border bg-background shadow-lg transition-shadow focus-within:shadow-xl">
              <textarea
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatGPT..."
                disabled={status === "streaming"}
                rows={1}
                className="max-h-48 min-h-[56px] w-full resize-none rounded-3xl bg-transparent px-5 py-4 pr-14 text-sm focus:outline-none disabled:opacity-50"
                style={{ fieldSizing: "content" } as any}
              />
              <Button
                onClick={() => handleSubmit(inputValue)}
                disabled={!inputValue.trim() || status === "streaming"}
                size="icon"
                className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              ChatGPT can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
