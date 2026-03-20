import { ArrowUp, CornerDownLeft, PencilLine } from "lucide-react";
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
  return (
    <div className="sticky bottom-0 z-20 w-full px-4 pb-6 pt-2">
      <div className="mx-auto max-w-[800px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-card/60 shadow-2xl backdrop-blur-2xl transition-all duration-300 focus-within:border-primary/20 focus-within:ring-1 focus-within:ring-primary/10">
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

          <div className="flex flex-col p-2">
            <textarea
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
              placeholder="How can I help you today?"
              rows={1}
              className="min-h-[48px] w-full resize-none bg-transparent px-3 py-3 text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 sm:min-h-[56px]"
            />

            <div className="flex items-center justify-between gap-3 border-t border-white/5 px-2 pt-2">
              <div className="flex items-center gap-1.5">
                <ModelSelector selected={aiModel} onSelect={onModelChange} />
              </div>

              <button
                type="button"
                onClick={onSend}
                disabled={isGenerating || !value.trim()}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                  isGenerating || !value.trim()
                    ? "bg-white/5 text-muted-foreground/30"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 hover:brightness-110"
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
        <p className="mt-3 text-center text-[10px] text-muted-foreground/40">
          AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default MessageComposer;
