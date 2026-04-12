'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  label?: string;
  href?: string;
}

export default function BackButton({ className = '', label = 'חזרה', href }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-2 text-white/70 hover:text-white transition-colors group ${className}`}
    >
      <ArrowRight
        size={20}
        className="group-hover:translate-x-1 transition-transform"
      />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}
