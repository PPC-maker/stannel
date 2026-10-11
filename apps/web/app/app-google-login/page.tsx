'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@stannel/api-client';

// Opened in the phone's real browser by the STANNEL app (WebView can't run Google OAuth).
// Signs in with Google, then hands the session to the app via the backend (keyed by `sid`).
function AppGoogleLogin() {
  const sid = useSearchParams().get('sid') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  const start = async () => {
    setStatus('loading');
    setError('');
    try {
      const { loginWithGoogle, logout } = await import('@/lib/firebase');
      const { token } = await loginWithGoogle();
      await authApi.appGoogleComplete(sid, token);
      await logout();
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההתחברות נכשלה');
      setStatus('error');
    }
  };

  const validSid = /^[a-f0-9]{32,128}$/.test(sid);

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-6 bg-[#060f1f] text-white">
      <div className="w-full max-w-sm text-center space-y-5">
        <h1 className="text-2xl font-bold text-[#d4af37]">התחברות לאפליקציית STANNEL</h1>
        {!validSid ? (
          <p className="text-white/70">קישור לא תקין. חזרו לאפליקציה ונסו שוב.</p>
        ) : status === 'done' ? (
          <p className="text-lg">ההתחברות הושלמה ✓ חזרו לאפליקציית STANNEL.</p>
        ) : (
          <>
            <p className="text-white/70">התחברו עם Google כדי להיכנס לאפליקציה שפתחתם עכשיו בטלפון שלכם.</p>
            <button
              type="button"
              onClick={start}
              disabled={status === 'loading'}
              className="w-full bg-white text-black py-4 rounded-2xl text-lg font-semibold disabled:opacity-50"
            >
              {status === 'loading' ? 'מתחבר...' : 'המשך עם Google'}
            </button>
            {status === 'error' && <p className="text-red-400 text-sm">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function AppGoogleLoginPage() {
  return (
    <Suspense fallback={null}>
      <AppGoogleLogin />
    </Suspense>
  );
}
