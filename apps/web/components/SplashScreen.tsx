'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const dismissedRef = useRef(false);
  const router = useRouter();

  const goToDashboard = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setFadingOut(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('afterhours_splash_seen', 'true');
    }

    try {
      router.push('/');
    } catch {
      // router fallback
    }

    setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
    }, 300);
  }, [router]);

  useEffect(() => {
    // Check if user specifically requested intro via ?intro=1 or ?splash=1 or hasn't seen it yet
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceSplash = params?.get('intro') === '1' || params?.get('splash') === '1';
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('afterhours_splash_seen') : null;

    if (!hasSeen || forceSplash) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        goToDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, goToDashboard]);

  if (!visible) return null;

  return (
    <div
      className={`splash-backdrop ${fadingOut ? 'fade-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="AfterHours Splash Screen"
    >
      <div className="splash-container">
        <div className="splash-logo-wrap">
          <img
            src="/logo.png"
            alt="AfterHours Logo"
            className="splash-logo"
            width={84}
            height={84}
          />
        </div>

        <div className="splash-tagline-badge">
          <span className="signal-pulse" aria-hidden="true" />
          <span>SOLANA • PYTH • PRESTOCKS</span>
        </div>

        <h1 className="splash-brand-title">AfterHours</h1>

        <p className="splash-motto-main">
          &ldquo;When Wall Street closes, Solana keeps trading.&rdquo;
        </p>

        <p className="splash-motto-sub">
          24/7 Intelligence &amp; Bounded Execution Layer for Tokenized Stocks
        </p>

        <div className="splash-progress-track">
          <div className="splash-progress-bar" style={{ width: '100%', animation: 'none' }} />
        </div>

        {/* Primary button for user to launch dashboard */}
        <button
          type="button"
          className="splash-dashboard-btn"
          onClick={goToDashboard}
          aria-label="Go to Dashboard"
        >
          <span>Go to Dashboard</span>
          <span style={{ fontSize: '1.2rem', marginLeft: '4px' }}>→</span>
        </button>

        <div className="splash-status-text">
          <span>PRESS ENTER OR CLICK TO LAUNCH DASHBOARD</span>
        </div>
      </div>
    </div>
  );
}
