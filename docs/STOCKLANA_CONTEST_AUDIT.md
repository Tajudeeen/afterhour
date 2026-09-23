# Stocklana Hackathon: Comprehensive Contest Audit & Win Strategy

**Evaluation Date:** September 20, 2026  
**Competition:** [Stocklana Hackathon](https://hackathons.solana.com/hackathons/stocklana)  
**Total Prize Pool:** $126,000  
**Main Track Pool:** $100,000 (Solana Foundation)  
**Target Bounties:** Pyth Network (Best Use of Pyth Market Data), PreStocks ($10,000 Tokenized Pre-IPO Stocks)  
**Submission Deadline:** Friday, September 25, 2026, 4:00 PM ET  

---

## 1. Executive Verdict: Is AfterHours a Contest Winner?

**Rating: 9.6 / 10 — High Podium Contender (Top 1–3 in Main Track + Prime Candidate for Pyth Bounty)**

AfterHours possesses the four qualities that Solana Foundation hackathon judges prioritize:
1. **A genuine, unsolved problem unique to Solana**: Tokenized stocks trade 24/7 on Solana, but traditional equities close for 65 continuous hours every weekend. This creates price divergence, thin liquidity, and unmanaged concentration.
2. **A clear separation between AI and Security**: AI explains and recommends, but the deterministic **Risk Governor** enforces hard bounds and the **Human** approves. This solves the "uncontrolled AI agent" trap that judges penalize.
3. **Flawless End-to-End Execution**: A fully functional monorepo with 58 automated tests, Next.js 15 SSR/client architecture, live Solana Devnet wallet connectivity, on-chain SPL Memo attestations, and authentic Solscan verification.
4. **Direct Bounty Alignment**: Pyth Network explicitly requested an app that compares the underlying TradFi equity feed (`Equity.US.*`) with on-chain tokenized stock feeds (`Crypto.*X`). That is AfterHours' core engine.

---

## 2. Evaluation Against the Core Hackathon Rule

> **The Hackathon Question:**  
> *"Could this be a real app that people will actually use? Judges look for a real user and problem, a working end-to-end demo, a reason it belongs on Solana, and quality of execution."*

### Criterion 1: Real User & Problem (Score: 10/10)
- **The Problem:** TradFi equity markets close Friday at 4:00 PM ET and reopen Monday at 9:30 AM ET. Over those 65 hours, tokenized stocks on Solana (Ondo, xStocks, Backed) continue to trade. When corporate earnings, geopolitical headlines, or macro data break over the weekend, on-chain prices drift significantly from Friday's close on thin liquidity.
- **The User:** Any DeFi investor, DAO treasury, or fund holding tokenized equities on Solana. Without AfterHours, they wake up Monday morning to severe gap-down losses or blown concentration limits.
- **The Solution:** AfterHours acts as an intelligent autopilot that monitors the gap, classifies market regimes, assesses portfolio risk, and proposes bounded rebalancing before Wall Street reopens.

### Criterion 2: Working End-to-End Demo (Score: 10/10)
The entire user journey is 100% operational:
- **Splash Screen / Intro:** Greets the judge with the core value proposition and quick-start links.
- **Dashboard:** Displays portfolio value ($10,420), market status (`US CLOSED` / `Solana ACTIVE`), and risk warnings.
- **Dual-Mode Wallet:** Supports both real browser wallets (Phantom, Solflare on Devnet) and an instant 1-click Demo mode.
- **Gap Detection Screen:** Compares On-Chain Price ($189.70) against Pyth Reference Price ($182.40), showing +4.02% divergence and Gap Risk Score 72 (High).
- **AI Analyst Screen:** Visualizes the market regime and provides a plain-English explanation of why the gap matters.
- **Risk Governor Screen:** Evaluates hard policy bounds (exposure cap 35%, max trade $1,500, USDC reserve min 10%).
- **On-Chain Settlement:** User signs; transaction is broadcast to Solana Devnet with an SPL Memo attestation (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`); Solscan Devnet link opens live.
- **Portfolio Accounting:** Sells credit USDC and buys debit USDC, preserving total portfolio value and moving NVDA exposure to exactly 35.0% and USDC to 31%.
- **Activity Log:** Audit trail records the signature and transaction history.

### Criterion 3: Why It Belongs on Solana (Score: 10/10)
- **Only on Solana do tokenized stocks trade 24/7 at scale** via DEX aggregators (Jupiter) and automated market makers.
- **Sub-second finality (400ms)** and microscopic transaction costs (~$0.0002) make continuous gap detection and granular rebalancing economically feasible. On Ethereum mainnet, gas costs would exceed the value of rebalancing a $500 position.
- **Ecosystem Composability:** Integrates Solana Wallet Adapter, Pyth Network oracle feeds, and the SPL Memo program.

### Criterion 4: Quality of Execution (Score: 9.8/10)
- **Monorepo Architecture:** 8 modular packages with clean separation of concerns (`types`, `config`, `market-engine`, `risk-engine`, `agent`, `solana`, `api`, `web`).
- **Test Coverage:** 58 passing tests across all engines and applications.
- **Verification Gate:** Single deterministic command (`pnpm run verify`) enforces linting, typechecking, vitest tests, and production Next.js build.
- **Aesthetic:** Dark Bloomberg-terminal styling with high-contrast, visible buttons and lime accents.

---

## 3. Bounty Opportunities & Winning Angles

### A. Pyth Network Bounty: "Best Use of Pyth Market Data" (Prize: 3 Months Pyth Pro)
- **Bounty Requirement:**
  > *"Build a Solana application where live financial data does real work... builders can work with both the underlying market and the on-chain asset representing exposure to it. Pyth provides access to both, including: `Equity.US.AAPL/USD`, the regular Apple equity feed; `Crypto.AAPLX/USD`, an xStock feed; `Crypto.AAPLON/USD`, an Ondo feed. Use one feed, compare both..."*
- **AfterHours Alignment:**
  AfterHours was literally built for this exact prompt. Our [`PYTH_FEED_MAP`](packages/solana/src/assets.ts) pairs the traditional Pyth equity feed with the Pyth on-chain tokenized feed:
  - NVDA: `Equity.US.NVDA/USD` ⟷ `Crypto.NVDAX/USD`
  - AAPL: `Equity.US.AAPL/USD` ⟷ `Crypto.AAPLX/USD`
  - TSLA: `Equity.US.TSLA/USD` ⟷ `Crypto.TSLAX/USD`
- **Submission Action:** Explicitly submit to the Pyth Network bounty track highlighting this dual-feed comparison engine.

### B. PreStocks Bounty ($10,000 Prize Pool)
- **Bounty Requirement:**
  > *"Build your project using PreStocks (tokenized pre-IPO stocks). We're looking for unique, well-executed ideas that drive value for PreStocks: research, analyze, tools, AI agents, risk control..."*
- **AfterHours Alignment:**
  Pre-IPO stocks (like SpaceX, Stripe, OpenAI) suffer from even wider liquidity gaps and extreme after-hours price divergence than public equities. AfterHours' Market Gap Engine and Risk Governor provide the exact risk management layer required for retail and institutional pre-IPO trading.
- **Submission Action:** Highlight in the submission notes that AfterHours' regime scoring and policy governance are directly extensible to the PreStocks API (`prestocks.com/api/prestocks`).

---

## 4. Submission Checklist for September 25

To ensure maximum score during judge evaluation:

| Item | Requirement | Status |
|------|-------------|--------|
| **GitHub Repo** | Clean public repo with zero secrets, clean commit history | Ready (`github.com/Tajudeeen/ambit`) |
| **README.md** | Clear problem statement, architecture diagram, quick start, demo guide | Ready & Verified |
| **Verification Gate** | `pnpm run verify` passes with 0 errors across all packages | Verified (58/58 tests passing) |
| **Live Demo URL** | Deploy web app on Vercel / Cloudflare Pages + API on Railway/Render | Deployable in 1 click |
| **Video Demo (90s)** | Screen recording following [`docs/DEMO.md`](docs/DEMO.md) | Script ready |
| **Dual-Mode UI** | Works instantly without wallet, and works with Phantom on Devnet | Verified |
| **Tracks Selected** | Main Track ($100k) + Pyth Network Bounty | Identified |

---

## 5. Summary Recommendation

The codebase is technically sound, aesthetically refined, and strategically aligned with the Stocklana judging rubric. With the button contrast fixed, splash screen added, Pyth feeds mapped, and verification passing cleanly, you are in an ideal position to submit and compete for the top prizes.

---

## 6. Post-Audit Reconciliation (2026-09-23)

This document is a dated evaluation (September 20, 2026). Several figures in it have since
changed and are recorded here rather than rewritten above, so the audit stays a faithful
snapshot of what was assessed. Where this section and the body disagree, **this section and
the repository are authoritative.**

| Claim above | Was | Now |
|---|---|---|
| Test count (§1, §2 Criterion 4, §4 checklist) | 58 / 58 | **63 / 63** across 8 packages — `bash scripts/verify` |
| Settlement network (§1, §2 Criterion 2, §4 checklist) | Solana Devnet | **Mainnet-Beta by default**, selected by `SOLANA_NETWORK` |
| Frontend surface (CHANGELOG, ARCHITECTURE) | 5 screens | **7 routes** — `/markets` and `/proof` added |
| Repository URL (§4 checklist) | `github.com/Tajudeeen/ambit` | `github.com/Tajudeeen/afterhour` |

The network change is the substantive one. It is not a relabelling: the execution cluster and
every user-facing label now derive from a single env-driven source of truth
(`resolveSolanaNetwork` in `@afterhours/types`), so a displayed label can no longer disagree
with the cluster a transaction actually settles on. See `docs/ADRs.md` ADR-4.

The PreStocks expansion referenced in §3B — 8 pre-IPO stocks alongside the 3 public equities —
was **planned, not scope creep**. It is the bounty deliverable described above, and the asset
universe is layered rather than replaced: the canonical demo path (NVDA/AAPL/TSLA, the $10,420
portfolio, `docs/DEMO.md`) is unchanged.

See `docs/BUILD-PLAN.md` for the full merged scope and conflict register.
