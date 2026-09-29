# AfterHours: Bridging the 65-Hour Gap in Tokenized Equities

## The Problem: The 65-Hour Information Blackout

In traditional finance, U.S. equity markets close their doors at 4:00 PM ET on Friday and don't reopen until 9:30 AM ET on Monday. This creates a massive 65-hour information blackout. For decades, this was just an accepted reality of the market. If breaking news hit over the weekend—a CEO resignation, a geopolitical event, or a major private funding round—investors had to wait until Monday morning to react.

However, the rise of tokenized stocks on blockchains like Solana has fundamentally changed this dynamic. Tokenized versions of assets like NVIDIA (NVDA), Apple (AAPL), and Tesla (TSLA) trade 24 hours a day, 7 days a week on decentralized exchanges (DEXs).

This creates a dangerous divergence:
1. **Price Drift:** The on-chain price of a tokenized stock continues to move based on weekend news, drifting away from its traditional reference price (the official Friday close).
2. **Thin Liquidity:** Without traditional market makers operating over the weekend, liquidity on DEXs becomes thin, leading to high slippage and elevated volatility.
3. **Unseen Exposure:** Retail portfolios carrying these tokenized assets face unseen exposure risk without automated guardrails.

This is the gap that **AfterHours** is built to solve.

## The Edge: 24/7 Intelligence & Bounded Execution

AfterHours is a protocol designed to provide 24/7 market intelligence and a bounded execution layer for tokenized stocks on Solana. It acts as an automated, fail-closed guardrail for investors holding tokenized equities over the weekend.

Instead of leaving retail investors to guess the true value of their holdings during the 65-hour blackout, AfterHours provides:
- **Dual-Feed Market Intelligence:** By integrating with Pyth Network Hermes oracles, AfterHours directly compares TradFi equity feeds with on-chain tokenized stock feeds in real-time.
- **Pre-IPO Discovery:** A live integration with PreStocks ingests real-time prices for pre-IPO giants like SpaceX, OpenAI, and Anthropic, comparing their fair valuation against on-chain DEX trading.
- **Real Gap Telemetry:** It computes the exact divergence between the fair valuation (mark price) and the on-chain DEX trading price (token price).

## System Architecture: How AfterHours Thinks

The AfterHours architecture is an elegant pipeline of intelligence, deterministic risk enforcement, and human-in-the-loop settlement.

### 1. Market Discovery & Intelligence
When a user connects their wallet, the system evaluates their portfolio. The **Market Gap Engine** continuously scans for price divergence, checking factors like:
- Absolute gap percentage
- Volatility and liquidity
- Market session status (Open vs. Closed)
- Portfolio concentration

This data feeds into a **Gap Risk Score (0-100)**. The engine also maintains a **Regime Memory**, which classifies the current market state (e.g., "VOLATILITY RISING" or "HIGH GAP RISK") so the system understands the context, not just the raw numbers.

### 2. The AI Analyst: Advisory, Not Executive
The deterministic data is then fed into the **AI Analyst**. Unlike autonomous trading bots, the AI in AfterHours is strictly advisory. It receives structured data (gap %, volatility, regime, exposure) and translates it into human-readable insights. It explains *why* the gap matters, identifies the primary risk, and suggests an action.

*Crucially, the AI cannot execute trades.*

### 3. The Risk Governor: The Unbreakable Boundary
The core security layer of AfterHours is the **Risk Governor**. This is a deterministic policy engine that enforces hard mathematical limits on every proposed action. Before any trade can be signed, the Governor evaluates it against a strict set of rules:
- **Max Single-Asset Exposure:** Caps concentration at 35% of the total portfolio.
- **Max Single Trade:** Limits order size to $1,500 USD to prevent massive slippage in thin weekend liquidity.
- **Min USDC Reserve:** Maintains a 10% liquidity floor for opportunistic buying.
- **Max Daily Drawdown:** Stops trading if losses exceed 3%.

If the AI suggests a trade that violates any of these policies, the Risk Governor deterministically blocks it. The system is designed to fail-closed.

### 4. Solana Settlement: Human-in-the-Loop Execution
Even if the AI proposes a valid trade and the Risk Governor approves it, AfterHours requires **100% human-in-the-loop approval**. The user must explicitly sign the transaction with their wallet.

Once signed, the trade is routed through the best available venue (comparing PreStocks pricing against Jupiter DEX quotes) and settled on the Solana blockchain. Every user-approved trade includes an on-chain attestation recorded via the official SPL Memo Program, providing a verifiable receipt for the execution.

## The Tech Stack

AfterHours is built for high performance and strict determinism:
- **Frontend:** Next.js 15 App Router with React 19, delivering a terminal-aesthetic dashboard with 30-second stale-while-revalidate (ISR) caching.
- **Backend API:** A low-latency REST API built with Hono and Node.js.
- **Blockchain:** Powered by `@solana/web3.js` and `@solana/wallet-adapter`, currently configured for zero-cost testing on Solana Devnet.
- **Data Oracles:** Live feeds from Pyth Network Hermes and PreStocks API.
- **Assurance:** A robust testing suite (Vitest, ESLint, TypeScript compiler) ensuring 100% test pass rates across the monorepo workspace.

## Conclusion

The transition of traditional equities to the blockchain is inevitable, but the structural differences between 9-to-5 markets and 24/7 networks create temporary, dangerous chasms. AfterHours doesn't just build a bridge over that gap; it builds a bridge with heavily reinforced guardrails.

By combining real-time oracle intelligence with a strictly deterministic Risk Governor, AfterHours ensures that while the markets never sleep, investors can.
