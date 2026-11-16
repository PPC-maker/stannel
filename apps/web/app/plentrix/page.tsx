'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { walletApi } from '@stannel/api-client';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

export default function PlentrixPage() {
  const { isReady } = useAuthGuard();
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    // The embed URL is single-use: mint exactly one per page load
    if (!isReady || requested.current) return;
    requested.current = true;
    walletApi
      .getPlentrixLink()
      .then((r) => setSrc(r.url))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'לא ניתן לעבור ל-Plentrix כרגע.';
        setError(msg);
        Swal.fire({
          icon: 'info',
          title: 'לא ניתן לפתוח את Plentrix',
          text: msg,
          confirmButtonText: 'הבנתי',
          confirmButtonColor: '#d4af37',
        });
      });
  }, [isReady]);

  if (!isReady) return <AuthGuardLoader />;

  return (
    <div className="pt-20 px-0" style={{ height: '100dvh' }}>
      {error ? (
        <div className="glass-card mx-4 mt-6 p-6 text-center text-white">{error}</div>
      ) : !src ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      ) : (
        <iframe
          src={src}
          title="Plentrix"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allow="camera; microphone; clipboard-write"
        />
      )}
    </div>
  );
}
