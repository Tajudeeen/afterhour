# CHANGELOG.md

Meaningful changes only — not every commit. Newest first.

## [Unreleased]

### Added
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
