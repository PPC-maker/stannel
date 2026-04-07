'use client';

import { useEffect, useState } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    console.error('Global error:', error);

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [error]);

  return (
    <html dir="rtl" lang="he">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2347 50%, #1a3a6b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Arial, sans-serif",
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
          padding: '24px',
        }}>
          {/* Logo */}
          <div style={{
            width: '96px',
            height: '96px',
            margin: '0 auto 32px',
            background: 'linear-gradient(135deg, #d4af37 0%, #f5d77e 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3)',
          }}>
            <span style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#0a1628',
            }}>S</span>
          </div>

          {/* Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '16px',
          }}>
            יש תקלה במערכת
          </h1>

          {/* Message Box */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '18px',
              marginBottom: '16px',
              margin: '0 0 16px 0',
            }}>
              הצוות עובד על התקלה ברגעים אלו{dots}
            </p>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '16px',
              margin: 0,
            }}>
              המתינו בסבלנות, סליחה על חוסר הנוחות.
              <br />
              נעדכן ברגע שהמערכת תחזור לפעולה.
            </p>
          </div>

          {/* Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '500' }}>
              עובדים על תיקון
            </span>
          </div>

          {/* Button */}
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #d4af37 0%, #f5d77e 100%)',
              color: '#0a1628',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 16h5v5"/>
            </svg>
            <span>נסה שוב</span>
          </button>

          {/* Footer */}
          <p style={{
            marginTop: '48px',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '12px',
          }}>
            STANNEL © {new Date().getFullYear()}
          </p>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
          }
        `}</style>
      </body>
    </html>
  );
}
