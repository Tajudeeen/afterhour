# Top 5 Technical Talking Points for Hackathon Judges

When defending the project or summarizing its technical merit, focus on these five points:

1. **Deterministic Risk > AI Agency**
   We did not give an LLM the keys to a wallet. The AI Analyst acts purely as a data interpreter. The Risk Governor is written in strictly typed, deterministic TypeScript (`packages/risk-engine`) that hard-blocks transactions if they violate exposure limits, ensuring a fail-closed architecture.

2. **Dual-Feed Oracle Verification**
   We aren't relying on a single price source. We utilize Pyth Network's hermes architecture to poll TradFi equity feeds (`Equity.US.*`) and on-chain crypto feeds (`Crypto.*X`) simultaneously. This allows us to programmatically calculate divergence and dynamically scale slippage boundaries based on oracle confidence intervals.

3. **Live Pre-IPO Data Integration**
   We integrate with the PreStocks API (`prestocks.com/api/prestocks`) to provide live, 24/7 mark prices for highly illiquid, tokenized pre-IPO assets (like SpaceX, Anthropic, and OpenAI), rather than relying solely on static or seeded reference prices.

4. **On-Chain SPL Memo Attestations**
   Every user-approved trade isn't just a swap. We bundle the Jupiter DEX execution instruction with a Solana SPL Memo instruction. This creates a cryptographically verifiable, immutable audit trail on the ledger proving that the Risk Governor cleared the trade within policy bounds before execution.

5. **Production-Ready Fallbacks & Verification**
   The codebase is built defensively. If external APIs (Pyth, PreStocks, OpenAI) rate-limit or fail, the system elegantly falls back to seeded in-memory data, ensuring the demo always functions. Furthermore, we maintain a dedicated `/proof` route that programmatically documents our deterministic negative tests (verifying that bad trades are successfully blocked).
