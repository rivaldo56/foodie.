import Link from 'next/link';
import { useMemo } from 'react';

export default function Footer() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-8 md:grid-cols-4 text-sm text-white/70">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-white">Foodie</p>
          <p>Private chefs on demand for unforgettable dining experiences.</p>
        </div>
        <div>
          <p className="font-semibold text-white">About</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/about" className="hover:text-white transition">Our Story</Link></li>
            <li><Link href="/chefs" className="hover:text-white transition">Meet the Chefs</Link></li>
            <li><Link href="/careers" className="hover:text-white transition">Careers</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Contact</p>
          <ul className="mt-3 space-y-2">
            <li><a href="mailto:hello@foodie.ke" className="hover:text-white transition">hello@foodie.ke</a></li>
            <li><Link href="/support" className="hover:text-white transition">Support</Link></li>
            <li><Link href="/press" className="hover:text-white transition">Press</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Legal</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/terms" className="hover:text-white transition">Terms &amp; Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {currentYear} Foodie. Crafted with love in Nairobi.
      </div>
    </footer>
  );
}
