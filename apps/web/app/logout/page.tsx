'use client';

import { useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '@/lib/auth-context';

export default function LogoutPage() {
  const { logout } = useAuth();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const completeLogout = async () => {
      try {
        await logout();
      } catch (error) {
        // Auth state is also cleared locally by the provider on sign-out errors.
        console.error('Logout error:', error);
      }

      try {
        await Swal.fire({
          title: 'תודה רבה, נתראה!',
          html: '<p style="color:#8b7c69;font-size:1.1rem;margin:0">התנתקת בהצלחה. נשמח לראותך שוב בקרוב.</p>',
          icon: 'success',
          iconColor: '#c99b4a',
          showConfirmButton: false,
          timer: 2200,
          timerProgressBar: true,
          allowOutsideClick: false,
          allowEscapeKey: false,
          background: '#f7f3f2',
          color: '#2b241d',
          backdrop: 'rgba(0,0,0,0.8)',
          customClass: {
            popup: 'glass-swal-popup',
            title: 'swal-title-rtl',
          },
        });
      } finally {
        // Go straight to login. The old flow went through `/`, whose client-side
        // redirect could remain blank inside Android WebView.
        window.location.replace('/login');
      }
    };

    void completeLogout();
  }, [logout]);

  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center bg-[#f7f3f2]" dir="rtl">
      <div className="flex flex-col items-center gap-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logoNew.png" alt="Stannel Club" className="h-20 w-auto" />
        <p className="text-base font-medium text-[#8b7c69]">מתנתקים מהמערכת...</p>
      </div>
    </div>
  );
}
