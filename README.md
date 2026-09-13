# AfterHours

**24/7 intelligence for tokenized stocks on Solana.**

When Wall Street closes, Solana keeps trading. Tokenized stocks (NVDA, AAPL, TSLA)
continue to change hands on-chain while traditional markets sleep — creating price
divergence between what the on-chain market is pricing and what the last close
reflected.

AfterHours is an intelligent risk and execution layer that:

1. **Detects abnormal market gaps** between on-chain prices and traditional reference prices
2. **Explains them** with an AI Analyst that reasons over regime, liquidity, volatility, and concentration
3. **Assesses portfolio risk** via a deterministic Risk Governor with hard policy bounds
4. **Executes bounded actions** on Solana — only after human approval

> AI interprets. The Governor enforces. The human approves. Solana executes.

## Why this matters

Traditional equity markets close at 4pm ET. Tokenized equities on Solana trade 24/7.
That creates an information gap: on-chain prices can drift from reference prices
while liquidity thins and volatility rises. AfterHours turns that gap into
actionable intelligence.

The product chain:

```
NEW MARKET STRUCTURE  →  INFORMATION GAP  →  AI INTERPRETATION  →  RISK CONTROL  →  ONCHAIN EXECUTION
     24/7 trading            price vs ref       explain + propose      hard limits      Solana tx
```

## Quick start

```bash
# Install
pnpm install

# Copy env
cp .env.example .env

# Run everything
pnpm dev              # API on :8787, web on :3000

# Or run individually
pnpm --filter @afterhours/api dev     # REST API
pnpm --filter @afterhours/web dev     # Next.js app
```

## Repository structure

```
afterhours/
├── apps/
│   ├── web/          # Next.js + Tailwind dashboard (5 screens)
│   ├── api/          # REST API (Hono + TypeScript)
├── packages/
│   ├── types/        # Shared domain types
│   ├── config/       # Environment configuration
│   ├── market-engine/ # Gap detection, regime memory, scoring
│   ├── risk-engine/  # Risk Governor (deterministic policy enforcement)
│   ├── agent/        # AI Analyst (structured context → LLM → recommendation)
│   ├── solana/       # Wallet adapter, DEX integration, execution
│   └── db/           # Prisma schema
├── docs/             # Architecture, product, risk model, demo script
├── .env.example
├── CHANGELOG.md
├── TASKS.md
├── AGENTS.md
└── pnpm-workspace.yaml
```

## The five engines

### 1. Market Gap Engine
```
gap = (onchain_price - reference_price) / reference_price
```
Combined with gap %, volume, liquidity, volatility, market status, and time since
reference update into a Gap Risk Score (0–100, 5 bands).

### 2. Regime Memory
Remembers the recent market state: market session, volatility, liquidity, gap, and
concentration. Classifies into regimes (NORMAL → VOLATILITY RISING → LIQUIDITY
FALLING → MARKET CLOSED → PRICE DIVERGENCE → HIGH GAP RISK). The AI Analyst sees
the current regime, not just the current price.

### 3. AI Analyst
Does NOT calculate. The deterministic backend computes all percentages, exposures,
risk scores, and limits. The AI receives structured JSON and produces:
- An explanation of why this matters
- The primary risk
- A bounded recommendation

### 4. Risk Governor
Hard policy constraints the AI cannot override:
- `MAX_SINGLE_ASSET = 35%` (max portfolio exposure to one stock)
- `MAX_TRADE = $1,500` (max single trade)
- `MIN_USDC_RESERVE = 10%` (minimum stablecoin reserve)
- `MAX_DAILY_DRAWDOWN = 3%` (max daily portfolio loss)
- `REQUIRE_USER_APPROVAL = true` (human must sign every trade)

### 5. Solana Execution
Wallet adapter → Jupiter DEX aggregator quote → user signs → on-chain swap →
portfolio updates.

## The user journey (7 days, end-to-end)

1. **Connect wallet** → see portfolio ($10,420 across NVDA/AAPL/TSLA/USDC)
2. **Gap detected** → NVDA trading +4.0% above reference while market is closed
3. **AI explains** → thin liquidity, 46% concentration, elevated gap risk
4. **Governor evaluates** → exposure 46% > 35% limit, proposes sell $1,150
5. **User approves** → wallet signs → Solana executes
6. **Dashboard updates** → NVDA exposure 35%, USDC 31%

## Supported assets

| Symbol | Name               | Status     |
|--------|--------------------|------------|
| NVDA   | NVIDIA Corporation | Supported  |
| AAPL   | Apple Inc.         | Supported  |
| TSLA   | Tesla, Inc.        | Supported  |

*(Hackathon: 3 stocks. Not 50.)*

## Tech stack

| Layer        | Tech                                    |
|-------------|-----------------------------------------|
| Frontend    | Next.js 15, TypeScript, TailwindCSS    |
| Wallet      | @solana/web3.js + wallet-adapter-react  |
| Backend     | Hono (Node.js)                          |
| Engines     | TypeScript packages (market, risk, agent)|
| DEX         | Jupiter aggregator                       |
| Database    | PostgreSQL (Prisma)                     |
| AI          | OpenAI-compatible (or mock for demo)    |

## Demo script

See `docs/demo.md` for the full 90-second demo flow.

## License

MIT.
