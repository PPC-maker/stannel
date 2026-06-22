'use client';

import Link from 'next/link';

/**
 * Hidden Next.js Links that are always in the DOM.
 * The mobile app's WebView clicks these for client-side navigation
 * (avoids full page reload which causes white flash and re-auth).
 */
export default function MobileNavHelper() {
  return (
    <nav
      id="mobile-nav-helper"
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
    >
      <Link href="/wallet" data-mobile-nav="home">home</Link>
      <Link href="/rewards" data-mobile-nav="rewards">rewards</Link>
      <Link href="/suppliers" data-mobile-nav="suppliers">suppliers</Link>
      <Link href="/invoices" data-mobile-nav="invoices">invoices</Link>
      <Link href="/profile" data-mobile-nav="profile">profile</Link>
      <Link href="/login" data-mobile-nav="login">login</Link>
    </nav>
  );
}
