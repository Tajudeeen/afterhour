'use client';

import { useState, useEffect, useRef } from 'react';

// In-memory session tracker: displays once on initial app load/open
let hasShownSplashInSession = false;

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if user specifically requested intro via ?intro=1 or ?splash=1
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const forceSplash = params?.get('intro') === '1' || params?.get('splash') === '1';

    if (!hasShownSplashInSession || forceSplash) {
      hasShownSplashInSession = true;
      setVisible(true);

      // 2-second splash screen before transitioning to homepage
      timerRef.current = setTimeout(() => {
        dismiss();
      }, 2000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const dismiss = () => {
    setFadingOut(true);
    fadeTimerRef.current = setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
    }, 300);
  };

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`splash-backdrop ${fadingOut ? 'fade-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="AfterHours Splash Screen"
      onClick={dismiss}
    >
      <div className="splash-container" onClick={(e) => e.stopPropagation()}>
        <div className="splash-logo-wrap">
          <img
            src="/logo.png"
            alt="AfterHours Logo"
            className="splash-logo"
            width={80}
            height={80}
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
          <div className="splash-progress-bar" />
        </div>

        <div className="splash-status-text">
          <span>INITIALIZING MARKET RADAR...</span>
          <button
            type="button"
            className="splash-skip-btn"
            onClick={dismiss}
            aria-label="Skip to homepage"
          >
            Skip [Esc]
          </button>
        </div>
      </div>
    </div>
  );
}
