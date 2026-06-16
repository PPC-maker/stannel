import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2347] to-[#1a3a6b] flex items-center justify-center p-6">
      <div className="text-center max-w-lg animate-fadeIn">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#d4af37] to-[#f5d77e] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#d4af37]/20">
            <span className="text-4xl font-bold text-[#0a1628]">S</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-bold text-[#d4af37] mb-4">404</h1>

        <h2 className="text-2xl font-semibold text-white mb-4">העמוד לא נמצא</h2>

        <p className="text-white/70 mb-8 text-lg">
          מצטערים, העמוד שחיפשת אינו קיים או שהועבר למיקום אחר.
        </p>

        {/* Button */}
        <div>
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#f5d77e] text-[#0a1628] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#d4af37]/30 transition-all duration-300"
          >
            <span>חזרה לדף הבית</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-white/40 text-sm">
          STANNEL &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
