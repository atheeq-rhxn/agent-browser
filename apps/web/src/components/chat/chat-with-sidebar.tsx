"use client"

import { useState, useCallback, useEffect } from "react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { SearchIcon, Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from "lucide-react"
import type { UIMessage } from "ai"
import { useMutation, useQuery } from "convex/react"
import { api } from "@browser-agent/backend/convex/_generated/api"
import type { Id } from "@browser-agent/backend/convex/_generated/dataModel"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageBranch,
  MessageBranchContent,
  MessageBranchSelector,
  MessageBranchPrevious,
  MessageBranchNext,
  MessageBranchPage,
  MessageActions,
  MessageAction,
} from "@/components/ai/message"
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputAttachments,
  PromptInputAttachment,
  type PromptInputMessage,
} from "@/components/ai/prompt-input"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ai/chain-of-thought"
import { Button } from "@/components/ui/button"
import { Copy, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageVersion {
  id: string
  content: string
}

interface MessageType {
  key: string
  role: UIMessage["role"]
  versions: MessageVersion[]
  reasoning?: {
    steps: {
      label: string
      description?: string
      status: "complete" | "active" | "pending"
      searchResults?: string[]
    }[]
  }
}

const mockResponses = [
  "That's a great question! Let me help you understand this concept better.",
  "I'd be happy to explain this topic in detail. Here's what you need to know...",
  "This is an interesting topic. Let me break it down for you step by step.",
]

export function ChatWithSidebar() {
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready">("ready")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const chats = useQuery(api.chats.list) || []
  const currentChat = useQuery(
    api.chats.get,
    currentChatId ? { chatId: currentChatId } : "skip"
  )
  const createChat = useMutation(api.chats.create)
  const deleteChat = useMutation(api.chats.deleteChat)
  const addMessage = useMutation(api.chats.addMessage)

  // Load messages when chat changes
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
    async (message: PromptInputMessage) => {
      if (!message.text.trim()) return

      let chatId = currentChatId

      // Create new chat if none exists
      if (!chatId) {
        try {
          const newChatId = await createChat({ title: message.text.slice(0, 50) })
          chatId = newChatId as Id<"chats">
          setCurrentChatId(chatId)
        } catch (error) {
          toast.error("Failed to create chat")
          return
        }
      }

      setStatus("submitted")

      // Add user message to UI
      const userMessageKey = nanoid()
      const userMessage: MessageType = {
        key: userMessageKey,
        role: "user",
        versions: [{ id: userMessageKey, content: message.text }],
      }
      setMessages(prev => [...prev, userMessage])

      // Save user message to DB
      try {
        await addMessage({
          chatId,
          role: "user",
          content: message.text,
        })
      } catch (error) {
        toast.error("Failed to save message")
      }

      // Generate assistant response
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

        // Save assistant message to DB
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

  const handleRegenerate = (messageKey: string) => {
    const messageIndex = messages.findIndex(m => m.key === messageKey)
    if (messageIndex === -1 || messageIndex === 0) return

    const previousMessage = messages[messageIndex - 1]
    if (previousMessage.role !== "user") return

    const newVersionId = nanoid()
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

    setMessages(prev =>
      prev.map(msg =>
        msg.key === messageKey
          ? {
              ...msg,
              versions: [...msg.versions, { id: newVersionId, content: "" }],
            }
          : msg
      )
    )

    streamResponse(newVersionId, randomResponse)
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "flex h-full flex-col border-r bg-background transition-all duration-300",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between border-b p-3">
              <Button onClick={handleNewChat} className="flex-1 justify-start gap-2" variant="outline">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
              <Button
                onClick={() => setSidebarOpen(false)}
                size="icon"
                variant="ghost"
                className="ml-2"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              <div className="mb-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
                Recent Chats
              </div>
              {chats.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No chats yet
                </div>
              ) : (
                chats.map(chat => (
                  <div
                    key={chat._id}
                    className={cn(
                      "group relative mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-accent",
                      currentChatId === chat._id && "bg-accent"
                    )}
                    onClick={() => setCurrentChatId(chat._id as Id<"chats">)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{chat.title}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteChat(chat._id as Id<"chats">)
                      }}
                      className="shrink-0 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toggle Sidebar Button */}
        {!sidebarOpen && (
          <div className="border-b p-2">
            <Button onClick={() => setSidebarOpen(true)} size="icon" variant="ghost">
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Messages */}
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <h2 className="mb-2 text-2xl font-semibold">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Type a message below to begin chatting
                  </p>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <MessageBranch defaultBranch={0} key={message.key}>
                  <MessageBranchContent>
                    {message.versions.map(version => (
                      <Message from={message.role} key={version.id}>
                        {message.reasoning && (
                          <ChainOfThought defaultOpen={false}>
                            <ChainOfThoughtHeader>Thinking Process</ChainOfThoughtHeader>
                            <ChainOfThoughtContent>
                              {message.reasoning.steps.map((step, idx) => (
                                <ChainOfThoughtStep
                                  key={idx}
                                  icon={step.searchResults ? SearchIcon : undefined}
                                  label={step.label}
                                  description={step.description}
                                  status={step.status}
                                >
                                  {step.searchResults && (
                                    <ChainOfThoughtSearchResults>
                                      {step.searchResults.map(result => (
                                        <ChainOfThoughtSearchResult key={result}>
                                          {result}
                                        </ChainOfThoughtSearchResult>
                                      ))}
                                    </ChainOfThoughtSearchResults>
                                  )}
                                </ChainOfThoughtStep>
                              ))}
                            </ChainOfThoughtContent>
                          </ChainOfThought>
                        )}
                        <MessageContent>
                          <MessageResponse>
                            {version.content + (version.id === streamingMessageId ? "▊" : "")}
                          </MessageResponse>
                        </MessageContent>
                        {message.role === "assistant" && (
                          <MessageActions>
                            <MessageAction
                              onClick={() => handleCopy(version.content)}
                              tooltip="Copy"
                            >
                              <Copy className="h-4 w-4" />
                            </MessageAction>
                            <MessageAction
                              onClick={() => handleRegenerate(message.key)}
                              tooltip="Regenerate"
                              disabled={status === "streaming"}
                            >
                              <RotateCw className="h-4 w-4" />
                            </MessageAction>
                          </MessageActions>
                        )}
                      </Message>
                    ))}
                  </MessageBranchContent>
                  {message.versions.length > 1 && (
                    <MessageBranchSelector from={message.role}>
                      <MessageBranchPrevious />
                      <MessageBranchPage />
                      <MessageBranchNext />
                    </MessageBranchSelector>
                  )}
                </MessageBranch>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <div className="shrink-0 border-t p-4">
          <div className="mx-auto max-w-3xl">
            <PromptInput multiple onSubmit={handleSubmit}>
              <PromptInputAttachments>
                {attachment => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputBody>
                <PromptInputTextarea placeholder="Message ChatGPT..." />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                </PromptInputTools>
                <PromptInputSubmit disabled={status === "streaming"} status={status} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </div>
  )
}
