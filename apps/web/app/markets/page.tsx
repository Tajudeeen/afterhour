import Link from 'next/link';

export const metadata = { title: 'Markets — Pre-IPO Stock Intelligence' };

const PRESTOCKS_API = 'https://prestocks.com/api/prestocks';

interface PreStocksAsset {
  name: string;
  symbol: string;
  contract_address: string;
  markPrice: number;
  tokenPrice: number;
  supply: number;
  image: string;
}

const FALLBACK_PRESTOCKS_ASSETS: PreStocksAsset[] = [
  {
    name: 'SpaceX PreStocks',
    symbol: 'SPACEX',
    contract_address: 'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh',
    markPrice: 152.59,
    tokenPrice: 118.45,
    supply: 43712,
    image: 'https://www.prestocks.com/logos/spacex.png',
  },
  {
    name: 'Neuralink PreStocks',
    symbol: 'NEURALINK',
    contract_address: 'PrekqLJvJ3qVdXmBGDiexvwUTF4rLFDa6HWS4HJbw9S',
    markPrice: 335.26,
    tokenPrice: 424.72,
    supply: 2595,
    image: 'https://www.prestocks.com/logos/neuralink.png',
  },
  {
    name: 'OpenAI PreStocks',
    symbol: 'OPENAI',
    contract_address: 'PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF',
    markPrice: 994.16,
    tokenPrice: 1155.65,
    supply: 2826,
    image: 'https://www.prestocks.com/logos/openai.png',
  },
  {
    name: 'Anduril PreStocks',
    symbol: 'ANDURIL',
    contract_address: 'PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB',
    markPrice: 153.38,
    tokenPrice: 158.83,
    supply: 11805,
    image: 'https://www.prestocks.com/logos/anduril.png',
  },
  {
    name: 'Anthropic PreStocks',
    symbol: 'ANTHROPIC',
    contract_address: 'Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw',
    markPrice: 1029.32,
    tokenPrice: 1009.03,
    supply: 7381,
    image: 'https://www.prestocks.com/logos/anthropic.png',
  },
  {
    name: 'Figure AI PreStocks',
    symbol: 'FIGUREAI',
    contract_address: 'PreZad18qfPtbxNpMtMuAuX2zVpvkEU8DnJx56faCWd',
    markPrice: 181.29,
    tokenPrice: 177.96,
    supply: 3012,
    image: 'https://www.prestocks.com/logos/figureai.png',
  },
];

async function fetchMarkets(): Promise<{ assets: PreStocksAsset[]; isLive: boolean }> {
  try {
    const res = await fetch(PRESTOCKS_API, { next: { revalidate: 30 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { assets: FALLBACK_PRESTOCKS_ASSETS, isLive: false };
    const data = await res.json();
    return { assets: data, isLive: true };
  } catch {
    return { assets: FALLBACK_PRESTOCKS_ASSETS, isLive: false };
  }
}

export default async function MarketsPage() {
  const { assets, isLive } = await fetchMarkets();

  // Sort by absolute gap desc
  const sorted = [...assets].sort((a, b) => {
    const gapA = Math.abs((a.tokenPrice - a.markPrice) / a.markPrice);
    const gapB = Math.abs((b.tokenPrice - b.markPrice) / b.markPrice);
    return gapB - gapA;
  });

  return (
    <div className="page-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div className="eyebrow">
            <span className="eyebrow-accent">Market Discovery</span>
          </div>
          <h1 style={{ margin: '8px 0 0', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#f0f2ec', fontWeight: 500 }}>
            Pre-IPO Tokenized Markets
          </h1>
          <p style={{ margin: '8px 0 0', color: '#99a98a', fontSize: '1rem' }}>
            Real-time price gaps between fair value and on-chain price
          </p>
        </div>
        <span className={`source-badge ${isLive ? 'source-live' : 'source-demo'}`}>
          {isLive ? 'Live · PreStocks' : 'Demo Data'}
        </span>
      </div>

      {!isLive && (
        <div className="data-card" style={{ marginBottom: 20, borderColor: 'rgba(141,90,6,0.4)' }}>
          <p style={{ color: '#ffd98a', margin: 0, fontSize: '0.9rem' }}>
            ⚠ PreStocks API unavailable — showing cached seed data
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {sorted.map((asset) => {
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
                {/* Logo */}
                <img
                  src={asset.image}
                  alt={asset.name}
                  width={40}
                  height={40}
                  style={{ borderRadius: '10px', flexShrink: 0 }}
                />
                
                {/* Name + symbol */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 800, fontSize: '1rem', color: '#f0f2ec' }}>
                    {asset.symbol}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#7b8576', marginTop: '2px' }}>
                    {asset.name}
                  </div>
                </div>

                {/* Mark price */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#62675e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Fair Value</div>
                  <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, color: '#d4d8ce' }}>
                    ${asset.markPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <span className="prestocks-badge" style={{ marginTop: '4px' }}>PreStocks</span>
                </div>

                {/* On-chain price */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#62675e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>On-chain</div>
                  <div style={{ fontFamily: 'SF Mono, monospace', fontWeight: 700, color: '#f0f2ec' }}>
                    ${asset.tokenPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Gap */}
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#62675e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Gap</div>
                  <div className={isPositive ? 'gap-positive-large' : 'gap-negative-large'} style={{ fontSize: '1.2rem' }}>
                    {isPositive ? '+' : ''}{gapPercent.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7b8576' }}>
                    {isPositive ? '+' : ''}${Math.abs(gapDollar).toFixed(2)} per token
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ color: '#3a3f35', fontSize: '1.2rem' }}>→</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: '32px', padding: '20px', border: '1px solid var(--line)', borderRadius: '14px', background: 'rgba(123, 97, 255, 0.04)' }}>
        <div style={{ fontSize: '0.72rem', color: '#62675e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          ⬡ How AfterHours Detects Gaps
        </div>
        <p style={{ margin: 0, color: '#99a98a', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Fair value is sourced from PreStocks mark price — the valuation implied by the underlying SPV.
          On-chain price reflects live DEX trading activity on Solana.
          AfterHours computes the gap, routes the best execution path, applies the Risk Governor,
          and produces a bounded trade for your approval.
        </p>
      </div>
    </div>
  );
}
