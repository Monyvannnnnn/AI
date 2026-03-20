import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildTranscript,
  createMessage,
  createThread,
  createTitleFromPrompt,
  downloadTextFile,
} from "@/lib/chat-utils";
import type { ChatMessage, ChatThread, GeneratedCode } from "@/types/chat";

const STORAGE_KEY = "dev404-ui-builder-chat";
type AIModel = "gpt-5-mini" | "gemini-2.5-flash" | "claude-4";

const MODEL_MAP: Record<AIModel, string> = {
  "gpt-5-mini": "openai/gpt-5-mini",
  "gemini-2.5-flash": "google/gemini-2.5-flash",
  "claude-4": "google/gemini-3-flash-preview",
};

interface PersistedState {
  chats: ChatThread[];
  activeChatId: string | null;
}

const loadPersistedState = (): PersistedState => {
  const fallback: PersistedState = { chats: [], activeChatId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};

const normalizeGeneratedCode = (data: any): GeneratedCode => ({
  html: data?.code?.html || data?.html || "",
  tailwind: data?.code?.css || data?.css || "",
  javascript: data?.code?.js || data?.js || "",
  python: data?.code?.backend || data?.backend || "",
});

const resolveAssistantText = (data: any, prompt: string) => {
  if (typeof data?.explanation === "string" && data.explanation.trim()) return data.explanation.trim();
  if (typeof data?.message === "string" && data.message.trim()) return data.message.trim();
  return `Generated a UI result for: ${prompt || "your request"}`;
};

export const useChatApp = () => {
  const [state, setState] = useState<PersistedState>(loadPersistedState);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [aiModel, setAiModel] = useState<AIModel>("gemini-2.5-flash");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activeChat = useMemo(
    () => state.chats.find((chat) => chat.chatId === state.activeChatId) ?? null,
    [state.activeChatId, state.chats],
  );

  const chats = useMemo(() => {
    const base = [...state.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (!search.trim()) return base;
    return base.filter((chat) => chat.title.toLowerCase().includes(search.trim().toLowerCase()));
  }, [search, state.chats]);

  const ensureChat = () => {
    if (activeChat) return activeChat;
    const chat = createThread("guest-user", "New Chat");
    setState((current) => ({ ...current, chats: [chat, ...current.chats], activeChatId: chat.chatId }));
    return chat;
  };

  const updateChat = (chatId: string, updater: (chat: ChatThread) => ChatThread) => {
    setState((current) => ({
      ...current,
      chats: current.chats.map((chat) => (chat.chatId === chatId ? updater(chat) : chat)),
    }));
  };

  const addNewChat = () => {
    const chat = createThread("guest-user", "New Chat");
    setInput("");
    setEditingMessageId(null);
    setState((current) => ({ ...current, chats: [chat, ...current.chats], activeChatId: chat.chatId }));
  };

  const selectChat = (chatId: string) => {
    setEditingMessageId(null);
    setInput("");
    setState((current) => ({ ...current, activeChatId: chatId }));
  };

  const deleteChat = (chatId: string) => {
    setState((current) => {
      const nextChats = current.chats.filter((chat) => chat.chatId !== chatId);
      return {
        ...current,
        chats: nextChats,
        activeChatId: current.activeChatId === chatId ? nextChats[0]?.chatId ?? null : current.activeChatId,
      };
    });
  };

  const clearHistory = () => {
    setState({ chats: [], activeChatId: null });
    toast.success("History cleared");
  };

  const renameChat = (chatId: string, title: string) => {
    if (!title.trim()) return;
    updateChat(chatId, (chat) => ({ ...chat, title: title.trim() }));
  };

  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setInput(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setInput("");
  };

  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("Message copied");
  };

  const downloadChat = (chat: ChatThread) => {
    downloadTextFile(`${chat.title || "dev404-chat"}.txt`, buildTranscript(chat.messages));
  };

  const applyAssistantResponse = (
    chatId: string,
    assistantId: string,
    assistantText: string,
    generatedCode: GeneratedCode,
  ) => {
    let index = 0;
    const tick = () => {
      index += 4;
      const isComplete = index >= assistantText.length;
      updateChat(chatId, (chat) => ({
        ...chat,
        updatedAt: new Date().toISOString(),
        messages: chat.messages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: assistantText.slice(0, index),
                generatedCode: isComplete ? generatedCode : null,
                isStreaming: !isComplete,
              }
            : message,
        ),
      }));
      if (!isComplete) window.setTimeout(tick, 10);
    };
    tick();
  };

  const sendMessage = async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    const chat = ensureChat();
    const userMessage = createMessage("user", prompt);
    const assistantPlaceholder = createMessage("assistant", "");
    assistantPlaceholder.isStreaming = true;

    updateChat(chat.chatId, (currentChat) => {
      const nextMessages = editingMessageId
        ? currentChat.messages.filter((message) => message.id !== editingMessageId)
        : currentChat.messages;

      return {
        ...currentChat,
        title: currentChat.messages.length === 0 ? createTitleFromPrompt(prompt) : currentChat.title,
        updatedAt: new Date().toISOString(),
        messages: [...nextMessages, userMessage, assistantPlaceholder],
      };
    });

    setInput("");
    setEditingMessageId(null);
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-code", {
        body: {
          prompt,
          model: MODEL_MAP[aiModel],
        },
      });

      if (error) throw new Error(error.message || "Generation failed");
      if (data?.error) throw new Error(data.error);

      const generatedCode = normalizeGeneratedCode(data);
      if (!generatedCode.html && !generatedCode.tailwind && !generatedCode.javascript && !generatedCode.python) {
        throw new Error("Invalid response from AI");
      }

      applyAssistantResponse(
        chat.chatId,
        assistantPlaceholder.id,
        resolveAssistantText(data, prompt),
        generatedCode,
      );
    } catch (error) {
      updateChat(chat.chatId, (currentChat) => ({
        ...currentChat,
        messages: currentChat.messages.map((message) =>
          message.id === assistantPlaceholder.id
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : "DEV404 could not generate a response.",
                isStreaming: false,
              }
            : message,
        ),
      }));
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    chats,
    activeChat,
    input,
    setInput,
    aiModel,
    setAiModel,
    search,
    setSearch,
    isGenerating,
    editingMessageId,
    addNewChat,
    selectChat,
    deleteChat,
    renameChat,
    startEditing,
    cancelEditing,
    copyMessage,
    downloadChat,
    sendMessage,
  };
};

export type UseChatAppState = ReturnType<typeof useChatApp>;
