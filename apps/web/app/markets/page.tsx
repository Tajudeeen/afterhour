import { MarketsView, type PreStocksAsset } from '@/components/MarketsView';

export const metadata = {
  title: 'Markets — Pyth Dual-Feed & PreStocks Intelligence | AfterHours',
  description: 'Live 24/7 comparison of Pyth underlying equity feeds vs on-chain tokenized stocks on Solana, alongside PreStocks pre-IPO data.',
};

const PRESTOCKS_API = 'https://prestocks.com/api/prestocks';

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

  return (
    <div className="page-shell">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div className="eyebrow">
            <span className="eyebrow-accent">Market Discovery</span>
          </div>
          <h1 style={{ margin: '8px 0 0', fontFamily: 'Georgia, serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--ink-heading)', fontWeight: 500 }}>
            Tokenized Stock Markets
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--ink-muted)', fontSize: '1rem' }}>
            24/7 price intelligence comparing Pyth TradFi vs on-chain feeds and PreStocks valuations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="pyth-badge pyth-live">⬡ Pyth Active</span>
          <span className={`source-badge ${isLive ? 'source-live' : 'source-demo'}`}>
            {isLive ? 'Live · PreStocks' : 'Demo Data'}
          </span>
        </div>
      </div>

      <MarketsView prestocksAssets={assets} isPrestocksLive={isLive} />
    </div>
  );
}
