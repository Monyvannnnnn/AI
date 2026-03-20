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
  const isUser = message.role === "user";
  const visibleContent =
    message.generatedCode && message.role === "assistant"
      ? stripGeneratedCodeBlock(message.content)
      : message.content;
  const showLoadingDots = message.role === "assistant" && message.isStreaming && !visibleContent;

  return (
    <div className={cn("flex w-full px-4 sm:px-0", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("group flex max-w-[90%] flex-col sm:max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div className={cn("mb-1.5 flex items-center gap-2 px-1", isUser ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            {isUser ? "You" : "Assistant"}
          </span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="relative">
          {visibleContent ? (
            <div
              className={cn(
                "whitespace-pre-wrap break-words text-[14px] leading-relaxed shadow-sm transition-all duration-200",
                isUser
                  ? "rounded-[16px] rounded-tr-[4px] bg-primary px-5 py-4 text-primary-foreground"
                  : "rounded-[16px] rounded-tl-[4px] border border-white/5 bg-card/40 px-6 py-5 text-foreground/90 backdrop-blur-sm",
              )}
            >
              {visibleContent}
            </div>
          ) : null}

          <div className={cn(
            "absolute top-2 flex opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "-left-10" : "-right-10"
          )}>
            <button
              type="button"
              onClick={() => onCopy(message.content)}
              className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-white/5 hover:text-foreground"
              title="Copy message"
            >
              <Copy size={14} />
            </button>
            {isUser && (
              <button
                type="button"
                onClick={() => onEdit(message)}
                className="rounded-lg p-1.5 text-muted-foreground/50 hover:bg-white/5 hover:text-foreground"
                title="Edit message"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>

        {message.imageUrl && (
          <div className={cn(
            "mt-3 overflow-hidden rounded-2xl border border-white/5 bg-card/30 shadow-lg",
            isUser ? "ml-auto" : "mr-auto"
          )}>
            <img
              src={message.imageUrl}
              alt="Uploaded reference"
              className="max-h-[300px] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </div>
        )}

        {showLoadingDots && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-2xl border border-white/5 bg-card/30 px-5 py-4 text-primary backdrop-blur-md">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="dot-wave h-1.5 w-1.5 rounded-full bg-current"
                style={{ animationDelay: `${dot * 200}ms` }}
              />
            ))}
          </div>
        )}

        {message.generatedCode && <GeneratedCodePanel code={message.generatedCode} />}
      </div>
    </div>
  );
};

export default ChatMessageItem;
