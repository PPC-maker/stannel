'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserRole } from '@stannel/types';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import GlassCard from '@/components/layout/GlassCard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin');
      } else if (user.role !== UserRole.ADMIN) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageSlider images={sliderImages.dashboard}  />
        <div className="flex flex-col items-center gap-4 z-10">
          <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
          <p className="text-white/60">מאמת הרשאות...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageSlider images={sliderImages.dashboard}  />
        <GlassCard className="max-w-md text-center z-10">
          <Lock className="w-16 h-16 mx-auto text-gold-400 mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-2">נדרשת התחברות</h1>
          <p className="text-white/60 mb-6">יש להתחבר כדי לגשת לפאנל הניהול</p>
          <button
            onClick={() => router.push('/login?redirect=/admin')}
            className="btn-primary w-full"
          >
            התחברות
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <PageSlider images={sliderImages.dashboard}  />
        <GlassCard className="max-w-md text-center z-10">
          <ShieldAlert className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-display font-bold text-white mb-2">גישה נדחתה</h1>
          <p className="text-white/60 mb-6">אין לך הרשאות לגשת לפאנל הניהול</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full"
          >
            חזרה לדשבורד
          </button>
        </GlassCard>
      </div>
    );
  }

  return <>{children}</>;
}
