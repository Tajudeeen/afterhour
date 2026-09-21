import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { SolanaWalletProviderClient } from '@/components/SolanaWalletProviderClient';
import { SplashScreen } from '@/components/SplashScreen';
import { NavigationHeader } from '@/components/NavigationHeader';

export const metadata: Metadata = {
  title: {
    default: 'AfterHours — 24/7 intelligent risk for tokenized stocks',
    template: '%s | AfterHours',
  },
  description:
    'When Wall Street closes, Solana keeps trading. AfterHours detects price gaps between on-chain markets and traditional reference prices, explains them, assesses portfolio risk, and executes bounded actions on Solana.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProviderClient>
          <SplashScreen />
          <div className="site-shell">
            <Suspense fallback={null}>
              <NavigationHeader />
            </Suspense>
            <main>{children}</main>
            <footer className="site-footer">
              <div>
                <strong>Discover. Compare. Validate. Execute.</strong>
                <p>Market Intelligence explains. The Governor enforces. The human approves. Solana settles.</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', fontFamily: 'var(--mono)' }}>AfterHours · Stocklana_ 2026</span>
                <div className="sponsor-bar" style={{ justifyContent: 'flex-end' }}>
                  <span className="sponsor-item">
                    <span className="sponsor-dot" style={{ background: '#7B61FF' }} />
                    Powered by Pyth
                  </span>
                  <span className="sponsor-item">
                    <span className="sponsor-dot" style={{ background: '#9945FF' }} />
                    Built on Solana
                  </span>
                  <span className="sponsor-item">
                    <span className="sponsor-dot" style={{ background: '#56c0aa' }} />
                    PreStocks Data
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </SolanaWalletProviderClient>
      </body>
    </html>
  );
}
