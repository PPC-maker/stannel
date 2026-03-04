'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gold?: boolean;
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className,
  hover = true,
  gold = false,
  animate = true,
  delay = 0,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card p-6',
        hover && 'cursor-pointer',
        gold && 'glass-card-gold',
        className
      )}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.5,
        ease: 'easeOut',
        delay,
      }}
      whileHover={
        hover
          ? {
              y: -2,
              transition: { duration: 0.2 },
            }
          : undefined
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
