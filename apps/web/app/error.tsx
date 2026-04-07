'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Log the error to console
    console.error('Application error:', error);

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2347] to-[#1a3a6b] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#d4af37] to-[#f5d77e] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#d4af37]/20">
            <span className="text-4xl font-bold text-[#0a1628]">S</span>
          </div>
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold text-white mb-4"
        >
          יש תקלה במערכת
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
        >
          <p className="text-white/80 text-lg mb-4">
            הצוות עובד על התקלה ברגעים אלו{dots}
          </p>
          <p className="text-white/60 text-base">
            המתינו בסבלנות, סליחה על חוסר הנוחות.
          </p>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <motion.div
            className="w-3 h-3 bg-amber-500 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="text-amber-400 text-sm font-medium">מתקנים את הבעיה</span>
        </motion.div>

        {/* Retry button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#f5d77e] text-[#0a1628] px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#d4af37]/30 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
            <span>נסה שוב</span>
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-white/30 text-xs"
        >
          STANNEL © {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}
