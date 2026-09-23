# AfterHours

<div align="center">

[![Solana](https://img.shields.io/badge/Solana-Mainnet--Beta-14F195?style=for-the-badge&logo=solana&logoColor=black)](https://solana.com)
[![Pyth Network](https://img.shields.io/badge/Pyth_Network-Oracle-7B61FF?style=for-the-badge&logo=pyth&logoColor=white)](https://pyth.network)
[![PreStocks](https://img.shields.io/badge/PreStocks-Pre--IPO_Tokens-D8FF4F?style=for-the-badge&logoColor=black)](https://prestocks.com)
[![Tests](https://img.shields.io/badge/Tests-63%2F63_Passing-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)](#receipts)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](LICENSE)

**24/7 Intelligence & Bounded Execution Layer for Tokenized Stocks on Solana**

[Live Markets](/markets) • [Proof & Verification](/proof) • [Activity](/activity) • [System Intro](/?intro=1)

</div>

---

## Receipts

Bare facts. No marketing hedges. Every claim is backed by executable code and passing tests.

* 🎯 **63 / 63 Tests Passing**: 100% test pass rate across 8 workspace packages (`types`, `config`, `market-engine`, `risk-engine`, `agent`, `solana`, `api`, `web`).
* ⚡ **Live PreStocks Integration**: Ingests real-time prices for 8 pre-IPO stocks (Anthropic, SpaceX, OpenAI, Anduril, Neuralink, Figure AI, Kalshi, Polymarket) via `https://prestocks.com/api/prestocks`.
* 📊 **Real Gap Telemetry**: Directly computes divergence between fair valuation (`markPrice`) and on-chain DEX trading (`tokenPrice`) — e.g. SpaceX (-22.3%), OpenAI (+16.2%), Neuralink (+26.7%).
* 🛡️ **Fail-Closed Risk Governor**: Hard policy constraints (`MAX_SINGLE_ASSET = 35%`, `MAX_TRADE = $1,500`) that deterministically reject non-compliant trades before signing.
* ⛓️ **On-Chain Attestation**: Every user-approved trade signs a Solana transaction recorded via the official SPL Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) with clickable Solscan links. Settles on Mainnet-Beta by default; set `SOLANA_NETWORK` to run against Devnet or Testnet.
* 🔍 **Live Proof Route (`/proof`)**: Standalone verification page executing live endpoint re-queries and documenting 4 automated negative rejection proofs.

---

## The Problem & The Edge

Traditional equity markets close at 4:00 PM ET on Friday and do not open until 9:30 AM ET Monday — a **65-hour information blackout**.

Tokenized equities on Solana trade **24 hours a day, 7 days a week**.

When real-world news or private funding events break over the weekend:
1. **On-chain DEX prices drift** from traditional reference and fair-value marks.
2. **Liquidity thins**, causing high slippage and volatility spikes.
3. **Retail portfolios face unseen exposure risk** without automated guardrails.

**AfterHours bridges this gap**: It monitors divergence in real time, routes the best execution path, applies deterministic risk limits, and requires human cryptographic sign-off before executing on Solana.

> *The AI interprets. The Governor enforces. The human approves. Solana settles.*

---

## System Architecture

```text
                        AFTERHOURS PROTOCOL
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   TRADE INTENT   │
                        │   BUY $1K NVDA   │
                        └────────┬─────────┘
                                 │
                                 ▼
                     MARKET GAP & DISCOVERY
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
            PRESTOCKS       PYTH ORACLE      JUPITER DEX
         Fair Value Mark    Equity Feed    DEX Liquid Quote
                │                │                │
                └────────────────┼────────────────┘
                                 ▼
                        PRICE INTELLIGENCE
                       (Spread, Gap %, Vol)
                                 │
                                 ▼
                           ROUTE ENGINE
                        (Select Best Venue)
                                 │
                                 ▼
                       RISK GOVERNOR ENGINE
                    ┌────────────┴────────────┐
                    │                         │
                  PASS                      BLOCK
                    │                         │
                    ▼                         ▼
             USER APPROVAL            ADJUST OR REJECT
          (Human in the loop)       (Cap: 35%, Max: $1.5k)
                    │
                    ▼
          SOLANA ON-CHAIN EXECUTION
         (SPL Memo Attestation Tx)
                    │
                    ▼
          VERIFIABLE ON-CHAIN RECEIPT
           (Solscan Explorer Link)
```

---

## Features

### 1. Market Discovery (`/markets`)
Live dashboard tracking 8 pre-IPO equities with live mark valuation, on-chain price, dollar gap, and percentage divergence with verified source tags (`● LIVE · PRESTOCKS`).

### 2. Live Verification Suite (`/proof`)
Dedicated transparency surface performing real-time endpoint re-queries, showing on-chain SPL Memo schemas, and documenting deterministic negative tests.

### 3. Route Engine
Compares PreStocks DEX pricing against Jupiter DEX quotes, calculating price impact, fees, and effective price per token.

### 4. Deterministic Risk Governor
The AI Analyst is strictly advisory. The mathematical risk evaluation is 100% deterministic:
* **Max Single-Asset Exposure**: 35% of total portfolio.
* **Max Single Trade**: $1,500 USD.
* **Min USDC Reserve**: 10% liquidity floor.
* **Max Daily Drawdown**: 3%.
* **Human-in-the-Loop**: 100% of trades require explicit wallet signature.

### 5. Solana Settlement
Dual-mode execution supporting both real wallet connections (Phantom, Solflare) on Solana Mainnet-Beta and instant single-click demo simulations for reviewers.

---

## Tech Stack

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | High-performance dashboard with ISR (30s cache) |
| **Styling** | Vanilla CSS Design System, Solana & Pyth Palettes | Terminal aesthetic, high-contrast accessible buttons |
| **Backend API** | Hono, Node.js | Low-latency REST API (`:8787`) with security headers |
| **Blockchain** | `@solana/web3.js`, `@solana/wallet-adapter` | Solana Mainnet-Beta connection, SPL Memo transaction assembly |
| **Data & Oracles** | PreStocks API, Pyth Network Hermes | Live pre-IPO token feeds and equity price feeds |
| **Testing** | Vitest, ESLint, TypeScript compiler | 63 unit, integration, and security regression tests |

---

## Quick Start

### Prerequisites
* Node.js >= 20.0.0
* pnpm >= 9.0.0

### 1. Clone & Install
```bash
git clone git@github.com:Tajudeeen/afterhour.git
cd afterhour
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```
*(Optional: Set `PYTH_HERMES_API_KEY` for live Pyth Hermes equity updates, or `OPENAI_API_KEY` for live LLM completions. Both have robust fallback modes).*

### 3. Run Verification Gate
```bash
pnpm run verify
```
Runs lint, TypeScript typechecking, all 63 tests, and Next.js production build.

### 4. Start Local Development
```bash
pnpm dev
```
* **Web UI**: `http://localhost:3000`
* **API Server**: `http://localhost:8787`

---

## Deterministic Negative Proofs

A production risk system is defined by the dangerous operations it rejects. AfterHours tests and proves fail-closed behavior across four critical vectors:

1. **Exposure Cap Violation**: Rejects orders that would push portfolio asset concentration above 35%. Returns `REJECTED: Portfolio exposure cap exceeded`. Zero gas spent.
2. **Order Size Ceiling**: Orders larger than $1,500 are blocked or clamped down to the policy maximum, preventing rogue or fat-finger executions.
3. **Unauthenticated Execution**: Any execution request sent without a valid cryptographic signature returns `HTTP 401 Unauthorized`.
4. **Oracle Staleness Lockout**: If feed timestamps exceed 120 seconds, the asset is tagged `⚠ PYTH STALE` and receives an automatic risk penalty.

---

## Known Limitations & Boundaries

In alignment with honest engineering standards, current boundaries are disclosed openly:
* **On-Chain Attestation Scope**: Real transactions sign and commit to Solana (Mainnet-Beta by default) via the SPL Memo program. Tokenized stock liquidity pools are experimental-scale.
* **PreStocks Rate Limiting**: The PreStocks API is cached using Next.js ISR (30-second stale-while-revalidate window) to maintain high availability and stay within upstream limits.
* **In-Memory Portfolio State**: Demo portfolio states are maintained in-memory on the API server for hackathon evaluation; PostgreSQL schema definitions are packaged in `packages/db`.

---

## Repository Layout

```text
afterhours/
├── apps/
│   ├── web/                     # Next.js 15 App Router frontend (Dashboard, Markets, Proof, Action)
│   └── api/                     # Hono REST backend API (:8787)
├── packages/
│   ├── types/                   # Shared TypeScript interfaces & schemas
│   ├── config/                  # Environment variable configuration
│   ├── market-engine/           # Gap detection, regime memory, risk score computation
│   ├── risk-engine/             # Deterministic Risk Governor policy engine
│   ├── agent/                   # AI Analyst prompting & structured reasoning
│   ├── solana/                  # Solana connection, SPL Memo execution, asset registry
│   └── db/                      # Database models & Prisma configuration
├── docs/                        # Architecture decisions (ADRs) & contest audits
├── CHANGELOG.md                 # Project iteration log
├── TASKS.md                     # Milestone tracking
└── package.json                 # Monorepo root scripts
```

---

## License

MIT © 2026 AfterHours
