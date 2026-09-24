/**
 * Jupiter DEX aggregator integration.
 *
 * Jupiter is the primary DEX aggregator on Solana. It routes swaps across
 * Raydium, Orca, Meteora, Phoenix, and others to find the best price.
 *
 * In production: query Jupiter API for quotes, build swap transactions.
 * For demo: simulates a quote when the live API is unavailable.
 */
import type { Connection } from '@solana/web3.js';
import type { TokenizedStock } from '@afterhours/types';

export interface SwapRoute {
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  outputAmount: number;
  priceImpactBps: number;
  dex: string;
  route: string[];
}

export interface SwapQuote {
  route: SwapRoute;
  /** Minimum output considering slippage */
  minOutputAmount: number;
  /** Estimated gas (in SOL) for the transaction */
  estimatedGasSol: number;
}

/**
 * Jupiter swap provider — queries quotes and builds swap transactions.
 */
export class JupiterSwapProvider {
  private connection: Connection;
  private apiUrl: string;

  constructor(connection: Connection, apiUrl = 'https://api.jup.ag/swap/v1') {
    this.connection = connection;
    this.apiUrl = apiUrl;
  }

  /**
   * Get a swap quote for selling `inputAmount` of `inputMint` for `outputMint`.
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    slippageBps = 50,
  ): Promise<SwapQuote> {
    // Try real Jupiter API first, fall back to simulation
    const liveRoute = await this.fetchLiveQuote(inputMint, outputMint, inputAmount);
    const route = liveRoute ?? await this.simulateQuote(inputMint, outputMint, inputAmount, slippageBps);
    return {
      route,
      minOutputAmount: route.outputAmount * (1 - slippageBps / 10_000),
      estimatedGasSol: 0.0005,
    };
  }

  /**
   * Query the real Jupiter API for a swap quote.
   */
  private async fetchLiveQuote(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
  ): Promise<SwapRoute | null> {
    try {
      const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${Math.floor(inputAmount * 1_000_000)}&slippageBps=50`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (!data.outAmount) return null;
      return {
        inputMint,
        outputMint,
        inputAmount: Math.floor(inputAmount * 1_000_000),
        outputAmount: Number(data.outAmount),
        priceImpactBps: Number(data.priceImpactPct) * 100,
        dex: 'Jupiter (live)',
        route: data.routePlan?.map((r: any) => r.swapInfo?.label ?? 'unknown') ?? [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Build the swap transaction (in production: call POST /swap with the quote).
   */
  async buildSwapTransaction(quote: SwapQuote, userAddress: string): Promise<unknown> {
    // In production: POST /swap → returns serialized transaction
    return {
      quote,
      userAddress,
      serializedTransaction: 'mock_serialized_tx',
    };
  }

  /**
   * Simulate a quote as a fallback when the live Jupiter API is unavailable.
   * Produces a realistic price impact based on AMM-style depth.
   */
  private async simulateQuote(
    inputMint: string,
    outputMint: string,
    inputAmount: number,
    _slippageBps: number,
  ): Promise<SwapRoute> {
    // Use a simple price feed — in production this is real DEX pricing
    const inputToken = await this.lookupToken(inputMint);
    const outputToken = await this.lookupToken(outputMint);

    const inputPriceUsd = inputToken?.referencePrice ?? 1;
    const outputPriceUsd = outputToken?.referencePrice ?? 1;

    // Add a realistic price impact for thin liquidity
    const priceImpact = this.computePriceImpact(inputAmount, inputPriceUsd);
    const rawOutput = (inputAmount * inputPriceUsd) / outputPriceUsd;
    const outputAmount = rawOutput * (1 - priceImpact);

    return {
      inputMint,
      outputMint,
      inputAmount,
      outputAmount,
      priceImpactBps: priceImpact * 10_000,
      dex: 'Jupiter (simulated)',
      route: [inputMint, outputMint],
    };
  }

  private async lookupToken(_mint: string): Promise<TokenizedStock | { referencePrice: number } | null> {
    const { SUPPORTED_STOCKS, USDC_MINT } = await import('./assets.js');
    if (_mint === USDC_MINT) return { referencePrice: 1.0 };
    return SUPPORTED_STOCKS.find((s) => s.mint === _mint) ?? null;
  }

  private computePriceImpact(amountUsd: number, priceUsd: number): number {
    // Simple AMM-style price impact: larger trades in thin markets move price more
    const tokenAmount = amountUsd / priceUsd;
    if (tokenAmount < 1) return 0.001; // 0.1% for small trades
    if (tokenAmount < 10) return 0.005; // 0.5% for medium
    if (tokenAmount < 100) return 0.02; // 2% for large
    return 0.05; // 5% for very large
  }
}
