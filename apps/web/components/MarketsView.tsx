'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAssetIntelligence, type PythMarketAsset } from '@/lib/api';

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

/**
 * Static Pyth feed metadata (symbols, feed IDs, names).
 * Live prices are fetched from /api/assets/:symbol/intelligence on the client.
 */
const PYTH_FEED_SYMBOLS = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', equitySymbol: 'Equity.US.NVDA/USD', tokenSymbol: 'Crypto.NVDAX/USD', tokenType: 'xStock' as const, image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294278f47924c61945e618843224a98b19/svg/color/nvda.svg' },
  { symbol: 'AAPL', name: 'Apple Inc.', equitySymbol: 'Equity.US.AAPL/USD', tokenSymbol: 'Crypto.AAPLX/USD', tokenType: 'xStock' as const, image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294278f47924c61945e618843224a98b19/svg/color/aapl.svg' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', equitySymbol: 'Equity.US.TSLA/USD', tokenSymbol: 'Crypto.TSLAX/USD', tokenType: 'xStock' as const, image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294278f47924c61945e618843224a98b19/svg/color/tsla.svg' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', equitySymbol: 'Equity.US.MSFT/USD', tokenSymbol: 'Crypto.MSFTX/USD', tokenType: 'xStock' as const, image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294278f47924c61945e618843224a98b19/svg/color/generic.svg' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', equitySymbol: 'Equity.US.GOOGL/USD', tokenSymbol: 'Crypto.GOOGLX/USD', tokenType: 'xStock' as const, image: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a6354294278f47924c61945e618843224a98b19/svg/color/generic.svg' },
];

interface MarketsViewProps {
  prestocksAssets: PreStocksAsset[];
  isPrestocksLive: boolean;
}

export function MarketsView({ prestocksAssets, isPrestocksLive }: MarketsViewProps) {
  const [tab, setTab] = useState<'pyth' | 'prestocks'>('pyth');
  const [pythAssets, setPythAssets] = useState<PythMarketAsset[]>([]);
  const [isPythLive, setIsPythLive] = useState(false);

  // Fetch live Pyth dual-feed data for each symbol from the API
  useEffect(() => {
    let cancelled = false;
    async function fetchPythData() {
      const results: PythMarketAsset[] = [];
      for (const meta of PYTH_FEED_SYMBOLS) {
        try {
          const intel = await getAssetIntelligence(meta.symbol);
          if (cancelled) return;
          results.push({
            symbol: meta.symbol,
            name: meta.name,
            equitySymbol: meta.equitySymbol,
            equityFeedId: '',
            tokenSymbol: meta.tokenSymbol,
            tokenFeedId: '',
            tokenType: meta.tokenType,
            equityPrice: intel.referencePrice,
            tokenPrice: intel.onchainPrice,
            confidenceUsd: intel.pythConfidenceUsd ?? 0,
            confidenceRatioPercent: intel.pythConfidenceRatioPercent ?? 0,
            dynamicSlippageBps: intel.pythDynamicSlippageBps ?? 50,
            gapPercent: intel.gapPercent,
            gapDollar: intel.gapDollar,
            image: meta.image,
          });
        } catch {
          if (cancelled) return;
          // Fallback to static metadata with seeded prices
          results.push({
            symbol: meta.symbol,
            name: meta.name,
            equitySymbol: meta.equitySymbol,
            equityFeedId: '',
            tokenSymbol: meta.tokenSymbol,
            tokenFeedId: '',
            tokenType: meta.tokenType,
            equityPrice: 0,
            tokenPrice: 0,
            confidenceUsd: 0,
            confidenceRatioPercent: 0,
            dynamicSlippageBps: 50,
            gapPercent: 0,
            gapDollar: 0,
            image: meta.image,
          });
        }
      }
      if (cancelled) return;
      setPythAssets(results);
      setIsPythLive(results.some(a => a.gapPercent !== 0));
    }
    void fetchPythData();
    return () => { cancelled = true; };
  }, []);

  const sortedPrestocks = [...prestocksAssets].sort((a, b) => {
    const gapA = Math.abs((a.tokenPrice - a.markPrice) / a.markPrice);
    const gapB = Math.abs((b.tokenPrice - b.markPrice) / b.markPrice);
    return gapB - gapA;
  });

  // Merge static metadata with live prices for display
  const pythAssetsDisplay = pythAssets.length > 0 ? pythAssets : PYTH_FEED_SYMBOLS.map(s => ({
    symbol: s.symbol,
    name: s.name,
    equitySymbol: s.equitySymbol,
    equityFeedId: '',
    tokenSymbol: s.tokenSymbol,
    tokenFeedId: '',
    tokenType: s.tokenType,
    equityPrice: 0,
    tokenPrice: 0,
    confidenceUsd: 0,
    confidenceRatioPercent: 0,
    dynamicSlippageBps: 50,
    gapPercent: 0,
    gapDollar: 0,
    image: s.image,
  } as PythMarketAsset));

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
          <span>Pyth Dual-Feed Equities</span>
          <span style={{ background: 'rgba(123, 97, 255, 0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.68rem', color: 'var(--pyth-lavender)' }}>
            5 Feed Pairs
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('prestocks')}
          className={`button ${tab === 'prestocks' ? 'button-primary' : 'button-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <span>⚡</span>
          <span>Pre-IPO Tokens</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.68rem' }}>
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
