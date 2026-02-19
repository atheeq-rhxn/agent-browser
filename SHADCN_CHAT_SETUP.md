# Shadcn AI Chat UI - Complete Setup

## What's Been Installed

### Shadcn AI Components
- ✅ **Conversation** - Scroll container with auto-scroll button
- ✅ **Message** - Message bubbles with branching support
- ✅ **PromptInput** - Advanced input with attachments, tools, and actions
- ✅ **ChainOfThought** - Collapsible reasoning display
- ✅ **Agent** - Agent configuration display (bonus)

### Dependencies
- `ai` - Vercel AI SDK types
- `nanoid` - Unique ID generation
- `streamdown` - Markdown rendering for messages
- `use-stick-to-bottom` - Auto-scroll behavior
- `@radix-ui/react-use-controllable-state` - State management
- `@radix-ui/react-collapsible` - Collapsible components

## Features

### Message System
- **Message Branching**: Multiple versions of responses with prev/next navigation
- **Copy Messages**: Click copy icon to copy any message
- **Regenerate**: Generate new response versions
- **Streaming**: Word-by-word response animation
- **Markdown Support**: Full markdown rendering in messages

### Chain of Thought
- **Collapsible Reasoning**: Click "Thinking Process" to expand/collapse
- **Step-by-step Display**: Shows AI's thinking process
- **Search Results**: Displays sources consulted
- **Status Indicators**: Complete, active, pending states

### Input System
- **File Attachments**: Drag & drop or click to attach files
- **Image Previews**: Hover over attachments to see previews
- **Paste Images**: Paste images directly from clipboard
- **Action Menu**: Extensible menu for additional actions
- **Auto-resize**: Textarea grows with content
- **Submit States**: Visual feedback for submitted/streaming/error states

### Conversation
- **Auto-scroll**: Automatically scrolls to new messages
- **Scroll Button**: Appears when not at bottom
- **Smooth Animations**: Fade in/out effects

## File Structure

```
apps/web/src/
├── components/
│   ├── ai/
│   │   ├── agent.tsx              # Agent configuration display
│   │   ├── chain-of-thought.tsx   # Reasoning display
│   │   ├── conversation.tsx       # Scroll container
│   │   ├── message.tsx            # Message bubbles
│   │   └── prompt-input.tsx       # Input system
│   ├── chat/
│   │   └── shadcn-chat.tsx        # Main chat component
│   └── ui/
│       ├── accordion.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── hover-card.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
└── routes/
    ├── __root.tsx                 # Added TooltipProvider
    └── chat.tsx                   # Chat route

```

## Usage

### Start the Dev Server
```bash
cd apps/web
npm run dev
```

Visit `http://localhost:3001/chat`

### Customization

#### Add More Mock Responses
Edit `mockResponses` array in `shadcn-chat.tsx`:
```typescript
const mockResponses = [
  "Your custom response here...",
  // Add more...
]
```

#### Enable Chain of Thought
Add `reasoning` to any assistant message:
```typescript
{
  key: nanoid(),
  role: "assistant",
  reasoning: {
    steps: [
      {
        label: "Step description",
        status: "complete",
        searchResults: ["source1.com", "source2.com"],
      },
    ],
  },
  versions: [{ id: nanoid(), content: "Response..." }],
}
```

#### Connect to Real AI Backend
Replace the mock response logic in `handleSubmit`:
```typescript
// Replace this:
setTimeout(() => {
  const randomResponse = mockResponses[...]
  streamResponse(assistantMessageId, randomResponse)
}, 500)

// With your API call:
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ message: message.text }),
})
const data = await response.json()
streamResponse(assistantMessageId, data.response)
```

## Key Features Explained

### Message Branching
When you click "Regenerate", it creates a new version of the response. Use the arrow buttons to navigate between versions.

### File Attachments
- Click the "+" button to open file picker
- Drag & drop files anywhere on the input
- Paste images from clipboard
- Hover over attachments to see previews
- Click X to remove attachments

### Chain of Thought
Shows the AI's reasoning process:
- Click header to expand/collapse
- Each step shows what the AI is thinking
- Search results show sources consulted
- Status indicators show progress

### Streaming
Responses appear word-by-word like ChatGPT. The streaming speed can be adjusted in the `streamResponse` function.

## Troubleshooting

### Components Not Found
Make sure all imports use `@/components/` prefix, not `~/components/`

### Tooltip Errors
Ensure `TooltipProvider` wraps your app in `__root.tsx`

### Styling Issues
The components use Tailwind CSS. Make sure your `tailwind.config.ts` includes the components directory.

## Next Steps

1. **Connect to Backend**: Replace mock responses with real API calls
2. **Add Authentication**: Integrate user authentication
3. **Persist Conversations**: Save conversations to database
4. **Add More Tools**: Extend the action menu with more capabilities
5. **Customize Styling**: Adjust colors and spacing to match your brand
