'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletBar } from '@/components/WalletBar';
import { getPortfolio, getGapRadar, type AssetSummary, type Portfolio, type GapRadarAsset } from '@/lib/api';

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [radar, setRadar] = useState<GapRadarAsset[]>([]);
  const [regime, setRegime] = useState<{ label: string; session: string } | null>(null);
  const [marketHours, setMarketHours] = useState<{ status: string; nextOpenAt: string | null; lastCloseAt: string | null } | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setPortfolio(null);
      setAssets([]);
      setError(null);
      return;
    }
    const fetchPortfolio = async () => {
      try {
        const walletAddress = publicKey.toBase58();
        const data = await getPortfolio(walletAddress);
        setPortfolio(data.portfolio);
        setAssets(data.assets);
        setError(null);
      } catch {
        setError('API unavailable — unable to load portfolio');
      }
    };
    fetchPortfolio();
  }, [connected, publicKey]);

  // Fetch live gap radar from the API (serves PreStocks + Pyth data)
  useEffect(() => {
    const loadRadar = async () => {
      try {
        const data = await getGapRadar();
        setRadar(data.assets);
        setRegime(data.regime);
        setMarketHours(data.marketHours);
        setError(null);
      } catch {
        setError('API unavailable — unable to load market data');
      }
    };
    loadRadar();
    const interval = setInterval(loadRadar, 30_000);
    return () => clearInterval(interval);
  }, []);

  const topGaps = radar.slice(0, 5);
  const totalGapValue = topGaps.reduce((sum, a) => sum + Math.abs(a.gapPercent), 0);
  const avgGap = topGaps.length > 0 ? totalGapValue / topGaps.length : 0;
  const largestGap = topGaps.length > 0 ? topGaps[0] : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--lime)';
      case 'closed': return '#ff6b6b';
      case 'after-hours': return '#ffa726';
      case 'pre-market': return '#64b5f6';
      default: return 'var(--ink-muted)';
    }
  };

  if (!connected) {
    return (
      <div className="dashboard-shell">
        <WalletBar />
        <section style={{ marginTop: 40 }}>
          <div>
            <p className="eyebrow eyebrow-accent">Market Overview</p>
            <h1 style={{ margin: '8px 0', fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--ink-heading)', fontWeight: 500 }}>
              Tokenized Stock Intelligence on Solana
            </h1>
            <p style={{ margin: '0 0 24px', color: 'var(--ink-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
              Monitor tokenized equity gaps 24/7 with Pyth Network feeds and PreStocks data. When traditional markets close, tokenized equities on Solana keep trading.
            </p>
          </div>

          {/* Regime banner */}
          {regime && marketHours && (
            <div className="data-card" style={{ marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Market Regime</span>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-heading)' }}>{regime.label}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Equity Session</span>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 700 }}>
                  <span style={{ color: getStatusColor(marketHours.status) }}>{marketHours.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Top gaps grid */}
          <div className="data-card" style={{ marginTop: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                What's Hot — 7-Day Trending Gaps
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)' }}>
                Persistent divergence detected by Pyth dual-feed comparison
              </span>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {topGaps.slice(0, 3).map((g) => (
                <div key={g.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href={`/assets/${g.symbol}/analysis`} style={{ textDecoration: 'none' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--ink-heading)' }}>{g.symbol}</span>
                    </Link>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(216, 255, 79, 0.15)', color: 'var(--lime)', fontFamily: 'var(--mono)' }}>
                      {g.source === 'live' ? 'LIVE' : 'DEMO'}
                    </span>
                  </div>
                  <span className={g.gapPercent > 0 ? 'gap-positive' : 'gap-negative'} style={{ fontSize: '0.95rem', fontFamily: 'var(--mono)' }}>
                    {g.gapPercent > 0 ? '+' : ''}{g.gapPercent.toFixed(2)}% — Risk {g.riskScore.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top gaps grid */}
          <div className="data-card" style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top 5 Market Gaps
              </h3>
              <Link href="/gaps" className="text-link">Full Gap Radar →</Link>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {topGaps.map((g) => (
                <div key={g.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <Link href={`/assets/${g.symbol}/analysis`} style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--ink-heading)' }}>{g.symbol}</span>
                  </Link>
                  <span className={g.gapPercent > 0 ? 'gap-positive' : 'gap-negative'} style={{ fontSize: '0.95rem', fontFamily: 'var(--mono)' }}>
                    {g.gapPercent > 0 ? '+' : ''}{g.gapPercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '28px', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Avg Gap</span>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-heading)' }}>{avgGap.toFixed(1)}%</div>
              </div>
              {largestGap && (
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Largest Gap</span>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800 }}>
                    <span className={largestGap.gapPercent > 0 ? 'gap-positive' : 'gap-negative'}>
                      {largestGap.gapPercent > 0 ? '+' : ''}{largestGap.gapPercent.toFixed(1)}% {largestGap.symbol}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section style={{ marginTop: 40, textAlign: 'center' }}>
            <p style={{ margin: '0 0 20px', color: 'var(--ink-muted)', fontSize: '1rem' }}>
              Connect a wallet to view your portfolio and risk analysis.
            </p>
            <button
              type="button"
              className="button button-primary"
              style={{ minWidth: '200px' }}
              onClick={() => setVisible(true)}
            >
              Connect Wallet →
            </button>
          </section>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {error && (
        <div className="data-card" style={{ marginBottom: 20, borderColor: 'var(--amber)' }}>
          <p style={{ color: '#d9c98c', margin: 0 }}>{error}</p>
        </div>
      )}

      <WalletBar />

      {/* Regime banner for connected users */}
      {regime && marketHours && (
        <div className="data-card" style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Market Regime</span>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink-heading)' }}>{regime.label}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Equity Session</span>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 700 }}>
              <span style={{ color: getStatusColor(marketHours.status) }}>{marketHours.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      <section>
        <div className="portfolio-total">${portfolio?.totalValueUsd.toLocaleString() ?? '0'}</div>
        <div className="portfolio-subtotal">Portfolio value</div>
      </section>

      <div className="grid-3" style={{ marginTop: '28px' }}>
        <div className="risk-score-display">
          <strong>{Math.max(...assets.map((a) => a.riskScore.score), 0)}</strong>
          <span>Overall risk score</span>
        </div>
        <div className="data-card">
          <h3>Market Status</h3>
          <div className="data-value">{assets.find((a) => a.symbol !== 'USDC')?.marketStatus ?? marketHours?.status ?? 'open'}</div>
          <div className="data-label">U.S. equities</div>
        </div>
        <div className="data-card">
          <h3>Solana</h3>
          <div className="data-value">ACTIVE</div>
          <div className="data-label">24/7 trading</div>
        </div>
      </div>

      {/* Market Overview Section */}
      <section style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: 'var(--ink-heading)' }}>
            Market Overview
          </h2>
          <Link href="/gaps" className="text-link">
            Full Gap Radar →
          </Link>
        </div>

        <div className="data-card">
          <div style={{ display: 'grid', gap: '14px' }}>
            {topGaps.map((g) => (
              <Link href={`/assets/${g.symbol}/analysis`} key={g.symbol} style={{ textDecoration: 'none' }}>
                <div className="gap-row" style={{ cursor: 'pointer' }}>
                  <div className="symbol">{g.symbol}</div>
                  <div className="meta">
                    <div className="value">
                      Onchain: ${g.onchainPrice.toFixed(2)}
                      {'  |  '}
                      Fair Value: ${g.referencePrice.toFixed(2)}
                    </div>
                    <div className="data-label">
                      {marketHours && <span style={{ color: getStatusColor(marketHours.status) }}>{marketHours.status}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`value ${g.gapPercent > 0 ? 'gap-positive' : 'gap-negative'}`}>
                      {g.gapPercent > 0 ? '+' : ''}{g.gapPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '28px', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Avg Gap</span>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink-heading)' }}>{avgGap.toFixed(1)}%</div>
            </div>
            {largestGap && (
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontFamily: 'var(--mono)', fontWeight: 800, textTransform: 'uppercase' }}>Largest Gap</span>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '1.3rem', fontWeight: 800 }}>
                  <span className={largestGap.gapPercent > 0 ? 'gap-positive' : 'gap-negative'}>
                    {largestGap.gapPercent > 0 ? '+' : ''}{largestGap.gapPercent.toFixed(1)}% {largestGap.symbol}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: 'var(--ink-heading)' }}>
            Portfolio holdings
          </h2>
          <Link href="/activity" className="text-link">
            View activity →
          </Link>
        </div>

        <div className="portfolio-list">
          {(!portfolio || portfolio.holdings.length === 0) ? (
            <div className="data-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--surface-strong)' }}>
              <p style={{ color: 'var(--ink-heading)', fontSize: '1rem', fontWeight: 600, margin: '0 0 8px' }}>
                No Tokenized Stocks Detected in Connected Wallet
              </p>
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', margin: '0 0 20px' }}>
                Your connected Solana wallet currently holds 0 tokenized stock SPL tokens. Explore the live 24/7 markets below to execute a position.
              </p>
              <Link href="/markets" className="button button-primary" style={{ display: 'inline-block' }}>
                View Live PreStocks & Pyth Markets →
              </Link>
            </div>
          ) : (
            portfolio.holdings.map((holding) => {
              const asset = assets.find((a) => a.symbol === holding.symbol);
              const gapClass = (asset && asset.gapPercent > 0) ? 'gap-positive' : (asset && asset.gapPercent < 0) ? 'gap-negative' : '';
              return (
                <Link href={`/assets/${holding.symbol}`} key={holding.symbol} className="portfolio-row">
                  <div className="symbol">{holding.symbol}</div>
                  <div className="meta">
                    <div className="value">${holding.valueUsd.toLocaleString()}</div>
                    {asset && (
                      <div className={`value ${gapClass}`} style={{ fontSize: '0.85rem' }}>
                        Gap: {asset.gapPercent > 0 ? '+' : ''}{asset.gapPercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatusPill band={asset?.riskScore.band ?? 'Normal'} />
                    <div className="weight">{Math.round(holding.weightPercent)}%</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {assets.filter((a) => a.gapPercent > 1 || a.gapPercent < -1).length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: 'var(--ink-heading)' }}>
              Gaps detected
            </h2>
            <Link href="/gaps" className="text-link">
              See full radar →
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '14px' }}>
            {assets
              .filter((a) => Math.abs(a.gapPercent) > 1)
              .map((asset) => (
                <Link href={`/assets/${asset.symbol}/analysis`} key={asset.symbol}>
                  <div className="gap-row">
                    <div className="symbol">{asset.symbol}</div>
                    <div className="meta">
                      <div className="value">
                        Onchain: ${asset.onchainPrice.toFixed(2)}
                        {'  |  '}
                        Reference: ${asset.referencePrice.toFixed(2)}
                      </div>
                      <div className="data-label">
                        Market: {asset.marketStatus} · Liquidity: {asset.liquidity}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={`value ${asset.gapPercent > 0 ? 'gap-positive' : 'gap-negative'}`}>
                        {asset.gapPercent > 0 ? '+' : ''}{asset.gapPercent.toFixed(2)}%
                      </div>
                      <StatusPill band={asset.riskScore.band} />
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusPill({ band }: { band: string }) {
  const toneMap: Record<string, string> = {
    Normal: 'status-normal',
    Watch: 'status-watch',
    Elevated: 'status-elevated',
    High: 'status-high',
    Extreme: 'status-extreme',
  };
  const tone = toneMap[band] ?? 'status-normal';
  return <span className={`status-pill ${tone}`}>{band}</span>;
}
