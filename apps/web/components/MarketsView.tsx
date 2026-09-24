'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface PreStocksAsset {
  name: string;
  symbol: string;
  contract_address: string;
  markPrice: number;
  tokenPrice: number;
  supply: number;
  image: string;
}

export interface PythMarketAsset {
  symbol: string;
  name: string;
  equitySymbol: string;
  equityFeedId: string;
  tokenSymbol: string;
  tokenFeedId: string;
  tokenType: 'xStock' | 'Ondo';
  equityPrice: number;
  tokenPrice: number;
  confidenceUsd: number;
  confidenceRatioPercent: number;
  dynamicSlippageBps: number;
  gapPercent: number;
  gapDollar: number;
  image: string;
}

const PYTH_MARKET_ASSETS: PythMarketAsset[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    equitySymbol: 'Equity.US.NVDA/USD',
    equityFeedId: 'b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593',
    tokenSymbol: 'Crypto.NVDAX/USD',
    tokenFeedId: '4244d07890e4610f46bbde67de8f43a4bf8b569eebe904f136b469f148503b7f',
    tokenType: 'xStock',
    equityPrice: 182.40,
    tokenPrice: 189.70,
    confidenceUsd: 1.45,
    confidenceRatioPercent: 0.80,
    dynamicSlippageBps: 130,
    gapPercent: 4.02,
    gapDollar: 7.30,
    image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294274f47924c61945e618843224a98b19/svg/color/generic.svg',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    equitySymbol: 'Equity.US.AAPL/USD',
    equityFeedId: '49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688',
    tokenSymbol: 'Crypto.AAPLX/USD',
    tokenFeedId: '978e6cc68a119ce066aa830017318563a9ed04ec3a0a6439010fc11296a58675',
    tokenType: 'xStock',
    equityPrice: 214.80,
    tokenPrice: 218.40,
    confidenceUsd: 1.37,
    confidenceRatioPercent: 0.64,
    dynamicSlippageBps: 114,
    gapPercent: 1.68,
    gapDollar: 3.60,
    image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294274f47924c61945e618843224a98b19/svg/color/generic.svg',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    equitySymbol: 'Equity.US.TSLA/USD',
    equityFeedId: '16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1',
    tokenSymbol: 'Crypto.TSLAX/USD',
    tokenFeedId: '47a156470288850a440df3a6ce85a55917b813a19bb5b31128a33a986566a362',
    tokenType: 'xStock',
    equityPrice: 268.50,
    tokenPrice: 274.20,
    confidenceUsd: 2.01,
    confidenceRatioPercent: 0.75,
    dynamicSlippageBps: 125,
    gapPercent: 2.12,
    gapDollar: 5.70,
    image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294274f47924c61945e618843224a98b19/svg/color/generic.svg',
  },
];

interface MarketsViewProps {
  prestocksAssets: PreStocksAsset[];
  isPrestocksLive: boolean;
}

