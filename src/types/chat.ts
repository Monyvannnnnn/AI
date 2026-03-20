export type MessageRole = "user" | "assistant";

export interface GeneratedCode {
  html: string;
  tailwind: string;
  javascript: string;
  python: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  imageUrl?: string | null;
  generatedCode?: GeneratedCode | null;
  isStreaming?: boolean;
}

export interface ChatThread {
  chatId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}
