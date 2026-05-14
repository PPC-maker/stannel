'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, Search, Gift, User } from 'lucide-react';

const navItems = [
  { href: '/rewards', label: 'הטבות', icon: Gift },
  { href: '/suppliers', label: 'ספקים', icon: Search },
  { href: '/wallet', label: 'בית', icon: Home, isCenter: true },
  { href: '/invoices', label: 'חשבוניות', icon: FileText },
  { href: '/profile', label: 'פרופיל', icon: User },
];

// Pages where bottom nav should NOT appear
const hiddenOnPages = ['/login', '/register', '/onboarding'];
const hiddenOnPrefixes = ['/admin'];

export default function BottomNav() {
  const pathname = usePathname() || '';

  const shouldHide =
    hiddenOnPages.includes(pathname) ||
    hiddenOnPrefixes.some(prefix => pathname.startsWith(prefix));

  if (shouldHide) return null;

  return (
    <nav className="bottom-nav" aria-label="ניווט תחתון">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/wallet' && pathname.startsWith(item.href));

        if (item.isCenter) {
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center" aria-label={item.label}>
              <div className="bottom-nav-home">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
