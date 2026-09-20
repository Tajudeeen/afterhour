import type { Metadata } from 'next';
import './globals.css';
import { SolanaWalletProvider } from '@/components/SolanaWalletProvider';
import { SplashScreen } from '@/components/SplashScreen';

export const metadata: Metadata = {
  title: {
    default: 'AfterHours — 24/7 intelligent risk for tokenized stocks',
    template: '%s | AfterHours',
  },
  description:
    'When Wall Street closes, Solana keeps trading. AfterHours detects price gaps between on-chain markets and traditional reference prices, explains them, assesses portfolio risk, and executes bounded actions on Solana.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SolanaWalletProvider>
          <SplashScreen />
          <div className="site-shell">
          <header className="site-header">
            <a href="/" className="brand" aria-label="AfterHours home">
              <span className="brand-mark gradient-solana" aria-hidden="true" style={{ color: '#000' }}>
                A
              </span>
              <span>
                <strong>AfterHours</strong>
                <small>Tokenized stock intelligence on Solana</small>
              </span>
            </a>
            <nav className="site-nav" aria-label="Primary navigation">
              <a href="/">Dashboard</a>
              <a href="/markets">Markets</a>
              <a href="/activity">Activity</a>
              <a href="/?intro=1">System Intro</a>
              <a href="https://github.com/Tajudeeen/ambit" rel="noreferrer" target="_blank">
                Documentation
              </a>
            </nav>
            <div className="network-badge">
              <span aria-hidden="true" /> Solana Devnet
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div>
              <strong>Discover. Compare. Validate. Execute.</strong>
              <p>AI explains. The Governor enforces. The human approves. Solana settles.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#62675e', fontSize: '0.78rem' }}>AfterHours · Stocklana_ 2026</span>
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
                  <span className="sponsor-dot" style={{ background: '#d8ff4f' }} />
                  PreStocks Data
                </span>
              </div>
            </div>
          </footer>
        </div>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
