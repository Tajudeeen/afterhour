import type { Metadata } from 'next';
import './globals.css';

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
        <div className="site-shell">
          <header className="site-header">
            <a href="/" className="brand" aria-label="AfterHours home">
              <span className="brand-mark" aria-hidden="true">
                A
              </span>
              <span>
                <strong>AfterHours</strong>
                <small>Tokenized stock intelligence on Solana</small>
              </span>
            </a>
            <nav className="site-nav" aria-label="Primary navigation">
              <a href="/">Dashboard</a>
              <a href="/activity">Activity</a>
              <a href="https://github.com/Tajudeeen/ambit" rel="noreferrer" target="_blank">
                Documentation
              </a>
            </nav>
            <div className="network-badge">
              <span aria-hidden="true" /> Solana
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <div>
              <strong>The gap between trad and on-chain is your edge.</strong>
              <p>AI interprets. The Governor enforces. The human approves.</p>
            </div>
            <span>AfterHours · Built for Stocklana</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
