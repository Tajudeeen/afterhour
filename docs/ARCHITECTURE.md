# AfterHours Architecture

## Overview

AfterHours is a pnpm monorepo with two apps and seven packages:

```
afterhours/
├── apps/
│   ├── web/          Next.js + Tailwind frontend (5 screens)
│   └── api/          Hono REST API
├── packages/
│   ├── types/        Shared TypeScript types
│   ├── config/       Environment configuration
│   ├── market-engine/ Gap detection + regime memory + scoring
│   ├── risk-engine/  Deterministic Risk Governor
│   ├── agent/        AI Analyst (LLM + structured context)
│   ├── solana/       Wallet adapter + DEX + execution
│   └── db/           Prisma schema
```

## Data flow

```
User connects wallet
        │
        ▼
Portfolio (mock/demo → Solana RPC in production)
        │
        ▼
Market Gap Engine  ←─── Price snapshots (onchain vs reference)
        │                    │
        ▼                    │
Regime Memory                  │
        │                    │
        ▼                    │
AI Analyst                     │
        │                      │
        ▼                      │
Risk Governor ◄────────────────┘
        │
   PASS? ──yes──▶ User approval
         └─no───▶ BLOCK (explain why)
        │
        ▼
Solana execution (Jupiter DEX swap)
        │
        ▼
Portfolio update + activity log
```

## Engine design

### Market Gap Engine (`packages/market-engine`)

- `calculateGapPercent(onchain, reference)` — the core formula
- `buildPriceSnapshot(...)` — assembles a snapshot from onchain + reference data
- `classifyLiquidity(volume)` — low/medium/high based on USD thresholds
- `classifyVolatility(prices[])` — ATR-based volatility classification
- `classifyMarketStatus(date)` — pre-market / open / post-market / closed
- `classifyRegime(inputs)` — maps current state to a regime label
- `computeGapRiskScore(inputs)` — 0–100 score with 5 bands
- `RegimeMemory` — tracks regime transitions over time

The engine is deterministic. No LLM needed for computation.

### Risk Engine (`packages/risk-engine`)

- `DEFAULT_RISK_POLICY` — hardcoded policy (35% max exposure, $1500 max trade, etc.)
- `RiskGovernor` — class wrapping the policy; `evaluate(...)` checks every constraint
- `evaluateRisk(...)` — pure function that returns `{ passed, reason, proposedState }`

The Governor checks:
1. Trade size within `MAX_TRADE`
2. Exposure after trade within `MAX_SINGLE_ASSET`
3. USDC reserve after trade >= `MIN_USDC_RESERVE`
4. Daily PnL within `MAX_DAILY_DRAWDOWN`
5. `REQUIRE_USER_APPROVAL` — the AI proposes, the Governor checks, the user signs

The AI cannot override these. They are enforced deterministically.

### AI Analyst (`packages/agent`)

- `AIContextBuilder` — converts engine output into structured JSON for the LLM
- `AIAnalyst` — class that formats a prompt, calls the LLM, parses the response
- `LLMProvider` — interface that can be injected (OpenAI, Azure, local, or mock)
- Falls back to deterministic recommendation if LLM output is unparseable

The AI receives structured data (gap %, volatility, regime, exposure, policy limits)
and returns: explanation, primary risk, recommendation, confidence.

### Solana (`packages/solana`)

- `SUPPORTED_STOCKS` — verified tokenized stock mint addresses (NVDA, AAPL, TSLA)
- `WalletManager` / `WalletAdapter` — connects Phantom, Solflare, Backpack, etc.
- `readBalances(connection, wallet)` — reads SPL token balances
- `JupiterSwapProvider` — queries Jupiter for swap quotes, builds transactions
- `executeSwap(connection, input)` — signs and sends the swap on Solana

### API (`apps/api`)

Hono server with REST endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| GET | `/version` | Release identity |
| GET | `/api/portfolio/:wallet` | Portfolio + asset risk summaries |
| GET | `/api/assets/:symbol` | Gap analysis (onchain vs reference) |
| GET | `/api/assets/:symbol/analysis` | AI Analyst explanation + recommendation |
| GET | `/api/assets/:symbol/risk` | Risk Governor evaluation |
| POST | `/api/execute` | Execute trade (requires signature) |
| GET | `/api/activity/:wallet` | Activity log |

### Web (`apps/web`)

Next.js 15 app router with 7 routes:

| Route | Screen |
|-------|--------|
| `/` | Dashboard |
| `/markets` | Market Discovery (PreStocks pre-IPO universe) |
| `/assets/:symbol` | Asset page |
| `/assets/:symbol/analysis` | AI Analysis |
| `/assets/:symbol/action` | Action screen |
| `/activity` | Activity |
| `/proof` | Live Verification Suite |

> **Note:** this list previously said "5 screens". `/markets` and `/proof` were added for
> the PreStocks and Pyth bounty tracks and are load-bearing — see `BUILD-PLAN.md` C1.

### Asset universe

AfterHours carries two layered universes — see `BUILD-PLAN.md` §2:

- **Public equities** — NVDA, AAPL, TSLA (`SUPPORTED_STOCKS` in `packages/solana`).
  The canonical demo path: the $10,420 portfolio, `docs/DEMO.md`, and the +4.02% gap
  example are all built on it.
- **Pre-IPO equities** — ANTHROPIC, SPACEX, OPENAI, ANDURIL, NEURALINK, FIGUREAI,
  KALSHI, POLYMARKET, served by the API's `isPreStocks` branch from the PreStocks feed.
  Backs `/markets` and the PreStocks bounty track.

## Security model

The Risk Governor is the security boundary. The AI Analyst is advisory.

- AI can propose, but cannot execute
- Governor enforces hard limits (deterministic, no AI involvement)
- User must sign every transaction (`REQUIRE_USER_APPROVAL = true`)
- Policy is defined in code, not configurable by end users in the MVP

See `docs/SECURITY.md` for the threat model.
