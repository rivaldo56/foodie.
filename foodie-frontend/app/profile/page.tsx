'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BottomDock from '@/components/BottomDock';
import ChatAssistantFab from '@/components/ChatAssistantFab';
import { LogOut, Mail, MapPin, Phone, Trophy, UserRound, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

const TABS = ['Basic Info', 'Referral', 'Wallet', 'Preferences'] as const;

function ProfilePageContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const activeTab = TABS[0];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast('Profile saved!', 'success');
    } catch (error) {
      console.error('[Foodie] Error saving client profile', error);
      showToast('Error saving profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = (user.full_name || user.username || 'Guest')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center text-white text-3xl font-semibold shadow-glow">
              {user.profile_image ? (
                <Image src={user.profile_image} alt={user.full_name} fill className="object-cover rounded-3xl" />
              ) : (
                <span>{initials}</span>
              )}
              <span className="absolute -bottom-2 -right-2 inline-flex items-center gap-1 rounded-full bg-surface-elevated px-3 py-1 text-[11px] text-muted soft-border">
                <Trophy className="h-3.5 w-3.5 text-accent" />
                Client
              </span>
            </div>
            <div>
              <p className="text-sm text-muted uppercase tracking-[0.35em]">Profile</p>
              <h1 className="text-4xl font-semibold text-white">{user.full_name || user.username}</h1>
              <p className="text-sm text-muted mt-2">Manage your client profile and dining preferences</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-danger/10 px-5 py-2 text-sm font-semibold text-danger hover:bg-danger/20 transition"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <aside className="space-y-4">
            <div className="rounded-3xl bg-surface-elevated soft-border px-6 py-6 shadow-glow space-y-4">
              <div className="space-y-3 text-sm text-muted">
                <p className="inline-flex items-center gap-2 text-white">
                  <UserRound className="h-4 w-4 text-accent" />
                  @{user.username}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-accent" />
                  {user.email}
                </p>
                {user.phone_number && (
                  <p className="inline-flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent" />
                    {user.phone_number}
                  </p>
                )}
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Nairobi, Kenya
                </p>
              </div>

              <div className="rounded-2xl bg-surface-highlight px-4 py-3 text-xs text-muted">
                Ready to elevate your next dining experience? Well tailor recommendations based on your calendar and saved preferences.
              </div>
            </div>

            <div className="rounded-3xl bg-surface-elevated soft-border px-6 py-6 space-y-4">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-[0.4em]">Quick Links</h2>
              <div className="space-y-3">
                <Link href="/orders" className="block rounded-2xl bg-surface-highlight px-4 py-3 text-sm font-semibold text-white hover:bg-accent-soft">
                  Upcoming experiences
                </Link>
                <Link href="/meals" className="block rounded-2xl bg-surface-highlight px-4 py-3 text-sm font-semibold text-white hover:bg-accent-soft">
                  Discover new chefs
                </Link>
              </div>
            </div>
          </aside>

          <div className="rounded-3xl bg-surface-elevated soft-border px-6 py-6 shadow-glow space-y-6">
            <nav className="flex flex-wrap items-center gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    tab === activeTab ? 'bg-accent text-white shadow-glow' : 'bg-surface-highlight text-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileField label="Full name" value={user.full_name || '—'} />
              <ProfileField label="Email" value={user.email || '—'} />
              <ProfileField label="Username" value={user.username || '—'} />
              <ProfileField label="Role" value={user.role || 'Client'} capitalise />
              <ProfileField label="Preferred cuisine" value="Swahili Heritage" />
              <ProfileField label="Favourite spice level" value="Medium heat" />
            </div>

            <div className="rounded-2xl bg-surface-highlight px-5 py-4 text-sm text-muted">
              We’ll use your taste profile to personalise chef recommendations, set reminders, and send curated experiences each season.
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </div>
        </section>
      </main>

      <ChatAssistantFab />
      <BottomDock />
    </div>
  );
}

function ProfileField({ label, value, capitalise }: { label: string; value: string; capitalise?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface-highlight px-4 py-4">
      <p className="text-xs text-muted uppercase tracking-[0.3em]">{label}</p>
      <p className={`mt-2 text-sm font-semibold text-white ${capitalise ? 'capitalize' : ''}`}>{value}</p>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}
