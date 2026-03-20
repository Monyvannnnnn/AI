import { useEffect, useState } from "react";
import { Download, MessageSquare, MessageSquarePlus, Pencil, Search, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatThread } from "@/types/chat";

interface ChatSidebarProps {
  chats: ChatThread[];
  activeChatId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string) => void;
  onDownloadChat: (chat: ChatThread) => void;
}

const getRelativeGroup = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  return "Earlier";
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const getPreview = (chat: ChatThread) => {
  const lastMessage =
    [...chat.messages].reverse().find((message) => message.role === "user" && message.content.trim()) ??
    [...chat.messages].reverse().find((message) => message.content.trim());
  if (!lastMessage) return "No messages yet";
  const flattened = lastMessage.content.replace(/\s+/g, " ").trim();
  return flattened.length > 84 ? `${flattened.slice(0, 84)}...` : flattened;
};

const ChatSidebar = ({
  chats,
  activeChatId,
  search,
  onSearchChange,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onDownloadChat,
}: ChatSidebarProps) => {
  const [renameTarget, setRenameTarget] = useState<ChatThread | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatThread | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    setDraftTitle(renameTarget?.title ?? "");
  }, [renameTarget]);

  const groupedChats = chats.reduce<Record<string, ChatThread[]>>((accumulator, chat) => {
    const label = getRelativeGroup(chat.updatedAt);
    accumulator[label] = [...(accumulator[label] ?? []), chat];
    return accumulator;
  }, {});

  const orderedGroups = ["Today", "Yesterday", "This Week", "Earlier"].filter((label) => groupedChats[label]?.length);

  const handleRenameConfirm = () => {
    if (!renameTarget || !draftTitle.trim()) return;
    onRenameChat(renameTarget.chatId, draftTitle.trim());
    setRenameTarget(null);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    onDeleteChat(deleteTarget.chatId);
    setDeleteTarget(null);
  };

  return (
    <>
      <aside className="flex h-full w-full flex-col overflow-hidden rounded-[30px] border border-white/15 bg-[linear-gradient(180deg,hsl(var(--card)/0.94),hsl(var(--background)/0.92))] shadow-[0_30px_120px_hsl(var(--background)/0.55)] backdrop-blur-2xl lg:max-w-[320px]">
        <div className="border-b border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12 text-primary shadow-[0_0_34px_hsl(var(--primary)/0.16)]">
            <Sparkles size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-[0.26em] text-foreground/55">Workspace</div>
            <div className="mt-1 text-lg font-semibold text-foreground">Conversation Memory</div>
            <div className="mt-1 text-xs text-muted-foreground">Searchable history with quick actions and recent context.</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">Chats</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{chats.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">Search</div>
            <div className="mt-1 text-sm font-medium text-foreground">{search.trim() ? "Filtered" : "All visible"}</div>
          </div>
        </div>

        <button type="button" onClick={onNewChat} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_hsl(var(--primary)/0.16)] transition-all hover:brightness-110 hover:shadow-[0_0_56px_hsl(var(--primary)/0.24)]">
          <MessageSquarePlus size={16} />
          Start New Chat
        </button>

        <div className="relative mt-4">
          <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search chats"
            className="w-full rounded-2xl border border-white/12 bg-white/6 py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/75 focus:border-primary/35 focus:bg-white/10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chats.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <MessageSquare size={20} />
            </div>
            <div className="mt-4 text-base font-semibold text-foreground">No chats yet</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Start a conversation and your recent work will appear here for quick access.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orderedGroups.map((label) => (
              <section key={label}>
                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/40">{label}</div>
                <div className="grid gap-2">
                  {groupedChats[label].map((chat) => {
                    const isActive = activeChatId === chat.chatId;
                    return (
                      <button
                        key={chat.chatId}
                        type="button"
                        onClick={() => onSelectChat(chat.chatId)}
                        className={`group w-full rounded-[24px] border px-4 py-3 text-left transition-all ${
                          isActive
                            ? "border-primary/35 bg-primary/12 shadow-[0_0_50px_hsl(var(--primary)/0.12)]"
                            : "border-white/10 bg-white/4 hover:border-primary/18 hover:bg-white/8"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${isActive ? "border-primary/30 bg-primary/14 text-primary" : "border-white/10 bg-white/5 text-muted-foreground"}`}>
                            <MessageSquare size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="break-words text-sm font-semibold leading-5 text-foreground">{chat.title}</div>
                                <div className="mt-1 break-words text-xs leading-5 text-muted-foreground">{getPreview(chat)}</div>
                              </div>
                              <div className="flex shrink-0 items-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                                <button type="button" onClick={(event) => { event.stopPropagation(); setRenameTarget(chat); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Rename ${chat.title}`}>
                                  <Pencil size={14} />
                                </button>
                                <button type="button" onClick={(event) => { event.stopPropagation(); onDownloadChat(chat); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Download ${chat.title}`}>
                                  <Download size={14} />
                                </button>
                                <button type="button" onClick={(event) => { event.stopPropagation(); setDeleteTarget(chat); }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label={`Delete ${chat.title}`}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-foreground/70">{chat.messages.length} {chat.messages.length === 1 ? "message" : "messages"}</div>
                              <div className="text-[11px] text-muted-foreground">{formatTimestamp(chat.updatedAt)}</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      </aside>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--background)/0.96))] p-0 shadow-[0_30px_100px_hsl(var(--background)/0.55)]">
          <div className="border-b border-white/10 px-6 py-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-xl text-foreground">Rename Chat</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                Update the conversation title. Keep it short and easy to recognize from the sidebar.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5">
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              placeholder="Enter a new chat title"
              autoFocus
              className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/35 focus:bg-white/10"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleRenameConfirm();
                }
              }}
            />
          </div>
          <DialogFooter className="border-t border-white/10 px-6 py-4 sm:justify-between sm:space-x-0">
            <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-xl px-5" onClick={handleRenameConfirm} disabled={!draftTitle.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,hsl(var(--card)/0.98),hsl(var(--background)/0.96))] p-0 shadow-[0_30px_100px_hsl(var(--background)/0.55)]">
          <div className="border-b border-white/10 px-6 py-5">
            <AlertDialogHeader className="space-y-2 text-left">
              <AlertDialogTitle className="text-xl text-foreground">Delete Chat</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                This will permanently remove <span className="font-medium text-foreground">{deleteTarget?.title ?? "this chat"}</span> and its message history.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="border-t border-white/10 px-6 py-4 sm:justify-between sm:space-x-0">
            <AlertDialogCancel className="mt-0 rounded-xl border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive px-5 text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteConfirm}>
              Delete Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatSidebar;
