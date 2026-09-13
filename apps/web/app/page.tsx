import Link from 'next/link';
import { getPortfolio, type AssetSummary, type Portfolio } from '@/lib/api';

const DEMO_WALLET = 'demo';

export default async function DashboardPage() {
  let portfolio: Portfolio | null = null;
  let assets: AssetSummary[] = [];
  let error: string | null = null;

  try {
    const data = await getPortfolio(DEMO_WALLET);
    portfolio = data.portfolio;
    assets = data.assets;
  } catch {
    // Fallback to mock data if API is unavailable
    portfolio = {
      wallet: DEMO_WALLET,
      totalValueUsd: 10420,
      holdings: [
        { symbol: 'NVDA', mint: '', amount: 26.34, valueUsd: 4800, weightPercent: 46 },
        { symbol: 'AAPL', mint: '', amount: 9.8, valueUsd: 2100, weightPercent: 20 },
        { symbol: 'TSLA', mint: '', amount: 5.6, valueUsd: 1500, weightPercent: 14 },
        { symbol: 'USDC', mint: '', amount: 2020, valueUsd: 2020, weightPercent: 19 },
      ],
      timestamp: new Date().toISOString(),
    };
    assets = [
      {
        symbol: 'NVDA', onchainPrice: 189.7, referencePrice: 182.4, gapPercent: 4.02,
        valueUsd: 4800, weightPercent: 46,
        riskScore: { score: 72, band: 'High' },
        marketStatus: 'closed', liquidity: 'low',
      },
      {
        symbol: 'AAPL', onchainPrice: 215.0, referencePrice: 214.8, gapPercent: 0.12,
        valueUsd: 2100, weightPercent: 20,
        riskScore: { score: 15, band: 'Normal' },
        marketStatus: 'closed', liquidity: 'high',
      },
      {
        symbol: 'TSLA', onchainPrice: 267.0, referencePrice: 268.5, gapPercent: -0.56,
        valueUsd: 1500, weightPercent: 14,
        riskScore: { score: 28, band: 'Watch' },
        marketStatus: 'closed', liquidity: 'medium',
      },
      {
        symbol: 'USDC', onchainPrice: 1.0, referencePrice: 1.0, gapPercent: 0,
        valueUsd: 2020, weightPercent: 19,
        riskScore: { score: 0, band: 'Normal' },
        marketStatus: 'open', liquidity: 'high',
      },
    ];
    error = 'API unavailable — showing snapshot data';
  }

  const overallRisk = Math.max(...assets.map((a) => a.riskScore.score));
  const marketStatus = assets.find((a) => a.symbol === 'NVDA')?.marketStatus ?? 'closed';

  return (
    <div className="dashboard-shell">
      {error && (
        <div className="data-card" style={{ marginBottom: 20, borderColor: 'var(--amber)' }}>
          <p style={{ color: '#d9c98c', margin: 0 }}>{error}</p>
        </div>
      )}

      <div className="wallet-bar">
        <button className="wallet-connect">
          <span className="dot" /> Connect Solana wallet
        </button>
        <span className="wallet-connected">Connected as demo</span>
      </div>

      <section>
        <div className="portfolio-total">${portfolio?.totalValueUsd.toLocaleString() ?? '0'}</div>
        <div className="portfolio-subtotal">Portfolio value</div>
      </section>

      <div className="grid-3" style={{ marginTop: '28px' }}>
        <div className="risk-score-display">
          <strong>{overallRisk}</strong>
          <span>Overall risk score</span>
        </div>
        <div className="data-card">
          <h3>Market Status</h3>
          <div className="data-value">{marketStatus.toUpperCase()}</div>
          <div className="data-label">U.S. equities</div>
        </div>
        <div className="data-card">
          <h3>Solana</h3>
          <div className="data-value">ACTIVE</div>
          <div className="data-label">24/7 trading</div>
        </div>
      </div>

      <section style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: '#e0e6db' }}>
            Portfolio holdings
          </h2>
          <Link href="/activity" className="text-link">
            View activity →
          </Link>
        </div>

        <div className="portfolio-list">
          {portfolio?.holdings.map((holding) => {
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
          })}
        </div>
      </section>

      {assets.filter((a) => a.gapPercent > 1 || a.gapPercent < -1).length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ margin: '0 0 20px', fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: '#e0e6db' }}>
            Gaps detected
          </h2>
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