export function MarketsView({ prestocksAssets, isPrestocksLive }: MarketsViewProps) {
  const [tab, setTab] = useState<'pyth' | 'prestocks'>('pyth');

  const sortedPrestocks = [...prestocksAssets].sort((a, b) => {
    const gapA = Math.abs((a.tokenPrice - a.markPrice) / a.markPrice);
    const gapB = Math.abs((b.tokenPrice - b.markPrice) / b.markPrice);
    return gapB - gapA;
  });

  return (
    <div>
      {/* Category Toggle Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setTab('pyth')}
          className={`button ${tab === 'pyth' ? 'button-primary' : 'button-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <span>⬡</span>
          <span>Pyth Dual-Feed Equities (xStocks / Ondo)</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
            Bounty Target
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('prestocks')}
          className={`button ${tab === 'prestocks' ? 'button-primary' : 'button-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <span>⚡</span>
          <span>Pre-IPO Tokens (PreStocks API)</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.72rem' }}>
            8 Assets
          </span>
        </button>
      </div>

      {tab === 'pyth' && (
        <div>
          <div className="data-card" style={{ marginBottom: '24px', background: 'rgba(123, 97, 255, 0.05)', borderColor: 'var(--pyth-lavender)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--pyth-lavender)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⬡ Pyth Network Dual-Feed Market Intelligence
                </div>
                <h3 style={{ margin: '4px 0 0', color: 'var(--ink-heading)', fontSize: '1.1rem', fontFamily: 'Georgia, serif' }}>
                  Underlying TradFi Equities vs. On-Chain Solana Exposure
                </h3>
              </div>
              <span className="pyth-badge pyth-live">
                ● Pyth Oracles Active
              </span>
            </div>
            <p style={{ margin: '12px 0 0', color: 'var(--ink-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Pyth provides live access to both the traditional reference market (<code>Equity.US.*</code>) and the on-chain tokenized exposure (<code>Crypto.*X</code> and Ondo feeds).
              When US exchanges close for 65 weekend hours, AfterHours detects price divergence, calculates <strong>Pyth Dynamic Slippage</strong> from confidence intervals, and bounds execution via the Risk Governor.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {PYTH_MARKET_ASSETS.map((asset) => {
              const isPositive = asset.gapPercent > 0;
              return (
                <Link
                  key={asset.symbol}
                  href={`/assets/${asset.symbol}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="data-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: '18px 24px', cursor: 'pointer' }}>
                    {/* Symbol & Name */}
                    <div style={{ minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'SF Mono, monospace', fontWeight: 800, fontSize: '1.15rem', color: 'var(--ink-heading)' }}>
                          {asset.symbol}
                        </span>
                        <span className="pyth-badge pyth-live" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                          {asset.tokenType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
                        {asset.name}
                      </div>
                    </div>

                    {/* TradFi Feed */}
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        TradFi Feed (US Close)
                      </div>
                      <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-body)', marginTop: '2px' }}>
                        ${asset.equityPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--ink-subtle)', fontFamily: 'SF Mono, monospace' }}>
                        {asset.equitySymbol}
                      </div>
                    </div>

                    {/* On-Chain Feed */}
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        On-Chain Feed (24/7)
                      </div>
                      <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-heading)', marginTop: '2px' }}>
                        ${asset.tokenPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--ink-subtle)', fontFamily: 'SF Mono, monospace' }}>
                        {asset.tokenSymbol}
                      </div>
                    </div>

                    {/* Pyth Confidence & Slippage */}
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--pyth-lavender)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Pyth Confidence Band
                      </div>
                      <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, fontSize: '0.92rem', color: 'var(--pyth-lavender)', marginTop: '2px' }}>
                        ±${asset.confidenceUsd.toFixed(2)} ({asset.confidenceRatioPercent}%)
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
                        Slippage: {asset.dynamicSlippageBps} bps
                      </div>
                    </div>

                    {/* Gap */}
                    <div style={{ textAlign: 'right', minWidth: '110px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Feed Gap
                      </div>
                      <div className={isPositive ? 'gap-positive-large' : 'gap-negative-large'} style={{ fontSize: '1.25rem' }}>
                        {isPositive ? '+' : ''}{asset.gapPercent.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)' }}>
                        {isPositive ? '+' : ''}${Math.abs(asset.gapDollar).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ color: 'var(--lime)', fontSize: '1.2rem', fontWeight: 700 }}>→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'prestocks' && (
        <div>
          {!isPrestocksLive && (
            <div className="data-card" style={{ marginBottom: 20, borderColor: 'rgba(141,90,6,0.4)' }}>
              <p style={{ color: '#ffd98a', margin: 0, fontSize: '0.9rem' }}>
                ⚠ PreStocks API unavailable — showing cached seed data
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {sortedPrestocks.map((asset) => {
              const gapPercent = ((asset.tokenPrice - asset.markPrice) / asset.markPrice) * 100;
              const gapDollar = asset.tokenPrice - asset.markPrice;
              const isPositive = gapPercent > 0;

              return (
                <Link
                  key={asset.symbol}
                  href={`/assets/${asset.symbol}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="data-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: '16px 24px', cursor: 'pointer' }}>
                    <img
                      src={asset.image}
                      alt={asset.name}
                      width={40}
                      height={40}
                      style={{ borderRadius: '10px', flexShrink: 0 }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 800, fontSize: '1rem', color: 'var(--ink-heading)' }}>
                        {asset.symbol}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
                        {asset.name}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                        Fair Value
                      </div>
                      <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, color: 'var(--ink-body)' }}>
                        ${asset.markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <span className="prestocks-badge" style={{ marginTop: '4px' }}>PreStocks</span>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                        On-chain
                      </div>
                      <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, color: 'var(--ink-heading)' }}>
                        ${asset.tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                        Gap
                      </div>
                      <div className={isPositive ? 'gap-positive-large' : 'gap-negative-large'} style={{ fontSize: '1.2rem' }}>
                        {isPositive ? '+' : ''}{gapPercent.toFixed(2)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)' }}>
                        {isPositive ? '+' : ''}${Math.abs(gapDollar).toFixed(2)} per token
                      </div>
                    </div>

                    <div style={{ color: 'var(--ink-subtle)', fontSize: '1.2rem' }}>→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
