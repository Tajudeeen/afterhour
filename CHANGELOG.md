# CHANGELOG.md

Meaningful changes only — not every commit. Newest first.

## [Unreleased]

### Added
- **Public Gap Radar** (`apps/web/app/gaps/page.tsx`): Wallet-free, statically-prerendered 24/7 gap monitor showing real-time divergence between PreStocks fair value and on-chain DEX prices. Ranked by magnitude with regime classification, 30-second auto-refresh, and shareable asset analysis links. Powers audience capture for judges without wallet setup.
- **`GET /api/radar`** endpoint: Returns all tracked assets sorted by absolute gap magnitude, with regime classification, market hours, and 30-second cache. Serves both `/gaps` page and dashboard from a single source of truth.
- **"What's Hot" dashboard section**: Highlights top 3 trending gaps with LIVE/DEMO source badges and risk scores, powered by Pyth dual-feed comparison.
- **RiskSimulator real engine wiring**: Now calls `getAssetIntelligence(symbol, simulatedGapPercent)` API endpoint for live risk score and slippage computation, with 150ms debounce. Falls back to inline computation only for initial state.
- **Proof page API cross-verification**: Live feed receipt now cross-verifies PreStocks data against the API's `/api/radar` endpoint, displaying PASS/N/A status. Added NP-05 negative proof documenting portfolio isolation behavior.
- `getGapRadar` API client function + `GapRadarAsset` type in `apps/web/lib/api.ts`.

### Changed
- **Real on-chain portfolio reading**: Added `buildPortfolioForWallet()` to API — reads actual USDC and supported stock token balances via Solana RPC `getParsedTokenAccountsByTokenAccountsByOwner`. All endpoints (execute, portfolio, analysis, risk) now use this instead of hardcoded `portfolios.demo!`. Empty wallets get transparent demo fallback; no silent asset fabrication.
- **`executeTradeSimulation`**: Replaced random 88-char base58 signature generation with deterministic `5demo_` prefixed signatures derived from trade parameters. Execution path is now transparent: real user signatures are used if provided, deterministic demo signatures otherwise.
- **Real market hours**: Replaced hardcoded `isWeekend: true` in `buildAIContext` with dynamic computation from market status (`'closed' | 'after-hours'` → weekend).
- `ExecuteButton.tsx` now passes real wallet address (`publicKey.toBase58()`) to the API instead of hardcoded `'demo'`.
- Updated test count to **65/65** across 8 workspace packages in README and proof page.
- **Pyth Network Dual-Feed Market Intelligence & Oracle Discrepancy Engine**:
  - Implemented full compliance with Pyth's Hackathon bounty prompt ("Equity.US.AAPL/USD vs Crypto.AAPLX/USD vs Crypto.AAPLON/USD").
  - Added exact Pyth Hermes ID mapping for TradFi equities (`Equity.US.*`) alongside tokenized on-chain counterparts (`Crypto.*X` / Ondo) for AAPL, NVDA, and TSLA.
  - Multi-tab Market Discovery UI (`/markets`) with real-time toggle between **⬡ Pyth Dual-Feed Equities (xStocks / Ondo)** and **⚡ Pre-IPO Tokens (PreStocks)**.
  - Pyth basis divergence telemetry card on `/assets/[symbol]` surfacing canonical feed IDs, TradFi vs DEX price basis, and gap percentage.
  - Negative proof `NP-06` (Pyth Dynamic Slippage Expansion) on `/proof` demonstrating how the Risk Governor expands slippage and clamps maximum position sizing when on-chain vs TradFi Pyth divergence widens.
  - Dynamic Pyth Pro Bearer auth support via `PYTH_HERMES_API_KEY` with graceful failover snapshots to prevent offline or unauthenticated UI degradation.
- **Single source of truth for the Solana network.** `resolveSolanaNetwork`, `solanaNetworkLabel`,
  and `solscanTxUrl`/`solscanAddressUrl` in `@afterhours/types` now derive the cluster *and* every
  user-facing label from `SOLANA_NETWORK` / `SOLANA_RPC_URL` (server) and
  `NEXT_PUBLIC_SOLANA_NETWORK` / `NEXT_PUBLIC_SOLANA_RPC` (web, via `apps/web/lib/network.ts`,
  since Next.js only inlines `NEXT_PUBLIC_*`). A displayed network label can no longer disagree
  with the cluster a transaction settles on. Default is `mainnet-beta`.
- `docs/BUILD-PLAN.md` — reconciles the four competing plan sources (deeen_plans, README,
  `TASKS.md`, `STOCKLANA_CONTEST_AUDIT.md`) into one canonical scope, with a conflict register
  (C1–C6) and an off-plan inventory.

