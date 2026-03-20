import { useState, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import type { AIModel } from "@/hooks/useCodeGenerator";

interface PromptBarProps {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export function PromptBar({ onSubmit, isGenerating, selectedModel, onModelChange }: PromptBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim() || isGenerating) return;
    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative panel-border rounded-lg bg-accent overflow-hidden">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe exactly what to build... e.g. 'Create a modern navbar for a 1200px layout with logo on the left, 4 links, a CTA button, and smooth hover animations.'"
            rows={2}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground p-4 pr-14 resize-none outline-none font-sans"
            disabled={isGenerating}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="absolute right-3 bottom-3 h-8 w-8 rounded-md bg-foreground text-background flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-2.5 px-1">
          <ModelSelector selected={selectedModel} onSelect={onModelChange} />
          <span className="text-[11px] text-muted-foreground">
            Press Enter to generate · Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
