import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalChat } from "../components/chat/professional-chat";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function ChatPage() {
  return <ProfessionalChat />;
}
