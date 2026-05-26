import type { Metadata, Viewport } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AccessibilityWidget from '@/components/layout/AccessibilityWidget';
import SplashScreen from '@/components/layout/SplashScreen';
import { Providers } from './providers';

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'STANNEL | פלטפורמת ניהול מועדון לקוחות מקצועי',
  description: 'הפלטפורמה האקסקלוסיבית לאדריכלים וספקים בתחום הבנייה והעיצוב',
  keywords: ['אדריכלות', 'עיצוב פנים', 'מועדון לקוחות', 'נקודות', 'הטבות'],
  authors: [{ name: 'STANNEL' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'STANNEL',
    startupImage: '/logoNew.png',
  },
  verification: {
    google: 't24_wOD9p0neygB7Y0IhjQDYgN8TnkqPRme_hIGtswI',
  },
  other: {
    'theme-color': '#f7f3f2',
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    apple: '/logoNew.png',
  },
  openGraph: {
    title: 'STANNEL | פלטפורמת ניהול מועדון לקוחות',
    description: 'הפלטפורמה האקסקלוסיבית לאדריכלים וספקים',
    type: 'website',
    locale: 'he_IL',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={assistant.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var v='stannel-v5';
            if(localStorage.getItem('app-version')!==v){
              localStorage.setItem('app-version',v);
              if('serviceWorker' in navigator){
                navigator.serviceWorker.getRegistrations().then(function(r){
                  r.forEach(function(reg){reg.unregister()});
                });
              }
              if('caches' in window){
                caches.keys().then(function(k){
                  k.forEach(function(key){caches.delete(key)});
                });
              }
              location.reload();
            }
          })();
        `}} />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>

        <Providers>
          {/* Main app shell */}
          <div className="relative z-10 min-h-screen flex flex-col items-center">
            <Navbar />
            <main className="flex-1 pt-16 w-full bg-transparent" style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
              {children}
            </main>
          </div>

          {/* Bottom Navigation */}
          <BottomNav />
          {/* Accessibility Widget - fixed button bottom left */}
          <AccessibilityWidget />
          {/* Splash Screen + Service Worker */}
          <SplashScreen />
        </Providers>
      </body>
    </html>
  );
}
