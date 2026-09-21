'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const SolanaWalletProviderInner = dynamic(
  () => import('./SolanaWalletProvider').then((mod) => mod.SolanaWalletProvider),
  { ssr: false }
);

export function SolanaWalletProviderClient({ children }: { children: React.ReactNode }) {
  return <SolanaWalletProviderInner>{children}</SolanaWalletProviderInner>;
}
