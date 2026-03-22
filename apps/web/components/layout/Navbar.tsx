'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, LogOut, Settings, Wallet, FileText, Gift, Calendar, Home, LogIn, Bot, Shield, Bell, Target, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';

const publicLinks = [
  { href: '/', label: 'דף הבית', icon: Home },
];

// Links for ARCHITECT users
const architectLinks = [
  { href: '/wallet', label: 'הארנק שלי', icon: Wallet },
  { href: '/invoices', label: 'חשבוניות', icon: FileText },
  { href: '/rewards', label: 'הטבות', icon: Gift },
  { href: '/events', label: 'אירועים', icon: Calendar },
  { href: '/goals', label: 'יעדים', icon: Target },
  { href: '/notifications', label: 'התראות', icon: Bell },
  { href: '/tools', label: 'כלים', icon: Wrench },
  { href: '/ai-agent', label: 'הסוכן שלך', icon: Bot },
];

// Links for SUPPLIER users - view only, no wallet
const supplierLinks = [
  { href: '/supplier', label: 'דשבורד', icon: Home },
  { href: '/notifications', label: 'התראות', icon: Bell },
  { href: '/ai-agent', label: 'תובנות AI', icon: Bot },
];

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-6 bg-primary-900/95 backdrop-blur-md shadow-lg shadow-black/20 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex justify-center">
        {/* Centered Logo */}
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Stannel"
            width={200}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Menu Icon - Fixed position on the left (RTL) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Menu size={20} className="text-white" />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 bg-primary-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-xl"
              >
                {/* Public links - always visible */}
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    <link.icon size={16} />
                    <span>{link.label}</span>
                  </Link>
                ))}

                {user ? (
                  <>
                    {/* Role-based links */}
                    {(user.role === 'SUPPLIER' ? supplierLinks : architectLinks).map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                      >
                        <link.icon size={16} />
                        <span>{link.label}</span>
                      </Link>
                    ))}
                    <hr className="my-2 border-white/10" />
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <User size={16} />
                      <span>הפרופיל שלי</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <Settings size={16} />
                      <span>הגדרות</span>
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                      >
                        <Shield size={16} />
                        <span className="text-gold-400">פאנל ניהול</span>
                      </Link>
                    )}
                    <hr className="my-2 border-white/10" />
                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await logout();
                        await Swal.fire({
                          title: 'התנתקת מהמערכת',
                          html: '<p style="color: rgba(255,255,255,0.7); font-size: 1.1rem;">נשמח לראותך שוב בקרוב!</p>',
                          icon: 'success',
                          iconColor: '#d4af37',
                          confirmButtonText: 'להתראות',
                          confirmButtonColor: '#d4af37',
                          background: 'linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%)',
                          color: '#ffffff',
                          backdrop: 'rgba(0,0,0,0.8)',
                          customClass: {
                            popup: 'glass-swal-popup',
                            title: 'swal-title-rtl',
                            confirmButton: 'swal-confirm-gold',
                          },
                          showClass: {
                            popup: 'animate__animated animate__fadeInDown animate__faster'
                          },
                          hideClass: {
                            popup: 'animate__animated animate__fadeOutUp animate__faster'
                          }
                        });
                        router.push('/');
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/20 text-white/80 hover:text-red-400 transition-colors w-full"
                    >
                      <LogOut size={16} />
                      <span>התנתק</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Guest links - only when logged out */}
                    <Link
                      href="/login"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gold/20 text-gold hover:text-gold transition-colors"
                    >
                      <LogIn size={16} />
                      <span>התחברות למערכת</span>
                    </Link>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
