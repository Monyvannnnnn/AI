import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWorkspace from "@/components/chat/ChatWorkspace";
import { ThemeToggle } from "@/components/theme-toggle";
import StarBackground from "@/components/StarBackground";
import type { UseChatAppState } from "@/hooks/use-chat-app";

interface ChatAppShellProps {
  chat: UseChatAppState;
}

const ChatAppShell = ({ chat }: ChatAppShellProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const {
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
    clearHistory,
    copyMessage,
    downloadChat,
    sendMessage,
    startEditing,
    cancelEditing,
  } = chat;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background font-sans">
      <StarBackground />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.05),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(190_80%_60%/0.03),transparent_30%)]" />

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: desktopSidebarOpen ? 260 : 0,
          opacity: desktopSidebarOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-30 hidden h-full shrink-0 overflow-hidden border-r border-white/5 bg-card/20 backdrop-blur-3xl lg:block"
      >
        <motion.div
          initial={false}
          animate={{
            x: desktopSidebarOpen ? 0 : -260,
            opacity: desktopSidebarOpen ? 1 : 0.6,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="flex h-full w-[260px] flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-white/5 p-5">
            <BrandLogo showIcon={false} />
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDesktopSidebarOpen(false)}
              className="rounded-xl p-2 text-muted-foreground/60 hover:text-foreground"
            >
              <PanelLeftClose size={18} />
            </motion.button>
          </div>
          
          <div className="flex-1 overflow-hidden px-3 py-4">
            <ChatSidebar
              chats={chats}
              activeChatId={activeChat?.chatId ?? null}
              search={search}
              onSearchChange={setSearch}
              onNewChat={addNewChat}
              onSelectChat={selectChat}
              onDeleteChat={deleteChat}
              onRenameChat={renameChat}
              onDownloadChat={downloadChat}
              onClearHistory={clearHistory}
            />
          </div>

          <div className="border-t border-white/5 p-5">
            <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] p-2">
              <span className="pl-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </motion.div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-white/5 bg-background/40 px-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-muted-foreground"
            >
              <Menu size={20} />
            </motion.button>
            <BrandLogo showIcon={false} />
          </div>
          <ThemeToggle />
        </header>

        {/* Desktop Sidebar Toggle (when closed) */}
        <AnimatePresence>
          {!desktopSidebarOpen && (
            <motion.button
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              whileHover={{ scale: 1.05, x: 5 }}
              onClick={() => setDesktopSidebarOpen(true)}
              className="fixed left-6 top-6 z-40 hidden rounded-2xl border border-white/10 bg-card/80 p-3 text-primary shadow-2xl shadow-primary/10 backdrop-blur-xl lg:block"
              title="Open sidebar"
            >
              <PanelLeftOpen size={20} strokeWidth={2.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-hidden">
          <div className="mx-auto h-full w-full max-w-[800px]">
            <ChatWorkspace
              activeChat={activeChat}
              input={input}
              aiModel={aiModel}
              onInputChange={setInput}
              onModelChange={setAiModel}
              onSend={sendMessage}
              onCancelEdit={cancelEditing}
              onCopyMessage={copyMessage}
              onEditMessage={startEditing}
              isGenerating={isGenerating}
              isEditing={Boolean(editingMessageId)}
            />
          </div>
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-md lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/5 bg-card/95 p-5 shadow-2xl lg:hidden"
            >
              <div className="mb-8 flex items-center justify-between">
                <BrandLogo showIcon={false} />
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="rounded-xl p-2 text-muted-foreground/60"
                >
                  <PanelLeftClose size={20} />
                </button>
              </div>
              <ChatSidebar
                chats={chats}
                activeChatId={activeChat?.chatId ?? null}
                search={search}
                onSearchChange={setSearch}
                onNewChat={() => {
                  addNewChat();
                  setMobileSidebarOpen(false);
                }}
                onSelectChat={(chatId) => {
                  selectChat(chatId);
                  setMobileSidebarOpen(false);
                }}
                onDeleteChat={deleteChat}
                onRenameChat={renameChat}
                onDownloadChat={downloadChat}
                onClearHistory={clearHistory}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAppShell;
