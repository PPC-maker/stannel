'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';

// תמונות פרימיום - מוקטנות ל-1280px לביצועים טובים יותר
const SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280&q=75',
    alt: 'וילה מודרנית עם עיצוב אדריכלי יוקרתי',
  },
  {
    src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1280&q=75',
    alt: 'עיצוב פנים יוקרתי עם חומרים איכותיים',
  },
  {
    src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1280&q=75',
    alt: 'סלון מעוצב בסגנון מודרני',
  },
  {
    src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1280&q=75',
    alt: 'אדריכלות עכשווית ומרשימה',
  },
  {
    src: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1280&q=75',
    alt: 'חדר שינה יוקרתי עם עיצוב מינימליסטי',
  },
];

// Placeholder blur base64 - מונע layout shift
const BLUR_PLACEHOLDER = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIRAAAgIBAwUBAAAAAAAAAAAAAQIDBAAFESEGEhMxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAIDAQAAAAAAAAAAAAAAAAABAgMRIf/aAAwDAQACEQMRAD8A';

function BackgroundSlider() {
  const [current, setCurrent] = useState(0);

  // מעבר אוטומטי בין שקופיות
  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next]);

  // Preload next 2 images
  useEffect(() => {
    const preloadImages = [1, 2].map(offset => {
      const idx = (current + offset) % SLIDES.length;
      const img = new window.Image();
      img.src = SLIDES[idx].src;
      return img;
    });
    return () => preloadImages.forEach(img => img.src = '');
  }, [current]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#060f1f]">
      {/* תמונות - CSS transitions במקום framer-motion */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ willChange: i === current ? 'opacity' : 'auto' }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className="object-cover bg-slider-image"
            sizes="100vw"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Gradient overlays - שכבה אחת במקום שתיים */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060f1f]/60 via-[#060f1f]/40 to-[#060f1f]/80 pointer-events-none" />

      {/* חלקיקים - CSS בלבד, ללא JS animations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-particle bg-particle-1" />
        <div className="bg-particle bg-particle-2" />
        <div className="bg-particle bg-particle-3" />
      </div>

      {/* אינדיקטורים */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
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

// Memo למניעת re-renders מיותרים
export default memo(BackgroundSlider);
