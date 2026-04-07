'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function MaintenancePage() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2347] to-[#1a3a6b] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 relative"
        >
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-[#d4af37] to-[#f5d77e] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#d4af37]/30 relative overflow-hidden">
            <span className="text-5xl font-bold text-[#0a1628]">S</span>
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            />
          </div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 w-28 h-28 mx-auto border-4 border-[#d4af37]/30 rounded-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
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
          המערכת בתחזוקה
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
        >
          <p className="text-white/80 text-lg mb-4">
            יש תקלה במערכת, הצוות עובד עליה ברגעים אלו{dots}
          </p>
          <p className="text-white/60 text-base">
            המתינו בסבלנות, סליחה על חוסר הנוחות.
            <br />
            נעדכן ברגע שהמערכת תחזור לפעולה.
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
          <span className="text-amber-400 text-sm font-medium">עובדים על תיקון</span>
        </motion.div>

        {/* Contact info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-white/40 text-sm"
        >
          <p>לשאלות דחופות: <a href="mailto:support@stannel.app" className="text-[#d4af37] hover:underline">support@stannel.app</a></p>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-white/30 text-xs"
        >
          STANNEL © {new Date().getFullYear()} | כל הזכויות שמורות
        </motion.p>
      </motion.div>
    </div>
  );
}
