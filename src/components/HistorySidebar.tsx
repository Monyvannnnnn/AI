import { motion, AnimatePresence } from "framer-motion";
import { Clock, MessageSquare, ChevronLeft } from "lucide-react";
import type { ChatSession } from "@/hooks/useCodeGenerator";

interface HistorySidebarProps {
  sessions: ChatSession[];
  isOpen: boolean;
  onToggle: () => void;
}

export function HistorySidebar({ sessions, isOpen, onToggle }: HistorySidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-sidebar border-r border-border overflow-hidden flex-shrink-0 z-10"
            style={{ backdropFilter: "blur(20px)" }}
          >
            <div className="p-4 flex items-center justify-between border-b border-border">
              <span className="text-sm font-medium text-sidebar-accent-foreground tracking-tight">History</span>
              <button
                onClick={onToggle}
                className="p-1 rounded-sm hover:bg-sidebar-accent transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto scrollbar-thin h-[calc(100%-49px)]">
              {sessions.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-xs text-muted-foreground">No generations yet</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className="px-4 py-3 border-b border-border hover:bg-sidebar-accent transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-sidebar-accent-foreground truncate leading-snug">
                      {session.prompt}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {session.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {session.model}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
