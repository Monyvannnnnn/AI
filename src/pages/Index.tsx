import ChatAppShell from "@/components/chat/ChatAppShell";
import { useChatApp } from "@/hooks/use-chat-app";

const Index = () => {
  const chat = useChatApp();
  return <ChatAppShell chat={chat} />;
};

export default Index;
