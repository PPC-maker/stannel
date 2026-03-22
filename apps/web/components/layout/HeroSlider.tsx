'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80',
    alt: 'AI Technology Architecture',
  },
  {
    src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    alt: 'Modern Architecture Interior',
  },
  {
    src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80',
    alt: 'Designed Home Interior Corner',
  },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-16 h-[400px] overflow-hidden z-0">
      {/* Images Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              opacity: { duration: 1.5, ease: 'easeOut' },
              scale: { duration: 8, ease: 'linear' }
            }
          }}
          exit={{
            opacity: 0,
            transition: { duration: 1.5, ease: 'easeIn' }
          }}
          className="absolute inset-0"
        >
          <Image
            src={heroImages[currentIndex].src}
            alt={heroImages[currentIndex].alt}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="100vw"
          />
        </motion.div>
      </AnimatePresence>

      {/* Ken Burns effect on current image */}
      <motion.div
        key={`zoom-${currentIndex}`}
        initial={{ scale: 1 }}
        animate={{ scale: 1.1 }}
        transition={{ duration: 8, ease: 'linear' }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Bottom fade gradient - blends with background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #F8FAFC 0%, #F8FAFC 10%, rgba(248, 250, 252, 0.8) 40%, rgba(248, 250, 252, 0) 100%)'
        }}
      />

      {/* Side fades for smooth edge blending */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #F8FAFC 0%, rgba(248, 250, 252, 0) 100%)'
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(to left, #F8FAFC 0%, rgba(248, 250, 252, 0) 100%)'
        }}
      />

    </div>
  );
}
