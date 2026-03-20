import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AIModel, MODEL_LABELS } from "@/hooks/useCodeGenerator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelSelectorProps {
  selected: AIModel;
  onSelect: (model: AIModel) => void;
  compact?: boolean;
}

const models: AIModel[] = ["gpt-5-mini", "gemini-2.5-flash", "claude-4"];

export function ModelSelector({ selected, onSelect, compact = false }: ModelSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/35 px-4 py-2.5 text-sm font-medium text-black transition-colors hover:border-primary/35 hover:bg-background/45 dark:text-white",
            compact && "border-none bg-transparent px-0 py-0 text-[13px] text-slate-200 hover:bg-transparent hover:text-white dark:text-slate-200",
          )}
        >
          {compact ? null : <span className="h-2 w-2 rounded-full bg-primary" />}
          {MODEL_LABELS[selected]}
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={10}
        className="min-w-[220px] rounded-2xl border border-border/60 bg-card/95 p-2 backdrop-blur-xl"
      >
        {models.map((model) => (
          <DropdownMenuItem
            key={model}
            onClick={() => onSelect(model)}
            className={`rounded-xl px-3 py-2 text-sm text-white hover:text-white focus:text-white ${model === selected ? "bg-accent text-white" : ""}`}
          >
            {MODEL_LABELS[model]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
