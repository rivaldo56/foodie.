import Link from 'next/link';
import { useMemo } from 'react';

export default function Footer() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-sm text-white/70">
        <div className="space-y-4">
          <p className="text-xl font-semibold text-white">Foodie</p>
          <p className="leading-relaxed max-w-xs">Private chefs on demand for unforgettable dining experiences.</p>
        </div>
        <div>
          <p className="font-semibold text-white text-base mb-4">About</p>
          <ul className="space-y-3">
            <li><Link href="/about" className="hover:text-accent transition-colors">Our Story</Link></li>
            <li><Link href="/chefs" className="hover:text-accent transition-colors">Meet the Chefs</Link></li>
            <li><Link href="/careers" className="hover:text-accent transition-colors">Careers</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white text-base mb-4">Contact</p>
          <ul className="space-y-3">
            <li><a href="mailto:hello@foodie.ke" className="hover:text-accent transition-colors">hello@foodie.ke</a></li>
            <li><Link href="/support" className="hover:text-accent transition-colors">Support</Link></li>
            <li><Link href="/press" className="hover:text-accent transition-colors">Press</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white text-base mb-4">Legal</p>
          <ul className="space-y-3">
            <li><Link href="/terms" className="hover:text-accent transition-colors">Terms &amp; Conditions</Link></li>
            <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs sm:text-sm text-white/50">
          © {currentYear} Foodie. Crafted with love in Nairobi.
        </div>
      </div>
    </footer>
  );
}