### Changed
- Settlement network default moved from Devnet to **Mainnet-Beta**; `SOLANA_NETWORK` selects
  `devnet` / `testnet` / `localnet`. All Devnet-hardcoded Solscan URLs and network labels across
  the web app, API, and `@afterhours/solana` now resolve from that one value.
- Corrected the test count to **63/63** in `README.md`, `TASKS.md`, and the `/proof` route. The
  three sources previously claimed 60, 57, and 58 respectively; all were stale.
- `docs/ARCHITECTURE.md`: web route table corrected (7 routes, not 5) and the asset universe
  documented as two layered universes.
- `docs/STOCKLANA_CONTEST_AUDIT.md`: dead absolute `ambit` links replaced with repo-relative
  paths, plus a dated post-audit reconciliation section.
- `AFTERHOURS_RELEASE_ID` replaces `AMBIT_RELEASE_ID` in the API `/version` route.
- Added `docs/BUILD-PLAN.md`.

### Removed
- `({t` — 0-byte junk file that had been committed.
- `deploy/.env.example` — leftover Ambit/BSC configuration (`BSC_RPC_URL`, `ERC8004_*` registries,
  `AMBIT_HIRE_TOKEN`). `docker-compose.yml` reads `env_file: .env` from the repo root, so nothing
  depended on it.

### Added (prior)
- Live Solana Devnet integration with `@solana/wallet-adapter-react` and `@solana/wallet-adapter-react-ui`, supporting browser wallets (Phantom, Solflare) with an interactive `WalletBar` and instant demo fallback.
- Authentic on-chain risk governance attestations published directly to Solana Devnet using the SPL Memo program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
- Live Solscan Devnet verification links on the Action execution screen and Activity audit trail.
- Full cross-platform verification gate (`pnpm run verify` running lint, typecheck, test, and web build).

### Fixed
- Fixed trade execution HTTP 404 by routing client-side actions to the backend API (`http://localhost:8787`) via `executeTrade`.
- Resolved Next.js 15 / React 19 async client component boundary by extracting `ExecuteButton.tsx`.
- Corrected portfolio rebalancing accounting to credit USDC on sells and debit USDC on buys, strictly maintaining total portfolio value ($10,420).
- Stabilized mock price snapshot with in-memory caching to eliminate random price fluctuation between dashboard, analysis, and risk views.
- Fixed deterministic agent fallback calculations by passing dynamic portfolio values.
- Full pivot from Ambit (BSC/ERC-8004 marketplace) to **AfterHours** — 24/7 intelligence
  for tokenized stocks on Solana. Detects on-chain-vs-reference price gaps, explains
  them with an AI Analyst, evaluates portfolio risk via a Risk Governor, and executes
  bounded actions on Solana after user approval.
- New packages: `@afterhours/types`, `@afterhours/config`, `@afterhours/market-engine`,
  `@afterhours/risk-engine`, `@afterhours/agent`, `@afterhours/solana`, `@afterhours/db`.
- Market Gap Engine with Gap Risk Score (0–100, 5 bands: Normal/Watch/Elevated/High/Extreme).
- Regime Memory engine (NORMAL → VOLATILITY RISING → LIQUIDITY FALLING → MARKET CLOSED →
  PRICE DIVERGENCE → HIGH GAP RISK).
- AI Analyst with structured context injection and deterministic fallback.
- Risk Governor with hard policy constraints (max exposure, max trade, min USDC reserve,
  max daily drawdown, user approval required).
- Solana wallet adapter + Jupiter DEX swap provider + transaction execution.
- REST API (Hono) with portfolio, asset gap, AI analysis, risk evaluation, execute, activity.
- 5 frontend screens (Dashboard, Asset, AI Analysis, Action, Activity).
- Prisma schema for AfterHours domain (users, wallets, assets, price_snapshots,
  market_states, portfolio_snapshots, risk_events, risk_policies, agent_decisions, transactions).
- Bloomberg-terminal × DeFi dashboard visual identity (dark, lime accents, Georgia serif).
- CI workflow, Dockerfile, docker-compose for AfterHours stack.

### Removed
- All BSC/ERC-8004 code: `@ambit/core`, `@ambit/contracts`, `@ambit/erc8004`,
  `@ambit/trust-engine`, `@ambit/execution`, `@ambit/pancakeswap`, `@ambit/termix`,
  `@ambit/passport`, `@ambit/altana`, `@ambit/activity`, `@ambit/reputation`,
  `@ambit/endpoint`, `@ambit/demo`, `@ambit/operations`, `apps/indexer`.
- AUDIT.md (BSC-specific; no longer applicable).
- Old docs: attestation, marketplace, production-readiness, pancakeswap.
