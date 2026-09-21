import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { SolanaWalletProviderClient } from '@/components/SolanaWalletProviderClient';
import { SplashScreen } from '@/components/SplashScreen';
import { NavigationHeader } from '@/components/NavigationHeader';
import { SiteFooter } from '@/components/SiteFooter';

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
            <SiteFooter />
          </div>
        </SolanaWalletProviderClient>
      </body>
    </html>
  );
}
