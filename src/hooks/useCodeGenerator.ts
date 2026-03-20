import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatSession {
  id: string;
  prompt: string;
  timestamp: Date;
  model: string;
}

export interface GeneratedCode {
  html: string;
  css: string;
  js: string;
}

export type AIModel = "gpt-5-mini" | "gemini-2.5-flash" | "claude-4";

export const MODEL_LABELS: Record<AIModel, string> = {
  "gpt-5-mini": "GPT-5 Mini",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
  "claude-4": "Claude 4",
};

const MODEL_MAP: Record<AIModel, string> = {
  "gpt-5-mini": "openai/gpt-5-mini",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "claude-4": "google/gemini-3-flash-preview",
};

export function useCodeGenerator() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentCode, setCurrentCode] = useState<GeneratedCode | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-2.5-flash");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "preview">("html");

  const generate = async (prompt: string) => {
    setIsGenerating(true);

    const session: ChatSession = {
      id: crypto.randomUUID(),
      prompt,
      timestamp: new Date(),
      model: MODEL_LABELS[selectedModel],
    };

    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: { prompt, model: MODEL_MAP[selectedModel] },
      });

      if (error) {
        throw new Error(error.message || "Generation failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.code?.html) {
        throw new Error("Invalid response from AI");
      }

      const code: GeneratedCode = {
        html: data.code.html || "",
        css: data.code.css || "",
        js: data.code.js || "",
      };

      setCurrentCode(code);
      setSessions((prev) => [session, ...prev]);
      setActiveTab("html");
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err.message || "Failed to generate code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    sessions,
    currentCode,
    selectedModel,
    setSelectedModel,
    isGenerating,
    activeTab,
    setActiveTab,
    generate,
  };
}
