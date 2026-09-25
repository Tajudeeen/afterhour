'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getGapRadar, type GapRadarAsset } from '@/lib/api';
import { WalletBar } from '@/components/WalletBar';
import { formatNum, formatCurrency, formatPercent } from '@/lib/format';

export default function GapsPage() {
  const [assets, setAssets] = useState<GapRadarAsset[]>([]);
  const [regime, setRegime] = useState<{ label: string; session: string } | null>(null);
  const [marketHours, setMarketHours] = useState<{ status: string; nextOpenAt: string | null; lastCloseAt: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastObserved, setLastObserved] = useState<string | null>(null);

  useEffect(() => {
    const loadRadar = async () => {
      try {
        const data = await getGapRadar();
        setAssets(data.assets);
        setRegime(data.regime);
        setMarketHours(data.marketHours);
        setLastObserved(data.observedAt);
        setError(null);
      } catch {
        setError('Unable to load gap data — retrying...');
      } finally {
        setLoading(false);
      }
    };
    loadRadar();
    const interval = setInterval(loadRadar, 30_000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--lime)';
      case 'closed': return '#ff6b6b';
      case 'after-hours': return '#ffa726';
      case 'pre-market': return '#64b5f6';
      default: return 'var(--ink-muted)';
    }
  };

  const getRiskColor = (band: string) => {
    switch (band) {
      case 'Normal': return 'var(--ink-subtle)';
      case 'Watch': return '#ffa726';
      case 'Elevated': return '#ff6b6b';
      case 'High': return '#ff4444';
      case 'Extreme': return '#ff0000';
      default: return 'var(--ink-subtle)';
    }
  };

  if (loading && assets.length === 0) {
    return (
      <div className="page-shell">
        <WalletBar />
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>Loading gap radar...</p>
        </div>
      </div>
    );
  }

  const premiumGaps = assets.filter((a) => (a.gapPercent ?? 0) > 0);
  const discountGaps = assets.filter((a) => (a.gapPercent ?? 0) < 0);
  const largestGap =
    assets.length > 0
      ? assets.reduce((max: GapRadarAsset, a) => (Math.abs(a.gapPercent ?? 0) > Math.abs(max.gapPercent ?? 0) ? a : max), assets[0]!)
      : null;

  return (
    <div className="page-shell">
      <WalletBar />

      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow eyebrow-accent">Gap Radar</p>
        <h1 style={{
          margin: '8px 0',
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          color: 'var(--ink-heading)',
          fontWeight: 500,
        }}>
          Live Market Gaps — Tokenized Stocks on Solana
        </h1>
        <p style={{
          margin: '0 0 24px',
          color: 'var(--ink-muted)',
          fontSize: '1.1rem',
          lineHeight: 1.6,
        }}>
          When traditional markets close, tokenized equities on Solana keep trading.
          Monitor the gap between on-chain prices and traditional reference prices in real time.
        </p>
      </div>

      {/* Regime banner */}
      {regime && marketHours && (
        <div className="data-card" style={{ marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>
              Market Regime
            </span>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-heading)' }}>
              {regime.label}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>
              Equity Session
            </span>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 700 }}>
              <span style={{ color: getStatusColor(marketHours.status) }}>{marketHours.status.toUpperCase()}</span>
            </div>
          </div>
          {largestGap && (
            <div style={{ marginLeft: 'auto' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>
                Largest Gap
              </span>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800 }}>
                <span className={(largestGap.gapPercent ?? 0) > 0 ? 'gap-positive' : 'gap-negative'}>
                  {formatPercent(largestGap.gapPercent, 1)} {largestGap.symbol}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="data-card" style={{ marginBottom: 20, borderColor: 'var(--amber)' }}>
          <p style={{ color: '#d9c98c', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Premium gaps (onchain > reference) */}
      {premiumGaps.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 16px', fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: 'var(--ink-heading)' }}>
            Premiums (on-chain above fair value)
          </h2>
          <div className="data-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Asset
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    On-chain
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Fair Value
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Gap
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody>
                {premiumGaps.map((a) => (
                  <tr key={a.symbol}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                      <Link href={`/assets/${a.symbol}/analysis`} style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--ink-heading)' }}>{a.symbol}</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{a.name}</div>
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '0.9rem' }}>
                      {formatCurrency(a.onchainPrice, 2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
                      {formatCurrency(a.referencePrice, 2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)' }}>
                      <span className="gap-positive" style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }}>
                        +{formatNum(a.gapPercent, 2)}%
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ color: getRiskColor(a.riskScore?.band ?? 'Normal'), fontFamily: 'var(--mono)', fontSize: '0.85rem', fontWeight: 700 }}>
                        {a.riskScore?.band ?? 'Normal'} ({a.riskScore?.score ?? 0})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Discount gaps (onchain < reference) */}
      {discountGaps.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 16px', fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: 'var(--ink-heading)' }}>
            Discounts (on-chain below fair value)
          </h2>
          <div className="data-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Asset
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    On-chain
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Fair Value
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Gap
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
                    Risk
                  </th>
                </tr>
              </thead>
              <tbody>
                {discountGaps.map((a) => (
                  <tr key={a.symbol}>
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
                      <Link href={`/assets/${a.symbol}/analysis`} style={{ textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--ink-heading)' }}>{a.symbol}</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{a.name}</div>
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '0.9rem' }}>
                      {formatCurrency(a.onchainPrice, 2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)', fontFamily: 'var(--mono)', fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
                      {formatCurrency(a.referencePrice, 2)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)' }}>
                      <span className="gap-negative" style={{ fontFamily: 'var(--mono)', fontSize: '1rem' }}>
                        {formatPercent(a.gapPercent, 2)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ color: getRiskColor(a.riskScore?.band ?? 'Normal'), fontFamily: 'var(--mono)', fontSize: '0.85rem', fontWeight: 700 }}>
                        {a.riskScore?.band ?? 'Normal'} ({a.riskScore?.score ?? 0})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {assets.length > 0 && (
        <div style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(216, 255, 79, 0.04)',
          border: '1px solid rgba(216, 255, 79, 0.1)',
          fontSize: '0.78rem',
          color: 'var(--ink-subtle)',
          fontFamily: 'var(--mono)',
        }}>
          Data freshness: {lastObserved ? new Date(lastObserved).toLocaleTimeString() : '—'} · Source: {assets[0]?.source === 'live' ? 'Live' : 'Demo'} · Last full refresh: {new Date().toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
