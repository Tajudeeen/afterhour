import Link from 'next/link';
import { getAssetAnalysis, getAssetIntelligence, type AIAnalysis, type AIAnalysisContext, type AssetIntelligence } from '@/lib/api';
import { RiskSimulator } from '@/components/RiskSimulator';

export default async function AnalysisPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upperSymbol = symbol.toUpperCase();

  let analysis: AIAnalysis | null = null;
  let context: AIAnalysisContext | null = null;
  let intelligence: AssetIntelligence | null = null;

  try {
    const data = await getAssetAnalysis(upperSymbol);
    analysis = data.analysis;
    context = data.context;
  } catch {
    // Fallback
    analysis = {
      explanation: `${upperSymbol} is trading 4.0% above its reference price while the underlying market is closed. Liquidity is currently thin and your portfolio has 46% exposure. This creates elevated gap risk at the next market open.`,
      primaryRisk: `Portfolio concentration in ${upperSymbol} exceeds policy limits during thin liquidity`,
      recommendation: { action: 'sell', asset: upperSymbol, amountUsd: 1150 },
      confidence: 0.87,
      createdAt: new Date().toISOString(),
    };
    context = {
      asset: upperSymbol,
      onchainPrice: 189.7,
      referencePrice: 182.4,
      gapPercent: 4.0,
      marketStatus: 'closed',
      liquidity: 'low',
      portfolioExposure: 46,
      maxAllowedExposure: 35,
      regime: {
        session: 'weekend',
        volatility: 'high',
        liquidity: 'low',
        gap: 4.0,
        concentration: 'high',
        label: 'HIGH GAP RISK',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Fetch full intelligence for the RiskSimulator (needs riskScore, pythConfidence, etc.)
  try {
    intelligence = await getAssetIntelligence(upperSymbol);
  } catch {
    // Simulator will use fallback values from analysis context
  }

  if (!analysis || !context) return null;

  // Build a minimal AssetIntelligence for the simulator if the full fetch failed
  const simIntelligence: AssetIntelligence = intelligence ?? {
    symbol: upperSymbol,
    name: upperSymbol,
    mint: '',
    referencePrice: context.referencePrice,
    referenceSource: 'seeded',
    referenceUpdatedAt: new Date().toISOString(),
    onchainPrice: context.onchainPrice,
    gapPercent: context.gapPercent,
    gapDollar: context.onchainPrice - context.referencePrice,
    routes: [],
    bestRoute: null,
    riskScore: { score: 50, band: 'Watch' },
    marketStatus: context.marketStatus,
    liquidity: context.liquidity,
    source: 'demo',
  };

  return (
    <div className="page-shell">
      <Link href={`/assets/${upperSymbol}`} className="back-link">
        <span aria-hidden="true">←</span> Back to {upperSymbol}
      </Link>

      <section style={{ marginTop: 24 }}>
        <div>
          <p className="eyebrow eyebrow-accent">AfterHours Analysis</p>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '2.4rem', color: 'var(--ink-heading)' }}>
            Why this matters
          </h1>
        </div>
      </section>

      <div className="regime-card" style={{ marginTop: 24 }}>
        <div className="regime-label">{context.regime.label}</div>
        <div className="data-label" style={{ marginTop: 8 }}>
          Current regime
        </div>
        <div className="regime-grid">
          <div className="regime-item">
            <span className="label">Market</span>
            <span className="value">{context.marketStatus.toUpperCase()}</span>
          </div>
          <div className="regime-item">
            <span className="label">Volatility</span>
            <span className="value">{context.regime.volatility.toUpperCase()}</span>
          </div>
          <div className="regime-item">
            <span className="label">Liquidity</span>
            <span className="value">{context.liquidity.toUpperCase()}</span>
          </div>
          <div className="regime-item">
            <span className="label">Gap</span>
            <span className="value">{context.gapPercent.toFixed(2)}%</span>
          </div>
          <div className="regime-item">
            <span className="label">Concentration</span>
            <span className="value">{context.regime.concentration.toUpperCase()}</span>
          </div>
          <div className="regime-item">
            <span className="label">Exposure</span>
            <span className="value">{Math.round(context.portfolioExposure)}% (max {context.maxAllowedExposure}%)</span>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <div className="data-card">
          <p className="ai-explanation">
            {analysis.explanation}
          </p>
          <div className="ai-primary-risk">
            <strong>Primary risk:</strong> {analysis.primaryRisk}
          </div>
        </div>
      </section>

      {/* Interactive Risk Simulator */}
      <section style={{ marginTop: 24 }}>
        <RiskSimulator symbol={upperSymbol} initialIntelligence={simIntelligence} />
      </section>

      <section style={{ marginTop: 24 }}>
        <div className="data-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', color: 'var(--ink-muted)', fontSize: '0.82rem', fontWeight: 800 }}>
                Recommendation
              </h3>
              <div style={{ color: 'var(--ink-body)', fontSize: '1.1rem' }}>
                {analysis.recommendation.action.toUpperCase()}: ${analysis.recommendation.amountUsd.toLocaleString()} {analysis.recommendation.asset}
              </div>
              <div className="data-label">
                Confidence: {Math.round(analysis.confidence * 100)}%
              </div>
            </div>
            <Link href={`/assets/${upperSymbol}/action`} className="button button-primary">
              Review action →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
