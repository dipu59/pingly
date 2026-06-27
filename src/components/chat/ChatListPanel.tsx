"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ChevronDown, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToChats } from "@/services/chatService";
import type { Chat } from "@/types/chat";
import ChatListItem from "./ChatListItem";
import UserSearchModal from "../search/UserSearchModal";
import NewGroupModal from "./NewGroupModal";

export default function ChatListPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsub = subscribeToChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const processedChats = chats
    .filter((chat) => {
      const isArchived = user?.archivedChats?.includes(chat.id);
      if (showArchived && !isArchived) return false;
      if (!showArchived && isArchived) return false;

      if (!searchQuery) return true;
      const name = chat.name ?? "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const aPinned = user?.pinnedChats?.includes(a.id) ? 1 : 0;
      const bPinned = user?.pinnedChats?.includes(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned; // Pinned first
      return 0; // Default sorting by date is maintained
    });

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "rgba(12,12,14,0.98)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <h2 className="text-base font-semibold text-white">
            {showArchived ? "Archived" : "All Chats"}
          </h2>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`}
            style={{ color: "var(--color-text-muted)" }}
          />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGroupModal(true)}
            aria-label="New group chat"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:bg-zinc-800"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Users className="h-4 w-4" />
          </button>
          <button
            id="new-chat-btn"
            onClick={() => setShowSearch(true)}
            aria-label="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:opacity-80"
            style={{ background: "var(--color-violet)", color: "white" }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            id="chat-search"
            type="search"
            placeholder="Search chats…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-zinc-600 focus:ring-1 focus:ring-violet-500/40"
            style={{
              background: "rgba(39,39,42,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ChatListSkeleton />
        ) : processedChats.length === 0 ? (
          <EmptyState
            onNewChat={() => setShowSearch(true)}
            isArchived={showArchived}
          />
        ) : (
          <AnimatePresence initial={false}>
            {processedChats.map((chat, idx) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
              >
                <ChatListItem
                  chat={chat}
                  currentUserId={user?.uid ?? ""}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* User Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <UserSearchModal
            onClose={() => setShowSearch(false)}
            onSelectUser={(chatId) => {
              setShowSearch(false);
              router.push(`/chat/${chatId}`);
            }}
          />
        )}
      </AnimatePresence>

      {/* New Group Modal */}
      <AnimatePresence>
        {showGroupModal && (
          <NewGroupModal
            onClose={() => setShowGroupModal(false)}
            onGroupCreated={(chatId) => {
              setShowGroupModal(false);
              router.push(`/chat/${chatId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="space-y-1 px-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
          <div
            className="h-11 w-11 shrink-0 animate-pulse rounded-full"
            style={{ background: "var(--color-surface-2)" }}
          />
          <div className="flex-1 space-y-2">
            <div
              className="h-3.5 w-24 animate-pulse rounded"
              style={{ background: "var(--color-surface-2)" }}
            />
            <div
              className="h-3 w-36 animate-pulse rounded"
              style={{ background: "var(--color-surface-3)" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  onNewChat,
  isArchived,
}: {
  onNewChat: () => void;
  isArchived?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-violet-muted)" }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          style={{ fill: "var(--color-violet)" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
      <div>
        <p className="font-medium text-white">
          {isArchived ? "No archived chats" : "No conversations yet"}
        </p>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {isArchived
            ? "Archive chats to hide them from your main list"
            : "Search for someone to start chatting"}
        </p>
      </div>
      {!isArchived && (
        <button
          onClick={onNewChat}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "var(--color-violet)" }}
        >
          Start new chat
        </button>
      )}
    </div>
  );
}
