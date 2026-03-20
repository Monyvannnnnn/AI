import { Copy, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { stripGeneratedCodeBlock } from "@/lib/chat-utils";
import type { ChatMessage } from "@/types/chat";
import GeneratedCodePanel from "@/components/chat/GeneratedCodePanel";

interface ChatMessageItemProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onEdit: (message: ChatMessage) => void;
}

const ChatMessageItem = ({ message, onCopy, onEdit }: ChatMessageItemProps) => {
  const visibleContent =
    message.generatedCode && message.role === "assistant"
      ? stripGeneratedCodeBlock(message.content)
      : message.content;
  const showLoadingDots = message.role === "assistant" && message.isStreaming && !visibleContent;

  return (
    <div className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group max-w-[96%] px-1 py-3 sm:px-2",
          message.role === "user" ? "ml-auto md:max-w-[96%]" : "md:max-w-[78%]",
        )}
      >
        <div className={cn("mb-2 flex items-center gap-3", message.role === "user" ? "justify-end" : "justify-between")}>
          <div className={cn("text-xs uppercase tracking-[0.22em] text-muted-foreground", message.role === "user" ? "text-right" : "") }>
            {message.role === "user" ? "You" : "DEV404"}
            <span className="ml-2 text-[10px] lowercase text-muted-foreground/70">
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
            <button type="button" onClick={() => onCopy(message.content)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <Copy size={14} />
            </button>
            {message.role === "user" ? (
              <button type="button" onClick={() => onEdit(message)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                <Pencil size={14} />
              </button>
            ) : null}
          </div>
        </div>

        {visibleContent ? (
          <div
            className={cn(
              "whitespace-pre-wrap break-words text-sm leading-7 text-foreground/95",
              message.role === "user"
                ? "ml-auto inline-block max-w-full rounded-[28px] border border-primary/30 bg-primary/18 px-4 py-4 text-center shadow-[0_0_40px_hsl(var(--primary)/0.1)] backdrop-blur-md"
                : "",
            )}
          >
            {visibleContent}
          </div>
        ) : null}

        {message.imageUrl ? (
          <div className={cn("mt-3 overflow-hidden rounded-[24px] border border-white/10 bg-background/30", message.role === "user" ? "ml-auto inline-block max-w-[360px]" : "max-w-[420px]")}>
            <img src={message.imageUrl} alt="Uploaded reference" className="max-h-[320px] w-full object-cover" />
          </div>
        ) : null}

        {showLoadingDots ? (
          <div className="inline-flex items-center gap-1 rounded-[24px] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground shadow-[0_0_28px_hsl(var(--primary)/0.08)] backdrop-blur-md">
            {[0, 1, 2, 3].map((dot) => (
              <span key={dot} className="dot-wave inline-block text-lg leading-none" style={{ animationDelay: `${dot * 160}ms` }}>
                .
              </span>
            ))}
          </div>
        ) : null}

        {message.generatedCode ? <GeneratedCodePanel code={message.generatedCode} /> : null}
      </div>
    </div>
  );
};

export default ChatMessageItem;
