'use client';

import { useMemo, useState } from 'react';
import BottomDock from '@/components/BottomDock';
import ChatAssistantFab from '@/components/ChatAssistantFab';
import { CalendarDays, CheckCircle2, Clock, Users, Sparkles } from 'lucide-react';

const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Premium Nyama Choma Feast',
    chef: 'Chef David Mwangi',
    date: '2025-10-29',
    time: '19:00',
    guests: 6,
    status: 'confirmed' as const,
    notes: 'Guest of honour prefers mild spice.',
  },
  {
    id: 2,
    title: 'Swahili Coastal Dinner',
    chef: 'Chef Amina Hassan',
    date: '2025-11-03',
    time: '18:30',
    guests: 4,
    status: 'pending' as const,
    notes: 'Set table on the terrace · include vegan option.',
  },
  {
    id: 3,
    title: 'Brunch & Pastries Experience',
    chef: 'Chef Sofia Rossi',
    date: '2025-11-11',
    time: '10:00',
    guests: 8,
    status: 'pending' as const,
    notes: 'Bring additional gluten-free pastries.',
  },
];

const statusCopy = {
  confirmed: {
    label: 'Confirmed',
    tone: 'bg-success/15 text-success',
  },
  pending: {
    label: 'Awaiting confirmation',
    tone: 'bg-warning/15 text-warning',
  },
} as const;

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [selectedMonth] = useState({ year: 2025, month: 9 }); // zero-indexed -> October 2025
  const [selectedEvent, setSelectedEvent] = useState(MOCK_EVENTS[0]);

  const calendarGrid = useMemo(() => {
    const date = new Date(selectedMonth.year, selectedMonth.month, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(selectedMonth.year, selectedMonth.month + 1, 0).getDate();

    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - firstDay + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return { day: null, events: [] as typeof MOCK_EVENTS };
      }

      const dateString = new Date(selectedMonth.year, selectedMonth.month, dayNumber)
        .toISOString()
        .slice(0, 10);

      const eventsForDay = MOCK_EVENTS.filter((event) => event.date === dateString);

      return {
        day: dayNumber,
        events: eventsForDay,
      };
    });
  }, [selectedMonth]);

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold text-accent uppercase tracking-[0.35em]">My Calendar</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 max-w-2xl">
              <h1 className="text-4xl font-semibold text-white">Track your upcoming culinary experiences</h1>
              <p className="text-sm text-muted">
                View upcoming tastings, monitor confirmations, and keep special requests organised.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full bg-surface-elevated px-5 py-3 soft-border shadow-glow">
              <CalendarDays className="h-5 w-5 text-accent" />
              <span className="text-sm text-white">October 2025</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Clock} label="Upcoming" value="03" tone="bg-surface-elevated" />
            <StatCard icon={CheckCircle2} label="Confirmed" value="01" tone="bg-success/10" />
            <StatCard icon={Users} label="Guests hosted" value="26" tone="bg-surface-elevated" />
            <StatCard icon={SparkleIcon} label="Memorable moments" value="12" tone="bg-accent/20" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl bg-surface-elevated soft-border shadow-glow p-6">
            <div className="grid grid-cols-7 text-xs text-muted uppercase tracking-[0.4em] mb-4">
              {dayNames.map((day) => (
                <span key={day} className="text-center">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 text-sm">
              {calendarGrid.map((cell, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={!cell.day}
                  onClick={() => cell.events[0] && setSelectedEvent(cell.events[0])}
                  className={`min-h-[88px] rounded-2xl border border-transparent bg-surface text-left p-3 transition hover:border-accent/40 ${
                    cell.events.length > 0 ? 'shadow-glow border-accent/30' : 'soft-border'
                  } ${!cell.day ? 'opacity-40 cursor-default' : ''}`}
                >
                  <span className="text-[11px] text-muted">{cell.day ?? ''}</span>
                  {cell.events.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {cell.events.map((event) => (
                        <p key={event.id} className="rounded-lg bg-accent/20 px-2 py-1 text-[11px] text-white">
                          {event.title}
                        </p>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-surface-elevated soft-border shadow-glow p-6 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Upcoming highlight</p>
                <h2 className="text-lg font-semibold text-white">{selectedEvent.title}</h2>
                <p className="text-sm text-muted">{selectedEvent.chef}</p>
              </div>

              <div className="space-y-3 text-sm text-muted">
                <InfoRow label="Date" value={formatDate(selectedEvent.date)} />
                <InfoRow label="Time" value={`${selectedEvent.time} EAT`} />
                <InfoRow label="Guests" value={`${selectedEvent.guests} wageni`} />
                <InfoRow label="Status" value={statusCopy[selectedEvent.status].label} tone={statusCopy[selectedEvent.status].tone} />
              </div>

              <div className="rounded-2xl bg-surface-highlight px-4 py-3 text-xs text-muted">
                {selectedEvent.notes}
              </div>
            </div>

            <div className="rounded-3xl bg-surface-elevated soft-border p-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-[0.4em]">Next up</h2>
              <ul className="space-y-3 text-sm text-muted">
                {MOCK_EVENTS.map((event) => (
                  <li key={event.id} className="rounded-2xl bg-surface-highlight px-4 py-3">
                    <p className="text-white text-sm font-semibold">{event.title}</p>
                    <p className="text-[11px] uppercase tracking-[0.3em]">{formatDate(event.date)}</p>
                    <p className="text-[11px] text-muted">{event.chef}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </main>

      <ChatAssistantFab />
      <BottomDock />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-3xl soft-border px-5 py-4 shadow-glow flex items-center gap-3 ${tone ?? 'bg-surface'}`}>
      <Icon className="h-6 w-6 text-accent" />
      <div>
        <p className="text-xs text-muted uppercase tracking-[0.4em]">{label}</p>
        <p className="text-2xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted uppercase tracking-[0.3em]">{label}</span>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone ?? 'bg-surface-highlight text-muted'}`}>{value}</span>
    </div>
  );
}

function formatDate(input: string) {
  const date = new Date(input);
  return date.toLocaleDateString('en-KE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function SparkleIcon(props: { className?: string }) {
  return <Sparkles {...props} />;
}
