'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, User, LogOut, Settings, Wallet, FileText, Gift, Calendar, Home, LogIn, Bot, Shield, Bell, Target, Wrench, X, Building2 } from 'lucide-react';
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
  { href: '/suppliers', label: 'ספקים', icon: Building2 },
];

// Links for SUPPLIER users - view only, no wallet
const supplierLinks = [
  { href: '/supplier', label: 'לוח בקרה', icon: Home },
  { href: '/notifications', label: 'התראות', icon: Bell },
  { href: '/ai-agent', label: 'תובנות AI', icon: Bot },
];

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Detect scroll to add blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pages with light backgrounds need dark navbar styling
  const lightPages = ['/wallet'];
  const isLightPage = lightPages.includes(pathname || '');
  const isDarkPage = !isLightPage;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isDarkPage
        ? isScrolled
          ? 'bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-transparent'
        : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100'
    }`} style={{ paddingTop: 'env(safe-area-inset-top, 0px)', WebkitBackdropFilter: isScrolled || !isDarkPage ? 'blur(16px)' : undefined }}>
      <div className={`w-full px-4 sm:px-6 lg:px-8 flex items-center justify-center relative ${isDarkPage ? 'h-20' : 'h-16'}`}>
        {/* Centered Logo */}
        <Link href="/wallet" className="flex items-center">
          <Image
            src={isLightPage ? "/logo_black1.png" : "/logo1.png"}
            alt="Stannel"
            width={isDarkPage ? 281 : 218}
            height={isDarkPage ? 84 : 66}
            className={isDarkPage ? "h-20 w-auto" : "h-16 w-auto"}
            priority
          />
        </Link>

        {/* Menu Icon - Fixed position on the right (RTL) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors ${
              isDarkPage
                ? 'border-white/50 hover:bg-white/20 bg-white/15 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                : 'border-gray-200 hover:bg-gray-50 bg-white shadow-sm'
            }`}
          >
            {isProfileOpen ? (
              <X size={20} className={isDarkPage ? "text-white" : "text-gray-600"} />
            ) : (
              <Menu size={20} className={isDarkPage ? "text-white" : "text-gray-600"} />
            )}
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />

                {/* Menu Panel */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl p-2 shadow-xl z-50 max-h-[calc(75vh-120px)] overflow-y-auto"
                >
                  {/* User Info Header */}
                  {user && (
                    <div className="px-3 py-3 mb-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  )}

                  {/* Public links - always visible */}
                  {publicLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-[#0066CC] transition-colors"
                    >
                      <link.icon size={18} className="text-gray-400" />
                      <span className="font-medium">{link.label}</span>
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
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-[#0066CC] transition-colors"
                        >
                          <link.icon size={18} className="text-gray-400" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      ))}
                      <hr className="my-2 border-gray-100" />
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-[#0066CC] transition-colors"
                      >
                        <User size={18} className="text-gray-400" />
                        <span className="font-medium">הפרופיל שלי</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-gray-700 hover:text-[#0066CC] transition-colors"
                      >
                        <Settings size={18} className="text-gray-400" />
                        <span className="font-medium">הגדרות</span>
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-[#0066CC] transition-colors"
                        >
                          <Shield size={18} className="text-[#0066CC]" />
                          <span className="font-semibold">פאנל ניהול</span>
                        </Link>
                      )}
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={async () => {
                          setIsProfileOpen(false);
                          await logout();
                          await Swal.fire({
                            title: 'התנתקת מהמערכת',
                            html: '<p style="color: #64748B; font-size: 1rem;">נשמח לראותך שוב בקרוב!</p>',
                            icon: 'success',
                            iconColor: '#22C55E',
                            confirmButtonText: 'להתראות',
                            background: '#FFFFFF',
                            color: '#1E293B',
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
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors w-full"
                      >
                        <LogOut size={18} className="text-gray-400" />
                        <span className="font-medium">התנתק</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Guest links - only when logged out */}
                      <Link
                        href="/login"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0066CC] text-white hover:bg-[#0055AA] transition-colors mt-2"
                      >
                        <LogIn size={18} />
                        <span className="font-semibold">התחברות למערכת</span>
                      </Link>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
