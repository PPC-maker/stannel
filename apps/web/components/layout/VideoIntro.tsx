'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoIntro() {
  const [showIntro, setShowIntro] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Show intro on every page load (home page only)
    setShowIntro(true);
    // Prevent scrolling while intro is showing
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Track video progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [showIntro]);

  const handleVideoEnd = () => {
    closeIntro();
  };

  const closeIntro = () => {
    setShowIntro(false);
    document.body.style.overflow = '';

    // Delay hiding completely to allow fade out animation
    setTimeout(() => {
      setIsVisible(false);
    }, 800);
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    closeIntro();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center"
        >
          {/* Video Container - 1080p Rectangle */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative w-[90vw] max-w-[1080px] aspect-video rounded-2xl overflow-hidden shadow-2xl"
            style={{
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 0, 0, 0.3)',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
            >
              <source src="https://storage.googleapis.com/stannel-invoices/videos/intro.mp4" type="video/mp4" />
            </video>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* Logo Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center"
            >
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-wider drop-shadow-2xl">
                STANNEL
              </h1>
              <p className="text-white/80 mt-2 text-base md:text-lg">
                קהילת ערך למעצבים
              </p>
            </motion.div>

            {/* Skip Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={handleSkip}
              className="absolute bottom-4 right-4 px-5 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30 hover:bg-white/30 transition-all text-sm font-medium"
            >
              דלג
            </motion.button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <div
                className="h-full bg-[#d4af37] transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
