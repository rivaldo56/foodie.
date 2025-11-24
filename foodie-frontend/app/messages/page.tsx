"use client";

import { useMemo, useState, type ComponentType } from "react";
import BottomDock from "@/components/BottomDock";
import ChatAssistantFab from "@/components/ChatAssistantFab";
import { ChefHat, MessageCircle, Pin, Send, Sparkles, UserRound } from "lucide-react";

interface Conversation {
  id: number;
  name: string;
  preview: string;
  pinned?: boolean;
  unread?: number;
  role: "assistant" | "chef" | "client";
  timestamp: string;
  icon: ComponentType<{ className?: string }>;
}

interface Message {
  id: number;
  author: "assistant" | "user";
  content: string;
  timestamp: string;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Foodie AI Assistant",
    preview: "Hi! How can I help you find the perfect chef?",
    pinned: true,
    role: "assistant",
    timestamp: "Just now",
    icon: Sparkles,
  },
  {
    id: 2,
    name: "Chef Maria Rodriguez",
    preview: "I'd be happy to prepare that for you",
    role: "chef",
    timestamp: "5m ago",
    icon: ChefHat,
  },
  {
    id: 3,
    name: "Chef Sofia Rossi",
    preview: "What time works best for you?",
    role: "chef",
    timestamp: "2h ago",
    icon: ChefHat,
  },
  {
    id: 4,
    name: "Sarah Johnson",
    preview: "Thank you for the amazing dinner!",
    role: "client",
    timestamp: "Yesterday",
    icon: UserRound,
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    author: "assistant",
    content:
      "Hi! I'm your Foodie AI assistant. I can help you find the perfect chef, book a meal, or answer any questions. What would you like to do today?",
    timestamp: "Just now",
  },
];

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [activeConversation, setActiveConversation] = useState(CONVERSATIONS[0]);
  const [messages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const filteredConversations = useMemo(() => {
    const lower = search.toLowerCase();
    return CONVERSATIONS.filter(
      (item) =>
        !lower ||
        item.name.toLowerCase().includes(lower) ||
        item.preview.toLowerCase().includes(lower)
    );
  }, [search]);

  return (
    <div className="min-h-screen pb-32">
      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px,1fr] lg:px-8">
        <aside className="flex flex-col gap-4 rounded-3xl bg-surface-elevated p-6 soft-border shadow-glow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-muted">
              Messages
            </p>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-3 py-1 text-[11px] text-muted">
              <Sparkles className="h-4 w-4 text-accent" /> New
            </span>
          </div>

          <div className="rounded-full bg-surface-highlight px-4 py-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
            />
          </div>

          <div className="flex-1 space-y-2 overflow-auto">
            {filteredConversations.map((conversation) => {
              const isActive = conversation.id === activeConversation.id;
              return (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversation(conversation)}
                  className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                    isActive
                      ? "bg-accent/15 text-white shadow-glow"
                      : "bg-surface-highlight text-muted hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2">
                      {conversation.pinned && <Pin className="h-3 w-3 text-accent" />}
                      {conversation.name}
                    </span>
                    <span className="text-muted-strong">{conversation.timestamp}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-strong">
                    {conversation.preview}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex flex-col gap-4 rounded-3xl bg-surface-elevated p-6 soft-border shadow-glow">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {activeConversation.name}
              </p>
              <span className="inline-flex items-center gap-2 text-xs text-muted">
                <UserRound className="h-4 w-4 text-accent" />
                {activeConversation.role === "assistant"
                  ? "Foodie AI assistant"
                  : activeConversation.role === "chef"
                  ? "Executive chef"
                  : "Client"}
              </span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-4 py-2 text-xs font-semibold text-muted hover:text-white">
              <MessageCircle className="h-4 w-4" />
              Start call
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-auto rounded-3xl bg-surface px-4 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.author === "assistant"
                    ? "bg-accent/20 text-white"
                    : "bg-surface-highlight text-muted"
                }`}
              >
                {message.content}
                <p className="mt-2 text-[11px] text-muted-strong">{message.timestamp}</p>
              </div>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              setDraft("");
            }}
            className="rounded-full bg-surface-highlight px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`Tuma ujumbe kwa ${activeConversation.name}...`}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-glow disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      </main>

      <ChatAssistantFab />
      <BottomDock />
    </div>
  );
}
