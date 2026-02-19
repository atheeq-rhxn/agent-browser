import { createFileRoute } from "@tanstack/react-router";
import { ChatContainer } from "../components/chat/chat-container";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  return <ChatContainer />;
}
