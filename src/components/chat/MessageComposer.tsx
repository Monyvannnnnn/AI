import { ArrowUp, CornerDownLeft, PencilLine } from "lucide-react";
import { useEffect, useRef } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import type { AIModel } from "@/hooks/useCodeGenerator";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  value: string;
  aiModel: AIModel;
  onChange: (value: string) => void;
  onModelChange: (model: AIModel) => void;
  onSend: () => void;
  onCancelEdit: () => void;
  isGenerating: boolean;
  isEditing: boolean;
}

const MessageComposer = ({
  value,
  aiModel,
  onChange,
  onModelChange,
  onSend,
  onCancelEdit,
  isGenerating,
  isEditing,
}: MessageComposerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize logic
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "inherit";
    const computed = window.getComputedStyle(textarea);
    const height = textarea.scrollHeight + parseInt(computed.borderTopWidth) + parseInt(computed.borderBottomWidth);
    
    // Dynamic max-height: 180px on mobile, 240px on desktop
    const maxHeight = window.innerWidth < 640 ? 180 : 240;
    textarea.style.height = `${Math.min(height, maxHeight)}px`;
  }, [value]);

  return (
    <div className="sticky bottom-0 z-20 w-full px-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2 sm:px-4 sm:pb-6">
      <div className="mx-auto max-w-[800px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-card/70 shadow-2xl backdrop-blur-2xl transition-all duration-300 focus-within:border-primary/20 focus-within:ring-1 focus-within:ring-primary/10">
          {isEditing && (
            <div className="flex items-center justify-between border-b border-white/5 bg-primary/5 px-4 py-2 text-[11px] text-primary">
              <div className="flex items-center gap-2 font-medium">
                <PencilLine size={12} />
                Editing message
              </div>
              <button
                type="button"
                onClick={onCancelEdit}
                className="hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex flex-col p-1.5 sm:p-2">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!isGenerating && value.trim()) {
                    onSend();
                  }
                }
              }}
              placeholder="Ask anything..."
              rows={1}
              className="min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[16px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 scrollbar-none sm:min-h-[56px] sm:py-3 sm:text-[14px]"
            />

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-1.5 pt-1.5 sm:px-2 sm:pt-2">
              <div className="flex items-center gap-1">
                <ModelSelector selected={aiModel} onSelect={onModelChange} />
              </div>

              <button
                type="button"
                onClick={onSend}
                disabled={isGenerating || !value.trim()}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                  isGenerating || !value.trim()
                    ? "bg-white/5 text-muted-foreground/20"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                )}
                aria-label={isEditing ? "Regenerate" : "Send"}
              >
                {isEditing ? (
                  <CornerDownLeft size={16} />
                ) : (
                  <ArrowUp size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;
