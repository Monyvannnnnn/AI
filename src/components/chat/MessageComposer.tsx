import { ArrowUp, ChevronDown, CornerDownLeft, PencilLine, Plus, Sparkles } from "lucide-react";
import { ModelSelector } from "@/components/ModelSelector";
import type { AIModel } from "@/hooks/useCodeGenerator";

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
    <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background via-background/92 to-transparent px-2 pb-2 pt-4 sm:px-4 sm:pb-3 sm:pt-5">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="rounded-[30px] border border-transparent bg-transparent p-0 shadow-none sm:rounded-[28px] sm:border sm:border-primary/30 sm:bg-primary/18 sm:p-3 sm:shadow-[0_0_40px_hsl(var(--primary)/0.1)] sm:backdrop-blur-md">
          {isEditing ? (
            <div className="mb-3 flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs text-primary sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <PencilLine size={14} />
                Editing previous message
              </div>
              <button type="button" onClick={onCancelEdit} className="text-primary/80 hover:text-primary">
                Cancel
              </button>
            </div>
          ) : null}

          <div className="rounded-[24px] border border-white/10 bg-[#07171d]/98 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-[24px] sm:border-none sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none">
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
              placeholder="Ask for follow-up changes"
              rows={2}
              className="min-h-[58px] w-full resize-none bg-transparent px-0 py-0 text-[15px] leading-6 text-slate-100 outline-none placeholder:text-slate-400 sm:min-h-0 sm:rounded-2xl sm:border sm:border-primary/20 sm:bg-background/35 sm:px-3 sm:py-3 sm:text-sm sm:text-foreground sm:placeholder:text-muted-foreground/75"
            />

            <div className="mt-4 flex items-center justify-between gap-3 sm:hidden">
              <div className="flex min-w-0 items-center gap-4 overflow-x-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  aria-label="Add attachment"
                >
                  <Plus size={18} />
                </button>
                <ModelSelector selected={aiModel} onSelect={onModelChange} compact />
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-slate-200 transition-colors hover:text-white"
                >
                  Medium
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-[#39d353] transition-colors hover:text-[#63e37a]"
                >
                  <Sparkles size={14} />
                  IDE context
                </button>
              </div>

              <button
                type="button"
                onClick={onSend}
                disabled={isGenerating || !value.trim()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8f9786] text-[#102026] shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition-opacity disabled:opacity-40"
                aria-label={isEditing ? "Regenerate message" : "Send message"}
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </div>

          <div className="mt-3 hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
            <div className="flex justify-center sm:justify-start">
              <ModelSelector selected={aiModel} onSelect={onModelChange} />
            </div>
            <button type="button" onClick={onSend} disabled={isGenerating || !value.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-40 sm:w-auto">
              <CornerDownLeft size={15} />
              {isEditing ? "Regenerate" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;
