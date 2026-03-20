import { useEffect, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
import MessageComposer from "@/components/chat/MessageComposer";
import ChatMessageItem from "@/components/chat/ChatMessageItem";
import type { AIModel } from "@/hooks/useCodeGenerator";
import type { ChatMessage, ChatThread } from "@/types/chat";

interface ChatWorkspaceProps {
  activeChat: ChatThread | null;
  input: string;
  aiModel: AIModel;
  onInputChange: (value: string) => void;
  onModelChange: (model: AIModel) => void;
  onSend: () => void;
  onCancelEdit: () => void;
  onCopyMessage: (content: string) => void;
  onEditMessage: (message: ChatMessage) => void;
  isGenerating: boolean;
  isEditing: boolean;
}

const ChatWorkspace = ({
  activeChat,
  input,
  aiModel,
  onInputChange,
  onModelChange,
  onSend,
  onCancelEdit,
  onCopyMessage,
  onEditMessage,
  isGenerating,
  isEditing,
}: ChatWorkspaceProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length, activeChat?.messages.at(-1)?.content]);

  return (
    <section className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
      <div className="bg-transparent px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:h-11 sm:w-11">
            <Bot size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{activeChat?.title || "New Chat"}</div>
            <div className="truncate text-xs text-muted-foreground">Futuristic AI code workspace with memory</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 pb-[18rem] sm:px-6 sm:py-5 sm:pb-[20rem]">
        {activeChat?.messages.length ? (
          <div className="grid gap-4">
            {activeChat.messages.map((message) => (
              <ChatMessageItem key={message.id} message={message} onCopy={onCopyMessage} onEdit={onEditMessage} />
            ))}
            <div ref={endRef} />
          </div>
        ) : (
          <div className="mx-auto mt-6 max-w-3xl rounded-[28px] border border-primary/20 bg-card/75 p-6 text-center shadow-[0_0_90px_hsl(var(--primary)/0.12)] sm:mt-10 sm:rounded-[32px] sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:h-14 sm:w-14">
              <Sparkles size={22} />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Build with DEV404 chat.</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Ask for a navbar, a dashboard, a Node API, a refactor, or a full UI concept. The conversation persists per chat and generated code appears inline.
            </p>
          </div>
        )}
      </div>

      <MessageComposer
        value={input}
        aiModel={aiModel}
        onChange={onInputChange}
        onModelChange={onModelChange}
        onSend={onSend}
        onCancelEdit={onCancelEdit}
        isGenerating={isGenerating}
        isEditing={isEditing}
      />
    </section>
  );
};

export default ChatWorkspace;
