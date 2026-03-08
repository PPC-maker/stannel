'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface SliderImage {
  src: string;
  alt: string;
}

interface PageSliderProps {
  images: SliderImage[];
  height?: string;
  opacity?: number;
}

export default function PageSlider({ images, height = '400px', opacity = 0.5 }: PageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      className="fixed left-0 right-0 top-[88px] overflow-hidden z-0"
      style={{ height }}
    >
      {/* Images Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: opacity,
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
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="100vw"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-primary-900/30" />
        </motion.div>
      </AnimatePresence>

      {/* Bottom fade gradient - blends with background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #060f1f 0%, #060f1f 10%, rgba(6, 15, 31, 0.8) 40%, rgba(6, 15, 31, 0) 100%)'
        }}
      />

      {/* Side fades for smooth edge blending */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(to right, #060f1f 0%, rgba(6, 15, 31, 0) 100%)'
        }}
      />
      <div
        className="absolute top-0 bottom-0 right-0 w-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(to left, #060f1f 0%, rgba(6, 15, 31, 0) 100%)'
        }}
      />

    </div>
  );
}

// Pre-defined image sets for different pages
export const sliderImages = {
  login: [
    { src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80', alt: 'Luxury Living Room' },
    { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=80', alt: 'Modern Interior Design' },
    { src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80', alt: 'Elegant Home Interior' },
  ],
  register: [
    { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80', alt: 'Modern Building Facade' },
    { src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&q=80', alt: 'Contemporary Architecture' },
    { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80', alt: 'Urban Architecture' },
  ],
  dashboard: [
    { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80', alt: 'Modern Home Office' },
    { src: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1920&q=80', alt: 'Minimalist Workspace' },
    { src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80', alt: 'Contemporary Living Space' },
  ],
  invoices: [
    { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80', alt: 'Corporate Interior' },
    { src: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&q=80', alt: 'Modern Office Space' },
    { src: 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1920&q=80', alt: 'Business Architecture' },
  ],
  invoiceUpload: [
    { src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80', alt: 'Design Studio' },
    { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', alt: 'Modern House' },
    { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=1920&q=80', alt: 'Architect Workspace' },
  ],
  rewards: [
    { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80', alt: 'Luxury Villa' },
    { src: 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=1920&q=80', alt: 'Premium Interior' },
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1920&q=80', alt: 'Luxury Home' },
  ],
  accessibility: [
    { src: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1920&q=80', alt: 'Open Space Design' },
    { src: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1920&q=80', alt: 'Modern Accessible Space' },
    { src: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1920&q=80', alt: 'Inclusive Design' },
  ],
  privacy: [
    { src: 'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=1920&q=80', alt: 'Private Residence' },
    { src: 'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=1920&q=80', alt: 'Secure Home' },
    { src: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1920&q=80', alt: 'Modern Private Space' },
  ],
  profile: [
    { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80', alt: 'Professional Workspace' },
    { src: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1920&q=80', alt: 'Modern Office' },
    { src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80', alt: 'Elegant Interior' },
  ],
  events: [
    { src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80', alt: 'Conference Hall' },
    { src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1920&q=80', alt: 'Networking Event' },
    { src: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=1920&q=80', alt: 'Business Meeting' },
  ],
  wallet: [
    { src: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920&q=80', alt: 'Finance & Banking' },
    { src: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=1920&q=80', alt: 'Digital Payments' },
    { src: 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=1920&q=80', alt: 'Modern Banking' },
  ],
};
