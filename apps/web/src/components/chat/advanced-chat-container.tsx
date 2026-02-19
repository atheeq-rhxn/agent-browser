"use client"

import { CheckIcon, GlobeIcon, MicIcon, Send, User, Bot, Copy, RotateCw, ChevronLeft, ChevronRight, SearchIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { cn } from "@/lib/utils"
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "../ai/chain-of-thought"

interface MessageVersion {
  id: string
  content: string
}

interface Message {
  key: string
  from: "user" | "assistant"
  versions: MessageVersion[]
  sources?: { href: string; title: string }[]
  reasoning?: {
    steps: {
      label: string
      description?: string
      status: "complete" | "active" | "pending"
      searchResults?: string[]
    }[]
  }
}

const initialMessages: Message[] = [
  {
    key: nanoid(),
    from: "user",
    versions: [
      {
        id: nanoid(),
        content: "Can you explain how to use React hooks effectively?",
      },
    ],
  },
  {
    key: nanoid(),
    from: "assistant",
    sources: [
      {
        href: "https://react.dev/reference/react",
        title: "React Documentation",
      },
    ],
    reasoning: {
      steps: [
        {
          label: "Searching for React hooks documentation",
          status: "complete" as const,
          searchResults: ["react.dev", "developer.mozilla.org", "stackoverflow.com"],
        },
        {
          label: "Analyzing best practices from official docs",
          description: "Found comprehensive guide on hooks usage patterns",
          status: "complete" as const,
        },
        {
          label: "Compiling examples and recommendations",
          status: "complete" as const,
        },
      ],
    },
    versions: [
      {
        id: nanoid(),
        content: `# React Hooks Best Practices

React hooks are a powerful feature that let you use state and other React features without writing classes. Here are some tips for using them effectively:

## Rules of Hooks
1. **Only call hooks at the top level** of your component or custom hooks
2. **Don't call hooks inside loops, conditions, or nested functions**

## Common Hooks
- **useState**: For local component state
- **useEffect**: For side effects like data fetching
- **useContext**: For consuming context
- **useReducer**: For complex state logic

Would you like me to explain any specific hook in more detail?`,
      },
    ],
  },
]

const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
  },
  {
    id: "claude-sonnet-4",
    name: "Claude 4 Sonnet",
    provider: "Anthropic",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
  },
]

const suggestions = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
  "Best practices for React development",
]

const mockResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles and best practices in the field.",
  "I'd be happy to explain this topic in detail. From my understanding, there are several important factors to consider when approaching this problem. Let me break it down step by step for you.",
  "This is an interesting topic that comes up frequently. The solution typically involves understanding the core concepts and applying them in the right context. Here's what I recommend...",
]

export function AdvancedChatContainer() {
  const [model, setModel] = useState<string>(models[0].id)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [text, setText] = useState<string>("")
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false)
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false)
  const [status, setStatus] = useState<"submitted" | "streaming" | "ready" | "error">("ready")
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const [currentBranches, setCurrentBranches] = useState<Record<string, number>>({})

  const selectedModelData = models.find(m => m.id === model)

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
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50))
    }

    setStatus("ready")
    setStreamingMessageId(null)
  }, [])

  const addUserMessage = useCallback(
    (content: string) => {
      const userMessage: Message = {
        key: `user-${Date.now()}`,
        from: "user",
        versions: [
          {
            id: `user-${Date.now()}`,
            content,
          },
        ],
      }
      setMessages(prev => [...prev, userMessage])

      setTimeout(() => {
        const assistantMessageId = `assistant-${Date.now()}`
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
        const assistantMessage: Message = {
          key: `assistant-${Date.now()}`,
          from: "assistant",
          versions: [
            {
              id: assistantMessageId,
              content: "",
            },
          ],
        }
        setMessages(prev => [...prev, assistantMessage])
        streamResponse(assistantMessageId, randomResponse)
      }, 500)
    },
    [streamResponse]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || status === "streaming") return

    setStatus("submitted")
    addUserMessage(text.trim())
    setText("")
  }

  const handleSuggestionClick = (suggestion: string) => {
    setStatus("submitted")
    addUserMessage(suggestion)
  }

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
    toast.success("Copied to clipboard")
  }

  const handleRegenerate = (messageKey: string) => {
    const messageIndex = messages.findIndex(m => m.key === messageKey)
    if (messageIndex === -1 || messageIndex === 0) return

    const previousMessage = messages[messageIndex - 1]
    if (previousMessage.from !== "user") return

    const currentBranch = currentBranches[messageKey] || 0
    const currentVersion = messages[messageIndex].versions[currentBranch]

    const newVersionId = `${messageKey}-v${messages[messageIndex].versions.length}`
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]

    setMessages(prev =>
      prev.map(msg =>
        msg.key === messageKey
          ? {
              ...msg,
              versions: [
                ...msg.versions,
                {
                  id: newVersionId,
                  content: "",
                },
              ],
            }
          : msg
      )
    )

    setCurrentBranches(prev => ({
      ...prev,
      [messageKey]: messages[messageIndex].versions.length,
    }))

    streamResponse(newVersionId, randomResponse)
  }

  const changeBranch = (messageKey: string, direction: "prev" | "next") => {
    const message = messages.find(m => m.key === messageKey)
    if (!message) return

    const currentBranch = currentBranches[messageKey] || 0
    const newBranch =
      direction === "prev"
        ? Math.max(0, currentBranch - 1)
        : Math.min(message.versions.length - 1, currentBranch + 1)

    setCurrentBranches(prev => ({
      ...prev,
      [messageKey]: newBranch,
    }))
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map(message => {
          const currentBranch = currentBranches[message.key] || 0
          const version = message.versions[currentBranch]
          const isUser = message.from === "user"

          return (
            <div
              key={message.key}
              className={cn(
                "group w-full border-b py-8",
                isUser ? "bg-background" : "bg-muted/30"
              )}
            >
              <div className="mx-auto flex max-w-3xl gap-6 px-4">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  )}
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className="flex-1 space-y-3 overflow-hidden">
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
                  {message.sources && (
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map(source => (
                        <a
                          key={source.href}
                          href={source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {source.title}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap break-words leading-7 m-0">
                      {version.content}
                      {version.id === streamingMessageId && (
                        <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-foreground" />
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(version.content)}
                      className="h-8 px-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    {!isUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRegenerate(message.key)}
                        className="h-8 px-2"
                        disabled={status === "streaming"}
                      >
                        <RotateCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {message.versions.length > 1 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeBranch(message.key, "prev")}
                        disabled={currentBranch === 0}
                        className="h-6 px-1"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span>
                        {currentBranch + 1} / {message.versions.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeBranch(message.key, "next")}
                        disabled={currentBranch === message.versions.length - 1}
                        className="h-6 px-1"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="rounded-lg border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="relative rounded-2xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Message ChatGPT..."
              disabled={status === "streaming"}
              rows={1}
              className="max-h-48 min-h-[52px] w-full resize-none bg-transparent px-4 py-3 pr-32 text-sm focus:outline-none disabled:opacity-50"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setUseMicrophone(!useMicrophone)}
                className={cn("h-8 w-8", useMicrophone && "bg-accent")}
              >
                <MicIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setUseWebSearch(!useWebSearch)}
                className={cn("h-8 w-8", useWebSearch && "bg-accent")}
              >
                <GlobeIcon className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={!text.trim() || status === "streaming"}
                className="h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ChatGPT can make mistakes. Check important info.
          </p>
        </form>
      </div>
    </div>
  )
}
