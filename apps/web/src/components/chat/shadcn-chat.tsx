"use client"

import { useState, useCallback } from "react"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { SearchIcon } from "lucide-react"
import type { UIMessage } from "ai"
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
import { Copy, RotateCw } from "lucide-react"

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

const initialMessages: MessageType[] = [
  {
    key: nanoid(),
    role: "user",
    versions: [
      {
        id: nanoid(),
        content: "Can you explain how to use React hooks effectively?",
      },
    ],
  },
  {
    key: nanoid(),
    role: "assistant",
    reasoning: {
      steps: [
        {
          label: "Searching for React hooks documentation",
          status: "complete",
          searchResults: ["react.dev", "developer.mozilla.org"],
        },
        {
          label: "Analyzing best practices",
          description: "Found comprehensive guide on hooks usage patterns",
          status: "complete",
        },
      ],
    },
    versions: [
      {
        id: nanoid(),
        content: `# React Hooks Best Practices

React hooks are functions that let you use state and other React features from function components.

## Common Hooks
- **useState**: For local component state
- **useEffect**: For side effects like data fetching
- **useContext**: For consuming context values

Would you like me to explain any specific hook in more detail?`,
      },
    ],
  },
]

const mockResponses = [
  "That's a great question! Let me help you understand this concept better.",
  "I'd be happy to explain this topic in detail. Here's what you need to know...",
  "This is an interesting topic. Let me break it down for you step by step.",
]

export function ShadcnChat() {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages)
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready">("ready")
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

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
  }, [])

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim()) return

      setStatus("submitted")

      const userMessage: MessageType = {
        key: nanoid(),
        role: "user",
        versions: [{ id: nanoid(), content: message.text }],
      }
      setMessages(prev => [...prev, userMessage])

      setTimeout(() => {
        const assistantMessageId = nanoid()
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
        const assistantMessage: MessageType = {
          key: nanoid(),
          role: "assistant",
          versions: [{ id: assistantMessageId, content: "" }],
        }
        setMessages(prev => [...prev, assistantMessage])
        streamResponse(assistantMessageId, randomResponse)
      }, 500)
    },
    [streamResponse]
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
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map(message => (
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
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

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
  )
}
