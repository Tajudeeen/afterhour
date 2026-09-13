# TASKS.md

Execution state, structured by milestone. Mirrors deeen_plans/TASKS.md.

## Deadline

Stocklana hackathon submission.

## D0 — Pivot locked

- [x] Repo pivoted from Ambit (BSC/ERC-8004 marketplace) to AfterHours (Solana tokenized stock intelligence)
- [x] Branch `hack/stocklana-afterhours` created
- [x] Old BSC packages removed: erc8004, trust-engine, execution, contracts, pancakeswap, termix, passport, altana, activity, reputation, endpoint, demo, operations, indexer, db
- [x] New packages scaffolded: types, config, market-engine, risk-engine, agent, solana, db

## Day 1 — Foundation

- [x] Monorepo structure (pnpm workspaces)
- [x] Next.js web app (TypeScript + Tailwind)
- [x] REST API (Hono + TypeScript)
- [x] Wallet connection framework
- [x] Database schema (Prisma, PostgreSQL)
- [x] Basic dashboard screen
- [x] Asset model (NVDA, AAPL, TSLA)

## Day 2 — Market intelligence

- [x] Price ingestion (onchain vs reference)
- [x] Reference price adapter (Yahoo Finance / demo data)
- [x] Market-hours detection (NYSE calendar)
- [x] Price gap calculation
- [x] Gap Risk Score (0-100, 5 bands)

## Day 3 — Regime engine

- [x] Volatility calculation (ATR-based)
- [x] Liquidity state tracking (low/medium/high)
- [x] Market session state (pre/open/post/closed)
- [x] Regime classification (NORMAL → VOLATILITY RISING → LIQUIDITY FALLING → MARKET CLOSED → PRICE DIVERGENCE → HIGH GAP RISK)

## Day 4 — AI Analyst

- [x] Structured context builder
- [x] AI analyst with injected LLM provider
- [x] Explanation generation
- [x] Recommendation generation

## Day 5 — Risk Governor

- [x] MAX_SINGLE_ASSET exposure (35%)
- [x] MAX_TRADE size ($1,500)
- [x] MIN_USDC_RESERVE (10%)
- [x] MAX_DAILY_DRAWDOWN (3%)
- [x] REQUIRE_USER_APPROVAL (true)
- [x] AI → Governor → PASS/BLOCK → user approval chain

## Day 6 — Execution

- [x] Solana wallet adapter integration
- [x] Jupiter DEX aggregator swap provider
- [x] Transaction signing + sending
- [x] Signature confirmation
- [x] Portfolio update after trade

## Day 7 — Polish

- [ ] Demo video (0:00–1:20 script)
- [ ] Loading states
- [ ] Error boundaries
- [ ] Mobile layout
- [ ] README polished for judges
- [ ] Architecture diagram
- [ ] Verify gate green

## Blocked

- None.

## Known bugs / technical debt

- Mock data is used for price feeds and portfolios in the hackathon demo. Replace
  with live Solana RPC + Jupiter API in production.
