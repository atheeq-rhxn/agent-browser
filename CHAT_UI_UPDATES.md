# ChatGPT-Style UI Updates

## Overview
Updated both web and React Native apps with a modern ChatGPT-like chat interface featuring advanced capabilities like message branching, streaming responses, and rich interactions.

## Features Implemented

### Web App (`apps/web`)
- ✅ ChatGPT-style UI with gradient bot avatar
- ✅ Streaming text animation (simulated)
- ✅ **Message branching** - Multiple versions of responses with navigation
- ✅ **Chain of Thought** - Collapsible reasoning display showing AI thinking process
- ✅ Stop generation button
- ✅ Regenerate response functionality
- ✅ Copy message to clipboard
- ✅ Edit user messages
- ✅ Collapsible sidebar
- ✅ Beautiful empty state with suggestion prompts
- ✅ Rounded input with attachment button
- ✅ Auto-redirect from home to chat
- ✅ Model selector (GPT-4o, Claude, Gemini)
- ✅ Web search toggle
- ✅ Microphone toggle
- ✅ Sources display for assistant responses
- ✅ Step-by-step reasoning with search results

### React Native App (`apps/native`)
- ✅ ChatGPT-style UI matching web design
- ✅ Streaming text animation (simulated)
- ✅ Stop generation button
- ✅ Regenerate response functionality
- ✅ Copy message to clipboard
- ✅ Modal sidebar navigation
- ✅ Beautiful empty state with suggestion prompts
- ✅ Rounded input with attachment button
- ✅ Chat as default screen (no login required)
- ✅ Full-screen chat experience

## Key Changes

### Web Components
1. **chat-container.tsx** - Added streaming, regenerate, edit, and enhanced empty state
2. **chat-input.tsx** - Added stop button, attachment button, rounded design
3. **chat-message.tsx** - Added copy, regenerate, edit buttons with animations
4. **chat-sidebar.tsx** - Added collapse functionality and better organization

### React Native Components
1. **chat-container.tsx** - Added streaming, regenerate, and enhanced empty state
2. **chat-input.tsx** - Added stop button, attachment button, rounded design
3. **chat-message.tsx** - Added copy and regenerate buttons
4. **chat-sidebar.tsx** - Added header with close button and better organization

### Navigation Updates
- Web: Index route redirects to `/chat`
- Native: Chat screen is now the initial route in the drawer
- Native: Chat screen has no header for full-screen experience

## How to Use

### Web

First, make sure you have the environment variables set up:

1. Create `apps/web/.env` file (already created with your Convex deployment):
```env
VITE_CONVEX_URL=https://curious-lemur-577.convex.cloud
VITE_CONVEX_SITE_URL=https://curious-lemur-577.convex.site
```

2. Start the development server:
```bash
cd apps/web
npm run dev
```

Visit `http://localhost:3001` - you'll be redirected to the chat interface.

### React Native
```bash
cd apps/native
npm start
```
The app will open directly to the chat screen.

## Backend Integration

The current implementation uses simulated responses. To connect to a real AI backend:

1. Replace the simulated response logic in `handleSendMessage` function
2. Connect to your preferred LLM API (OpenAI, Anthropic, etc.)
3. Implement actual streaming using Server-Sent Events or WebSockets
4. Update the stop generation logic to cancel API requests

Example integration point in both `chat-container.tsx` files:
```typescript
// Replace this simulated streaming logic
const fullResponse = "This is a simulated response...";
// With actual API calls to your backend
```

## UI Features

### Message Actions
- **Copy**: Click the copy icon to copy message text
- **Regenerate**: Click the regenerate icon on the last assistant message
- **Edit**: Click the edit icon on user messages (web only)
- **Stop**: Click the stop button while generating to halt the response

### Sidebar
- **New Chat**: Start a fresh conversation
- **Select Chat**: Click any conversation to continue it
- **Delete Chat**: Click the trash icon to remove a conversation
- **Collapse** (web): Click the collapse icon to minimize the sidebar

### Empty State
- Click any suggestion prompt to start a conversation with that topic
- Prompts are customizable in the `suggestionPrompts` array

## Customization

### Colors
The gradient bot avatar uses purple/pink colors. To customize:
- Web: Update the gradient classes in `chat-message.tsx`
- Native: Update the `backgroundColor` style in `chat-message.tsx`

### Prompts
Edit the suggestion prompts in `chat-container.tsx`:
```typescript
const suggestionPrompts = [
  { title: "Your title", desc: "your description" },
  // Add more...
];
```

### Streaming Speed
Adjust the streaming delay in `chat-container.tsx`:
```typescript
await new Promise(resolve => setTimeout(resolve, 50)); // Change 50ms
```
