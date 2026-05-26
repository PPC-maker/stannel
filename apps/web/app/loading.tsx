// Global loading - shows instantly on navigation
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#f7f3f2] flex flex-col items-center justify-center">
      {/* Logo with animation */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo image with pulse glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#c99b4a]/15 blur-3xl animate-pulse" style={{ transform: 'scale(2)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logoNew.png"
            alt="Stannel Club"
            className="h-20 w-auto relative z-10"
            style={{
              animation: 'logoFadeIn 0.8s ease-out forwards',
            }}
          />
        </div>

        {/* Loading text */}
        <p
          className="text-[#8b7c69] text-sm font-medium tracking-wider"
          style={{
            animation: 'textFadeIn 1s ease-out 0.3s both',
          }}
        >
          אנחנו עוברים לדף המבוקש...
        </p>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-[#c99b4a]/10 rounded-full overflow-hidden"
          style={{ animation: 'textFadeIn 1s ease-out 0.5s both' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #c99b4a, #d4af37, #c99b4a)',
              backgroundSize: '200% 100%',
              animation: 'shimmerBar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes logoFadeIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerBar {
          0% { background-position: 200% 0; width: 30%; }
          50% { width: 70%; }
          100% { background-position: -200% 0; width: 30%; }
        }
      `}</style>
    </div>
  );
}
