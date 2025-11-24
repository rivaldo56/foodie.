import ClientBottomNav from '@/components/layout/ClientBottomNav';

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white pb-24">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Foodie Client</p>
            <h1 className="text-xl font-semibold">Discover experiences</h1>
            <p className="text-xs text-white/50">Concierge-curated journeys just for you</p>
          </div>
          <span className="text-xs text-white/50">Personalised for food lovers</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-8">{children}</main>

      <ClientBottomNav />
    </div>
  );
}
