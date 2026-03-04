'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Settings, Wallet, FileText, Gift, Calendar } from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'דשבורד', icon: Wallet },
  { href: '/invoices', label: 'חשבוניות', icon: FileText },
  { href: '/rewards', label: 'הטבות', icon: Gift },
  { href: '/events', label: 'אירועים', icon: Calendar },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50">
      {/* Glass navbar background */}
      <div className="absolute inset-0 bg-primary-900/80 backdrop-blur-xl border-b border-white/10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-400/20 group-hover:shadow-gold-400/40 transition-shadow">
              <span className="text-primary-900 font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              STANNEL
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <link.icon size={18} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Profile & Mobile menu */}
          <div className="flex items-center gap-3">
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 mt-2 w-48 glass-card p-2"
                  >
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <User size={16} />
                      <span>הפרופיל שלי</span>
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <Settings size={16} />
                      <span>הגדרות</span>
                    </Link>
                    <hr className="my-2 border-white/10" />
                    <button
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-colors w-full"
                    >
                      <LogOut size={16} />
                      <span>התנתק</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden relative bg-primary-900/95 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
