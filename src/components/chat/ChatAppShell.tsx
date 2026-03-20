import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
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
    copyMessage,
    downloadChat,
    sendMessage,
    startEditing,
    cancelEditing,
  } = chat;

  const desktopSidebarClasses = desktopSidebarOpen
    ? "lg:translate-x-0 lg:scale-100 lg:opacity-100"
    : "lg:pointer-events-none lg:-translate-x-8 lg:scale-[0.98] lg:opacity-0";
  const desktopToggleClasses = desktopSidebarOpen ? "lg:left-[340px]" : "lg:left-4";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <StarBackground />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(190_80%_60%/0.10),transparent_22%)]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="fixed inset-x-0 top-0 z-40 bg-background/70 px-4 py-3 shadow-[0_12px_40px_hsl(var(--background)/0.12)] backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen((value) => !value)}
                className="rounded-xl border border-border/60 p-2 text-muted-foreground lg:hidden"
                aria-label={mobileSidebarOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <Menu size={18} />
              </button>
              <BrandLogo showIcon={false} />
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col pt-[73px] lg:flex-row">
          <div
            className={`overflow-hidden border-b border-white/10 bg-background/30 px-3 transition-[max-height,opacity,padding] duration-300 ease-out sm:px-4 lg:hidden ${
              mobileSidebarOpen ? "max-h-[75vh] opacity-100 py-3" : "max-h-0 opacity-0 py-0"
            }`}
          >
            <div className="mx-auto w-full max-w-[1200px]">
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
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDesktopSidebarOpen((value) => !value)}
            className={`fixed top-[88px] z-40 hidden rounded-xl border border-border/60 bg-background/85 p-2 text-muted-foreground shadow-[0_12px_30px_hsl(var(--background)/0.22)] backdrop-blur-xl transition-all duration-300 ease-out hover:scale-105 hover:border-primary/30 lg:inline-flex ${desktopToggleClasses}`}
            aria-label={desktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={desktopSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {desktopSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          <div
            className={`fixed inset-y-0 left-0 z-30 hidden w-[320px] max-w-[320px] transition-[transform,opacity] duration-300 ease-out lg:left-4 lg:top-[73px] lg:block lg:h-[calc(100vh-73px)] ${desktopSidebarClasses}`}
          >
            <div className="h-full w-full max-w-[320px] transition-transform duration-300 ease-out">
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
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4 lg:px-0 lg:pb-0">
            <div className="mx-auto h-full w-full max-w-[1200px]">
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
        </div>
      </div>
    </div>
  );
};

export default ChatAppShell;
