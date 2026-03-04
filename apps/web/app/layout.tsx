import type { Metadata } from 'next';
import { Assistant, Heebo, Playfair_Display } from 'next/font/google';
import './globals.css';
import BackgroundSlider from '@/components/layout/BackgroundSlider';
import Navbar from '@/components/layout/Navbar';
import { Providers } from './providers';

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
    <html lang="he" dir="rtl" className={`${assistant.variable} ${heebo.variable} ${playfair.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>
          {/* Full-screen animated background — runs on EVERY page */}
          <BackgroundSlider />

          {/* Main app shell */}
          <div className="relative z-10 min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
