import Link from 'next/link';
import { getPortfolio, type AssetSummary, type Portfolio } from '@/lib/api';
import { WalletBar } from '@/components/WalletBar';

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
      totalValueUsd: 10000,
      holdings: [
        { symbol: 'ANTHROPIC', mint: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw', amount: 2.9, valueUsd: 3000, weightPercent: 30 },
        { symbol: 'SPACEX', mint: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh', amount: 21.1, valueUsd: 2500, weightPercent: 25 },
        { symbol: 'OPENAI', mint: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF', amount: 1.73, valueUsd: 2000, weightPercent: 20 },
        { symbol: 'NEURALINK', mint: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S', amount: 2.35, valueUsd: 1000, weightPercent: 10 },
        { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xB9qMLM6kq7K3e8n1W4c2X', amount: 1500, valueUsd: 1500, weightPercent: 15 },
      ],
      timestamp: new Date().toISOString(),
    };
    assets = [
      {
        symbol: 'ANTHROPIC', onchainPrice: 1009.03, referencePrice: 1029.32, gapPercent: -1.94,
        valueUsd: 3000, weightPercent: 30,
        riskScore: { score: 28, band: 'Watch' },
        marketStatus: 'open', liquidity: 'medium',
      },
      {
        symbol: 'SPACEX', onchainPrice: 118.45, referencePrice: 152.59, gapPercent: -22.3,
        valueUsd: 2500, weightPercent: 25,
        riskScore: { score: 92, band: 'Extreme' },
        marketStatus: 'open', liquidity: 'low',
      },
      {
        symbol: 'OPENAI', onchainPrice: 1155.65, referencePrice: 994.16, gapPercent: 16.2,
        valueUsd: 2000, weightPercent: 20,
        riskScore: { score: 85, band: 'High' },
        marketStatus: 'open', liquidity: 'medium',
      },
      {
        symbol: 'NEURALINK', onchainPrice: 424.72, referencePrice: 335.26, gapPercent: 26.5,
        valueUsd: 1000, weightPercent: 10,
        riskScore: { score: 89, band: 'High' },
        marketStatus: 'open', liquidity: 'low',
      },
      {
        symbol: 'USDC', onchainPrice: 1.0, referencePrice: 1.0, gapPercent: 0,
        valueUsd: 1500, weightPercent: 15,
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

      <WalletBar />

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
          <h2 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: 'var(--ink-heading)' }}>
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
          <h2 style={{ margin: '0 0 20px', fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: 'var(--ink-heading)' }}>
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
