# TASKS.md

Execution state, structured by milestone. Mirrors deeen_plans/TASKS.md.

## Deadline

Stocklana hackathon submission.

## D0 — Pivot locked

- [x] Repo pivoted from Ambit (BSC/ERC-8004 marketplace) to AfterHours
- [x] Old packages removed (erc8004, trust-engine, execution, contracts,
      pancakeswap, termix, passport, altana, activity, reputation, endpoint,
      demo, operations, indexer app)
- [x] Old BSC test files removed
- [x] New package scaffolds created (types, config, market-engine,
      risk-engine, agent, solana, db)

## D1 — Backend core (completed)

- [x] TypeScript types package (`@afterhours/types`) — all domain types
      exported, `RISK_SCORE_BANDS` constant verified
- [x] Config package (`@afterhours/config`) — Solana RPC/chain env loader
      with int validation (port 1–65535, chainId ≥ 1)
- [x] Market Gap Engine (`@afterhours/market-engine`) — gap %, Gap Risk
      Score (0–100, 5 bands), Regime Memory, market-hours detection
- [x] AI Analyst (`@afterhours/agent`) — context builder, structured LLM
      prompt, deterministic fallback
- [x] Risk Governor (`@afterhours/risk-engine`) — `evaluateRisk` with
      4 hard policy checks (exposure, trade size, USDC reserve, drawdown)
- [x] Solana (`@afterhours/solana`) — wallet store, Jupiter DEX, balances
- [x] API (`apps/api`) — Hono REST: /health, /version, /api/portfolio/:w,
      /api/assets/:s, /api/assets/:s/analysis, /api/assets/:s/risk,
      /api/execute, /api/activity/:w

## D2 — Frontend (completed)

- [x] Next.js 15 + Tailwind app shell (Bloomberg dark, lime accents,
      Georgia serif)
- [x] Dashboard — portfolio total + per-asset gap/risk summary
- [x] Asset page — onchain vs reference price, gap %, risk score pill
- [x] AI Analysis — regime grid, explanation, recommendation + confidence
- [x] Action — AI proposal + policy check grid + sign-and-execute button
- [x] Activity — timeline audit trail with Solscan links

## D3 — Data + infra (completed)

- [x] Prisma schema (`packages/db/prisma/schema.prisma`) — Portfolio,
      PriceSnapshot, RegimeState, RiskEvent, AgentDecision, Transaction,
      RiskPolicy tables
- [x] Dockerfile (Node LTS, pnpm)
- [x] docker-compose.yml (api + postgres + redis)
- [x] CI workflow (`.github/workflows/ci.yml`) — lint + typecheck + test + build
- [x] `.env.example` with all variables documented

## D4 — Tests + verify (completed)

- [x] market-engine: 16 tests (gap, regime, liquidity, scoring)
- [x] risk-engine: 7 tests (evaluate, governor policy enforcement)
- [x] agent: 3 tests (deterministic fallback, LLM provider)
- [x] solana: 3 tests (stock exports, portfolio builder, SPL Memo attestation)
- [x] config: 13 tests (defaults, env overrides, validation)
- [x] types: 1 test (exports)
- [x] web: 1 smoke test (Next.js app router & wallet integration)
- [x] API: 13 tests (portfolio, asset, execute, health, security, rebalancing accounting)
- [x] Cross-platform verification gate (`pnpm run verify` / `bash scripts/verify`) passes — lint, typecheck, test (57/57 tests green), web build all green
- [x] Dual-mode Solana integration: Wallet Adapter (Devnet) + 1-click Demo mode
- [x] On-chain risk governance attestations via SPL Memo program with live Solscan Devnet links

## D5 — Ship (completed)

- [x] Branch `hack/stocklana-afterhours` created
- [x] Commit pushed to GitHub
- PR opened: https://github.com/Tajudeeen/ambit/pull/new/hack/stocklana-afterhours

## Out of scope (hackathon constraints)

- No autonomous trading — AI proposes, Risk Governor enforces, human approves
- No social feed, copy trading, DAO, token, NFT, mobile app
- No 50-stock universe — NVDA, AAPL, TSLA only
- No backtesting engine
