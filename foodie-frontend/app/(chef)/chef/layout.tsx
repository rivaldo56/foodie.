import ChefBottomNav from '@/components/layout/ChefBottomNav';

export default function ChefShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white pb-24">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/50">Chef Console</p>
            <h1 className="text-xl font-semibold">Run your culinary business</h1>
            <p className="text-xs text-white/50">Insights, bookings, and guest experiences in one place</p>
          </div>
          <span className="text-xs text-white/50">Grow bookings • Track performance</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 py-8">{children}</main>

      <ChefBottomNav />
    </div>
  );
}
