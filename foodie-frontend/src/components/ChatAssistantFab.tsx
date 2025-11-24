'use client';

import { FormEvent, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';

const QUICK_PROMPTS = [
  'Nipendekezee mlo wa jioni',
  'Nisaidie kuweka nafasi ya mpishi',
  'Ni chakula gani kipya leo?',
];

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function ChatAssistantFab() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content:
        'Karibu! Mimi ni msaidizi wa Foodie AI. Naweza kukusaidia kupendekeza milo, kuweka oda, au kujibu maswali yako kwa Kiswahili.',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${generateId()}`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach Gemini service');
      }

      const data: { reply: string } = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${generateId()}`,
        role: 'assistant',
        content: data.reply?.trim() || 'Samahani, sikupata jibu. Tafadhali jaribu tena.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('[Foodie] Chat assistant request failed:', error);
      setError('Hatukuweza kuwasiliana na msaidizi. Jaribu tena baadae.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendPrompt(message);
  };

  return (
    <div className="fixed bottom-28 right-6 z-50">
      {open && (
        <div className="mb-4 w-[320px] rounded-3xl bg-surface-elevated soft-border shadow-glow overflow-hidden">
          <header className="flex items-center justify-between px-4 py-3 border-b border-surface-stroke">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted">Msaidizi</p>
              <p className="text-sm font-semibold text-white">Habari! Tusaidie kukutumikia</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-highlight text-muted hover:text-white"
              aria-label="Funga gumzo"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="px-4 py-5 space-y-4 text-sm leading-relaxed">
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {messages.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.role === 'assistant'
                      ? 'rounded-2xl rounded-bl-sm bg-accent/20 px-4 py-3 text-white'
                      : 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-surface-highlight px-4 py-3 text-white'
                  }
                >
                  {item.content}
                </div>
              ))}

              {loading && (
                <div className="rounded-2xl bg-surface-highlight/80 px-4 py-3 text-xs text-muted">
                  Msaidizi anaandika...
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-danger/15 px-4 py-3 text-xs text-danger">
                  {error}
                </div>
              )}

              <p className="text-[11px] text-muted">
                Chagua mapendekezo hapa chini au andika ujumbe wako.
              </p>
            </div>

            <div className="grid gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendPrompt(prompt)}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-4 py-2 text-xs text-muted hover:text-white"
                  disabled={loading}
                >
                  <Sparkles className="h-4 w-4 text-accent" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={sendMessage} className="border-t border-surface-stroke bg-surface/90 px-4 py-3">
            <div className="flex items-center gap-2 rounded-full bg-surface-highlight px-3 py-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Andika ujumbe wako hapa..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-glow disabled:opacity-40"
                disabled={!message.trim()}
                aria-label="Tuma ujumbe"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-white shadow-glow transition-transform hover:scale-105"
        aria-label="Fungua msaidizi wa Foodie"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <span className="mt-2 block text-center text-[11px] font-medium text-muted">
        Msaidizi wa Kiswahili
      </span>
    </div>
  );
}
