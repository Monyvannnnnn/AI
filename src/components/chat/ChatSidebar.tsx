import { useEffect, useState } from "react";
import { Download, MessageSquarePlus, Pencil, Search, Trash2, Trash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";

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
  onClearHistory: () => void;
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
  onClearHistory,
}: ChatSidebarProps) => {
  const [renameTarget, setRenameTarget] = useState<ChatThread | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatThread | null>(null);
  const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    setDraftTitle(renameTarget?.title ?? "");
  }, [renameTarget]);

  const filteredChats = chats.filter((chat) => 
    chat.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupedChats = filteredChats.reduce<Record<string, ChatThread[]>>((accumulator, chat) => {
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
    <div className="flex h-full w-full flex-col gap-5 px-1 py-2">
      <div className="space-y-4">
        <motion.button
          whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-4 py-3 text-[14px] font-bold text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.1)] transition-shadow hover:shadow-[0_0_30px_rgba(var(--primary),0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          <MessageSquarePlus size={18} strokeWidth={2.5} />
          New Thread
        </motion.button>

        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search threads"
            className="w-full rounded-2xl border border-white/5 bg-white/[0.03] py-2.5 pl-10 pr-4 text-[13px] text-foreground outline-none transition-all placeholder:text-muted-foreground/30 focus:bg-white/[0.06] focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <AnimatePresence mode="popLayout">
          {filteredChats.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-muted-foreground/20">
                <Search size={24} />
              </div>
              <p className="mt-4 text-[12px] font-medium text-muted-foreground/40">No threads found</p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-8">
                {orderedGroups.map((label) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={label}
                    className="space-y-2"
                  >
                    <h3 className="sticky top-0 z-10 bg-transparent px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 backdrop-blur-sm">
                      {label}
                    </h3>
                    <div className="space-y-1">
                      {groupedChats[label].map((chat) => {
                        const isActive = activeChatId === chat.chatId;
                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={chat.chatId}
                            className={cn(
                              "group relative flex items-center rounded-[18px] transition-all duration-300",
                              isActive 
                                ? "bg-primary/[0.08] text-foreground ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)]" 
                                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                            )}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="active-indicator"
                                className="absolute left-0 h-6 w-[3px] rounded-full bg-primary"
                                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                              />
                            )}
                            
                            <button
                              type="button"
                              onClick={() => onSelectChat(chat.chatId)}
                              className="flex-1 truncate px-4 py-3.5 text-left text-[14px] font-semibold leading-tight"
                            >
                              <div className="truncate">{chat.title}</div>
                            </button>
                            
                            <div className="flex items-center gap-1 pr-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setRenameTarget(chat); }}
                                className="rounded-xl p-2 transition-colors hover:bg-white/10"
                                title="Rename"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDownloadChat(chat); }}
                                className="rounded-xl p-2 transition-colors hover:bg-white/10"
                                title="Export"
                              >
                                <Download size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(chat); }}
                                className="rounded-xl p-2 text-destructive/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              {chats.length > 0 && !search.trim() && (
                <button
                  type="button"
                  onClick={() => setIsClearHistoryOpen(true)}
                  className="mx-2 mt-4 flex items-center gap-2 px-2 py-3 text-[12px] font-semibold text-muted-foreground/40 transition-colors hover:text-destructive/60"
                >
                  <Trash size={14} />
                  Clear History
                </button>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="max-w-[400px] border-white/5 bg-card/95 p-6 shadow-2xl backdrop-blur-3xl sm:rounded-[28px]">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl font-bold">Rename Thread</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="e.g. Dashboard Concept"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium outline-none transition-all focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="rounded-2xl hover:bg-white/5" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button className="rounded-2xl bg-primary px-6" onClick={handleRenameConfirm}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[400px] border-white/5 bg-card/95 p-6 shadow-2xl backdrop-blur-3xl sm:rounded-[28px]">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="text-xl font-bold text-destructive">Delete Thread?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-muted-foreground/70">
              This action is permanent. All code generations and chat history for this thread will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isClearHistoryOpen} onOpenChange={setIsClearHistoryOpen}>
        <AlertDialogContent className="max-w-[400px] border-white/5 bg-card/95 p-6 shadow-2xl backdrop-blur-3xl sm:rounded-[28px]">
          <AlertDialogHeader className="gap-2">
            <AlertDialogTitle className="text-xl font-bold text-destructive">Clear All History?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed text-muted-foreground/70">
              This will permanently delete <span className="font-bold text-foreground">{chats.length} conversations</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onClearHistory();
                setIsClearHistoryOpen(false);
              }} 
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatSidebar;
