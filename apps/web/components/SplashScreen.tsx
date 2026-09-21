'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Show splash if not dismissed this session or if explicitly requested via query param
    const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('afterhours_splash_seen') : null;
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    if (!hasSeen || urlParams?.get('intro') === '1') {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        dismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('afterhours_splash_seen', 'true');
    }
  };

  if (!mounted || !visible) return null;

  return (
    <div className="splash-backdrop" role="dialog" aria-modal="true" aria-label="Welcome to AfterHours">
      <div className="splash-container">
        <div className="splash-header">
          <div className="splash-tag" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="AfterHours" width={22} height={22} style={{ borderRadius: '6px' }} />
            <span className="signal-pulse" aria-hidden="true" />
            <span>SOLANA 24/7 STOCK RADAR</span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close intro"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-subtle)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        </div>

        <h2 className="splash-title">
          Pre-IPO stocks. On Solana. With a real execution layer.
        </h2>

        <p className="splash-desc">
          AfterHours is the 24/7 intelligence, risk, and bounded execution layer for tokenized equities on Solana.
          We detect price divergence between fair value and on-chain price, explain market regimes with an AI Analyst,
          enforce deterministic portfolio policies via the Risk Governor, and execute bounded actions with human approval.
        </p>

        <div className="splash-grid">
          <div className="splash-stat-box">
            <div className="label">Live Data & Markets</div>
            <div className="val" style={{ color: 'var(--lime)' }}>PreStocks</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: '0.68rem', marginTop: '2px' }}>Real pre-IPO token gaps</div>
          </div>
          <div className="splash-stat-box">
            <div className="label">Consensus & Settlement</div>
            <div className="val" style={{ color: 'var(--ink-muted)' }}>Solana Devnet</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: '0.68rem', marginTop: '2px' }}>SPL Memo Attestation</div>
          </div>
          <div className="splash-stat-box">
            <div className="label">Risk Governor</div>
            <div className="val" style={{ color: '#ffd98a' }}>4 Hard Bounds</div>
            <div style={{ color: 'var(--ink-subtle)', fontSize: '0.68rem', marginTop: '2px' }}>AI never trades alone</div>
          </div>
        </div>

        <div className="splash-actions">
          <button
            type="button"
            className="button button-execute"
            onClick={dismiss}
            style={{ minWidth: '160px', padding: '0 20px', borderRadius: '12px' }}
          >
            Launch Terminal →
          </button>
          <Link
            href="/assets/ANTHROPIC"
            onClick={dismiss}
            className="button button-secondary"
          >
            Explore ANTHROPIC Gap →
          </Link>
          <span style={{ marginLeft: 'auto', color: 'var(--ink-subtle)', fontSize: '0.74rem', fontFamily: 'monospace' }}>
            Press Enter / Esc
          </span>
        </div>
      </div>
    </div>
  );
}
