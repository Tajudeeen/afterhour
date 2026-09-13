import Link from 'next/link';
import { getAssetGap, type PriceSnapshot, type RiskScore } from '@/lib/api';

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  let snapshot: PriceSnapshot | null = null;
  let riskScore: RiskScore | null = null;

  try {
    const data = await getAssetGap(upperSymbol);
    snapshot = data.snapshot;
    riskScore = data.riskScore;
  } catch {
    // Fallback mock data
    snapshot = {
      asset: upperSymbol,
      onchainPrice: 189.7,
      referencePrice: 182.4,
      gapPercent: 4.02,
      volume24h: 42500,
      liquidityUsd: 18500,
      liquidity: 'low',
      marketStatus: 'closed',
      referenceUpdatedAt: new Date(Date.now() - 16 * 3600_000).toISOString(),
      observedAt: new Date().toISOString(),
    };
    riskScore = { score: 72, band: 'High' };
  }

  if (!snapshot || !riskScore) return null;

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
              {snapshot.asset}
            </h1>
            <p style={{ color: 'var(--muted)', marginTop: '8px' }}>
              {getAssetName(snapshot.asset)}
            </p>
          </div>
          <StatusPill band={riskScore.band} />
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: '32px' }}>
        <div>
          <div className="data-card">
            <h3>Onchain price</h3>
            <div className="data-value">${snapshot.onchainPrice.toFixed(2)}</div>
          </div>
        </div>
        <div>
          <div className="data-card">
            <h3>Reference price</h3>
            <div className="data-value">${snapshot.referencePrice.toFixed(2)}</div>
            <div className="data-label">Last tradable: {formatTime(snapshot.referenceUpdatedAt)}</div>
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: '24px' }}>
        <div className="data-card">
          <h3>Gap</h3>
          <div className={`data-value ${snapshot.gapPercent > 0 ? 'gap-positive' : 'gap-negative'}`}>
            {snapshot.gapPercent > 0 ? '+' : ''}{snapshot.gapPercent.toFixed(2)}%
          </div>
        </div>
        <div className="data-card">
          <h3>24h volume</h3>
          <div className="data-value">${Math.round(snapshot.volume24h).toLocaleString()}</div>
        </div>
        <div className="data-card">
          <h3>Liquidity (USD)</h3>
          <div className="data-value">${Math.round(snapshot.liquidityUsd).toLocaleString()}</div>
          <div className="data-label">{snapshot.liquidity} liquidity</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '24px' }}>
        <div className="data-card">
          <h3>Market status</h3>
          <div className="data-value">{snapshot.marketStatus.toUpperCase()}</div>
        </div>
        <div className="data-card">
          <h3>Risk score</h3>
          <div className="data-value" style={{ color: 'var(--lime)' }}>{riskScore.score}</div>
          <div className="data-label">{riskScore.band}</div>
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
        <Link href={`/assets/${snapshot.asset}/analysis`} className="button button-primary">
          AI analysis →
        </Link>
        <Link href={`/assets/${snapshot.asset}/action`} className="button button-secondary">
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

function getAssetName(symbol: string): string {
  const names: Record<string, string> = {
    NVDA: 'NVIDIA Corporation',
    AAPL: 'Apple Inc.',
    TSLA: 'Tesla, Inc.',
    MSFT: 'Microsoft Corporation',
    GOOGL: 'Alphabet Inc.',
  };
  return names[symbol] ?? 'Tokenized stock';
}
