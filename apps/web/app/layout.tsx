import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import AccessibilityWidget from '@/components/layout/AccessibilityWidget';
import { Providers } from './providers';

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'STANNEL | פלטפורמת ניהול מועדון לקוחות מקצועי',
  description: 'הפלטפורמה האקסקלוסיבית לאדריכלים וספקים בתחום הבנייה והעיצוב',
  keywords: ['אדריכלות', 'עיצוב פנים', 'מועדון לקוחות', 'נקודות', 'הטבות'],
  authors: [{ name: 'STANNEL' }],
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
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers>
          {/* Main app shell */}
          <div className="relative z-10 min-h-screen flex flex-col items-center">
            <Navbar />
            <main className="flex-1 pt-16 w-full bg-transparent">
              {children}
            </main>
          </div>

          {/* Accessibility Widget - fixed button bottom left */}
          <AccessibilityWidget />
        </Providers>
      </body>
    </html>
  );
}
