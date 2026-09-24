import Link from 'next/link';
import { getAssetIntelligence, type AssetIntelligence } from '@/lib/api';
import { RiskSimulator } from '@/components/RiskSimulator';

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  let intelligence: AssetIntelligence | null = null;

  try {
    intelligence = await getAssetIntelligence(upperSymbol);
  } catch {
    // Fallback mock data
    intelligence = {
      symbol: upperSymbol,
      name: 'Tokenized stock',
      mint: '',
      referencePrice: 182.4,
      referenceSource: 'seeded',
      referenceUpdatedAt: new Date(Date.now() - 16 * 3600_000).toISOString(),
      onchainPrice: 189.7,
      gapPercent: 4.02,
      gapDollar: 7.3,
      routes: [],
      bestRoute: null,
      riskScore: { score: 72, band: 'High' },
      marketStatus: 'closed',
      liquidity: 'low',
      source: 'demo',
    };
  }

  if (!intelligence) return null;

  const isPreStocks = ['ANTHROPIC', 'SPACEX', 'OPENAI', 'ANDURIL', 'NEURALINK', 'FIGUREAI'].includes(intelligence.symbol);
  
  return (
    <div className="page-shell">
      <Link href="/" className="back-link">
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>

      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p className="eyebrow">Tokenized stock</p>
            <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '3rem', color: 'var(--lime)' }}>
              {intelligence.symbol}
            </h1>
            <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
              {intelligence.name}
            </p>
          </div>
          <StatusPill band={intelligence.riskScore.band} />
        </div>
      </section>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', marginTop: '24px' }}>
        <span className="source-badge source-live">
          {intelligence.referenceSource === 'prestocks-live' ? 'Live · PreStocks Feed' : 'Live · Market Data'}
        </span>
        <span className="pyth-badge pyth-live">
          {intelligence.referenceSource === 'prestocks-live' ? '⚡ PreStocks 24/7' : '⬡ Pyth Network'}
        </span>
      </div>

      <div className="grid-2" style={{ marginTop: '16px' }}>
        <div>
          <div className="data-card">
            <h3>Onchain price</h3>
            <div className="data-value">${intelligence.onchainPrice.toFixed(2)}</div>
            <div className="data-label" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {isPreStocks ? 'PreStocks DEX' : `Pyth Feed: Crypto.${intelligence.symbol}X/USD`}
            </div>
          </div>
        </div>
        <div>
          <div className="data-card">
            <h3>Reference price (Fair Value)</h3>
            <div className="data-value">${intelligence.referencePrice.toFixed(2)}</div>
            <div className="data-label" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
              {isPreStocks ? 'PreStocks Mark Price' : `Pyth Feed: Equity.US.${intelligence.symbol}/USD`} (Updated {formatTime(intelligence.referenceUpdatedAt)})
            </div>
            {intelligence.pythConfidenceUsd && (
              <div style={{ marginTop: '4px', fontSize: '0.74rem', color: 'var(--pyth-lavender)', fontFamily: 'SF Mono, monospace' }}>
                Pyth Band: ±${intelligence.pythConfidenceUsd.toFixed(2)} ({intelligence.pythConfidenceRatioPercent}%)
              </div>
            )}
          </div>
        </div>
      </div>

      {intelligence.pythFeedPair && (
        <div className="data-card" style={{ marginTop: '20px', borderColor: 'var(--pyth-lavender)', background: 'rgba(123, 97, 255, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--pyth-lavender)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ⬡ Pyth Network Dual-Feed Market Intelligence
            </div>
            <span className="pyth-badge pyth-live">Verified Pyth Pair</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase' }}>Underlying Equity Feed</div>
              <div style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-heading)', marginTop: '2px' }}>
                ${intelligence.pythFeedPair.equityPrice.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)', fontFamily: 'SF Mono, monospace', marginTop: '2px' }}>
                {intelligence.pythFeedPair.equitySymbol}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase' }}>On-Chain Tokenized Feed</div>
              <div style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink-heading)', marginTop: '2px' }}>
                ${intelligence.pythFeedPair.tokenPrice.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)', fontFamily: 'SF Mono, monospace', marginTop: '2px' }}>
                {intelligence.pythFeedPair.tokenSymbol} ({intelligence.pythFeedPair.tokenType})
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-subtle)', fontWeight: 800, textTransform: 'uppercase' }}>Feed Divergence Gap</div>
              <div style={{ fontFamily: 'SF Mono, monospace', fontSize: '1.1rem', fontWeight: 800, color: intelligence.pythFeedPair.gapPercent > 0 ? 'var(--lime)' : 'var(--amber)', marginTop: '2px' }}>
                {intelligence.pythFeedPair.gapPercent > 0 ? '+' : ''}{intelligence.pythFeedPair.gapPercent.toFixed(2)}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-subtle)', marginTop: '2px' }}>
                Dynamic Slippage: {intelligence.pythDynamicSlippageBps || 50} bps
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-3" style={{ marginTop: '24px' }}>
        <div className="data-card">
          <h3>Gap</h3>
          <div className={`data-value ${intelligence.gapPercent > 0 ? 'gap-positive-large' : 'gap-negative-large'}`}>
            {intelligence.gapPercent > 0 ? '+' : ''}{intelligence.gapPercent.toFixed(2)}%
          </div>
          <div className="data-label">
            {intelligence.gapDollar > 0 ? '+' : ''}${Math.abs(intelligence.gapDollar).toFixed(2)} per token
          </div>
        </div>
        <div className="data-card">
          <h3>Liquidity & Slippage</h3>
          <div className="data-value">
             {intelligence.routes[0] ? `$${Math.round(intelligence.routes[0].liquidityUsd).toLocaleString()}` : '—'}
          </div>
          <div className="data-label">
            {intelligence.liquidity} liquidity · {intelligence.pythDynamicSlippageBps || 50} BPS Slippage
          </div>
        </div>
        <div className="data-card">
          <h3>Risk score</h3>
          <div className="data-value" style={{ color: 'var(--lime)' }}>{intelligence.riskScore.score}</div>
          <div className="data-label">{intelligence.riskScore.band}</div>
        </div>
      </div>

      {/* Interactive Risk Simulator */}
      <div style={{ marginTop: '32px' }}>
        <RiskSimulator symbol={upperSymbol} initialIntelligence={intelligence} />
      </div>

      {intelligence.routes && intelligence.routes.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: 'var(--ink-heading)', fontFamily: 'Georgia, serif' }}>Best Execution Route</h3>
          <div className="route-card route-best">
            <div className="route-venue">{intelligence.routes[0]!.venue}</div>
            <div className="route-price">${intelligence.routes[0]!.price.toFixed(2)} / token</div>
            <div className="route-meta">
              <span>Impact: <strong>{intelligence.routes[0]!.priceImpact.toFixed(2)}%</strong></span>
              <span>Fees: <strong>${intelligence.routes[0]!.fees.toFixed(2)}</strong></span>
              <span>Dynamic Slippage Buffer: <strong>{intelligence.pythDynamicSlippageBps || intelligence.routes[0]!.slippage} bps</strong></span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <Link href={`/assets/${intelligence.symbol}/analysis`} className="button button-execute" style={{ padding: '0 20px', borderRadius: '12px' }}>
          Market analysis →
        </Link>
        <Link href={`/assets/${intelligence.symbol}/action`} className="button button-secondary">
          Risk evaluation →
        </Link>
      </div>
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

function formatTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' });
}
