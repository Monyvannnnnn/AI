import type { ChatMessage, ChatThread, GeneratedCode } from "@/types/chat";

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const createTitleFromPrompt = (prompt: string) =>
  prompt.trim().split(/\s+/).slice(0, 6).join(" ").slice(0, 42) || "New Chat";

export const createThread = (userId: string, openingPrompt = "New Chat"): ChatThread => {
  const now = new Date().toISOString();
  return {
    chatId: createId(),
    userId,
    title: createTitleFromPrompt(openingPrompt),
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

export const createMessage = (
  role: ChatMessage["role"],
  content: string,
  imageUrl?: string | null,
  generatedCode?: GeneratedCode | null,
): ChatMessage => ({
  id: createId(),
  role,
  content,
  createdAt: new Date().toISOString(),
  imageUrl: imageUrl ?? null,
  generatedCode: generatedCode ?? null,
});

export const buildTranscript = (messages: ChatMessage[]) =>
  messages
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "DEV404"}: ${message.content}${message.imageUrl ? "\n[Image attached]" : ""}`,
    )
    .join("\n\n");

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const GENERATED_CODE_KEYS = ["html", "tailwind", "javascript", "python"] as const;

const extractFencedContent = (content: string) =>
  content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? content.trim();

const isGeneratedCodeShape = (value: unknown): value is GeneratedCode =>
  Boolean(
    value &&
      typeof value === "object" &&
      GENERATED_CODE_KEYS.every((key) => typeof (value as Record<string, unknown>)[key] === "string"),
  );

const parseJsonValue = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractNestedGeneratedCode = (value: unknown): GeneratedCode | null => {
  if (isGeneratedCodeShape(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const candidate of Object.values(record)) {
    if (typeof candidate !== "string") continue;
    const parsedCandidate = parseJsonValue(extractFencedContent(candidate));
    if (isGeneratedCodeShape(parsedCandidate)) {
      return parsedCandidate;
    }
  }

  return null;
};

export const extractGeneratedCode = (content: string): GeneratedCode | null => {
  const parsed = parseJsonValue(extractFencedContent(content));
  return extractNestedGeneratedCode(parsed);
};

export const stripGeneratedCodeBlock = (content: string) => {
  const parsed = parseJsonValue(extractFencedContent(content)) as
    | { explanation?: unknown; sections?: unknown; intent?: unknown; code?: unknown }
    | null;

  if (parsed && typeof parsed === "object") {
    if (typeof parsed.explanation === "string") {
      return parsed.explanation.trim();
    }
    if ("sections" in parsed || "intent" in parsed || "code" in parsed) {
      return "";
    }
  }

  if (extractGeneratedCode(content)) {
    return "";
  }

  return content.replace(/```(?:json)?\s*[\s\S]*?```/gi, "").trim();
};
