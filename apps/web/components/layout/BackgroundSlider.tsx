'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Architecture & Design related premium images
// High-quality images showcasing architecture, interior design, building materials
const SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    alt: 'וילה מודרנית עם עיצוב אדריכלי יוקרתי',
  },
  {
    src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    alt: 'עיצוב פנים יוקרתי עם חומרים איכותיים',
  },
  {
    src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
    alt: 'סלון מעוצב בסגנון מודרני',
  },
  {
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80',
    alt: 'אדריכלות עכשווית ומרשימה',
  },
  {
    src: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1920&q=80',
    alt: 'חדר שינה יוקרתי עם עיצוב מינימליסטי',
  },
];

export default function BackgroundSlider() {
  const [current, setCurrent] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto-advance slides
  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // Preload next image
  useEffect(() => {
    const nextIndex = (current + 1) % SLIDES.length;
    const img = new window.Image();
    img.src = SLIDES[nextIndex].src;
  }, [current]);

  // Generate particles
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      width: Math.random() * 300 + 100,
      height: Math.random() * 300 + 100,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 2,
      moveX: Math.random() * 60 - 30,
      moveY: Math.random() * 60 - 30,
    }))
  , []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main image slider */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: 1,
            scale: 1.05,
            x: mousePos.x,
            y: mousePos.y,
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.5, ease: 'easeInOut' },
            scale: { duration: 8, ease: 'linear' },
            x: { duration: 0.3, ease: 'linear' },
            y: { duration: 0.3, ease: 'linear' },
          }}
        >
          <Image
            src={SLIDES[current].src}
            alt={SLIDES[current].alt}
            fill
            priority={current === 0}
            quality={85}
            className="object-cover"
            onLoad={() => setIsLoaded(true)}
            sizes="100vw"
          />

          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/70 via-[#060f1f]/50 to-[#060f1f]/85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060f1f]/60 via-transparent to-[#060f1f]/40" />
        </motion.div>
      </AnimatePresence>

      {/* Animated particles overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white/5"
            style={{
              width: particle.width,
              height: particle.height,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              filter: 'blur(40px)',
            }}
            animate={{
              x: [0, particle.moveX, 0],
              y: [0, particle.moveY, 0],
              opacity: [0.03, 0.1, 0.03],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Subtle vignette effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,15,31,0.4)_100%)]" />

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === current
                ? 'w-8 bg-gold-400'
                : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`עבור לשקופית ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
