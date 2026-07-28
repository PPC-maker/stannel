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
    icon: '/logoNew.png',
    apple: '/logoNew.png',
    shortcut: '/logoNew.png',
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
        <link rel="preload" href="/logoNew.png" as="image" />
        <link rel="preload" href="/logoNewWhite.png" as="image" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var v='stannel-build-${process.env.NEXT_PUBLIC_BUILD_TIME}';
              var current=localStorage.getItem('app-version');
              if(current!==v){
                localStorage.setItem('app-version',v);
                window.addEventListener('load',function(){
                  Promise.all([
                    'serviceWorker' in navigator
                      ? navigator.serviceWorker.getRegistrations().then(function(r){
                          return Promise.all(r.map(function(reg){return reg.unregister()}));
                        })
                      : Promise.resolve(),
                    'caches' in window
                      ? caches.keys().then(function(k){
                          return Promise.all(k.map(function(key){return caches.delete(key)}));
                        })
                      : Promise.resolve()
                  ]).then(function(){
                    if(sessionStorage.getItem('version-reloaded')!==v){
                      sessionStorage.setItem('version-reloaded',v);
                      setTimeout(function(){location.replace(location.href)},250);
                    }
                  }).catch(function(){});
                },{once:true});
              }
            }catch(e){}
          })();
        `}} />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `
          if(navigator.userAgent.includes('STANNEL-App')){
            document.body.classList.add('stannel-mobile-app');
          }
        `}} />

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
