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
const hiddenOnPages = ['/login', '/register', '/logout', '/onboarding', '/forgot-password', '/terms', '/privacy', '/about'];

export default function BottomNav() {
  const pathname = usePathname() || '';

  const shouldHide =
    hiddenOnPages.includes(pathname) ||
    pathname.startsWith('/supplier/');

  if (shouldHide) return null;

  // Mobile WebView uses the website's BottomNav - do NOT hide it

  return (
    <nav
      id="web-bottom-nav"
      className="web-bottom-nav"
      aria-label="ניווט תחתון"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'linear-gradient(180deg, #1f2024, #141518)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.30)',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        maxWidth: 520,
        margin: '0 auto',
        padding: '14px 24px 22px',
        paddingBottom: 'calc(22px + env(safe-area-inset-bottom, 0px))',
      }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/wallet' && pathname.startsWith(item.href));

        if (item.isCenter) {
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} aria-label={item.label}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d8ba72, #9f7645)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -28,
                  boxShadow: '0 10px 25px rgba(201, 155, 74, 0.45), 0 0 0 5px #141518',
                }}
              >
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
            aria-label={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              color: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.45)',
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 8px',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
