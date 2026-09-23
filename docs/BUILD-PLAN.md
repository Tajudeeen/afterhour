# BUILD-PLAN.md — Merged plan of record

**Status:** Reconciles the three divergent plan sources in this repo. Written 2026-09-23.
**Why this exists:** `docs/ARCHITECTURE.md`, `TASKS.md`, and `README.md` describe three
different products. No single one is authoritative, so "is X in the build plan?" had no
answer. This document is that answer.

Before this file, the repo's plan of record was ambiguous:

| Source | Written | Describes |
|---|---|---|
| `docs/PRODUCT.md` + `docs/ARCHITECTURE.md` + `docs/RISK-MODEL.md` | 2026-08-29 | 3 public equities (NVDA/AAPL/TSLA), 5 screens |
| `TASKS.md` | 2026-09-20 | Same as above, as milestones D0–D5 |
| `README.md` | 2026-09-20 | 8 pre-IPO stocks via PreStocks + Pyth, 7 routes |
| `docs/AUDIT.md` + `docs/STOCKLANA_CONTEST_AUDIT.md` | 2026-09-20 | Contest strategy; assumes 3 public equities, recommends extending to PreStocks |

---

## 1. What all four sources agree on (no dispute)

These are canonical. No source contradicts them.

- **The thesis:** TradFi equities close ~65 hours over the weekend; tokenized equities on
  Solana trade 24/7. Divergence in that window is the product's reason to exist.
- **The architecture:** `AI interprets → Governor enforces → human approves → Solana settles.`
  The AI Analyst is advisory and can never sign or move funds.
- **The Risk Governor policy** (identical in `RISK-MODEL.md`, `ADRs.md` ADR-2, README §4,
  and `packages/risk-engine/src/policy.ts`):

  | Constraint | Limit |
  |---|---|
  | `MAX_SINGLE_ASSET` | 35% |
  | `MAX_TRADE` | $1,500 |
  | `MIN_USDC_RESERVE` | 10% |
  | `MAX_DAILY_DRAWDOWN` | 3% |
  | `REQUIRE_USER_APPROVAL` | true |

- **The monorepo shape:** 7 packages (`types`, `config`, `market-engine`, `risk-engine`,
  `agent`, `solana`, `db`) + 2 apps (`api`, `web`).
- **Gap formula:** `gap = (onchain_price - reference_price) / reference_price`.
- **Verification gate:** `pnpm run verify` / `bash scripts/verify` — lint → typecheck → test → web build.
- **The demo portfolio:** $10,420, with the $1,150 NVDA sell → 35% exposure / 31% USDC.

---

## 2. The core conflict: asset universe

This is the one that matters. It is not cosmetic — it changes what the product is.

| | Public equities | Pre-IPO equities |
|---|---|---|
| Source | PRODUCT.md, ARCHITECTURE.md, RISK-MODEL.md, TASKS.md, both audits | README.md |
| Assets | NVDA, AAPL, TSLA | ANTHROPIC, SPACEX, OPENAI, ANDURIL, NEURALINK, FIGUREAI, KALSHI, POLYMARKET |
| Reference price | Last official close | PreStocks fair-value mark |
| Feed | Pyth `Equity.US.*` | PreStocks API + Pyth |

**The code implements both.** `packages/solana/src/assets.ts` still carries
`SUPPORTED_STOCKS` (NVDA/AAPL/TSLA), while `apps/api/src/index.ts` branches on
`isPreStocks` and serves the 8 pre-IPO symbols. The repository is mid-migration.

**Resolution — these are not actually competing.** `docs/STOCKLANA_CONTEST_AUDIT.md` §3
names the two target bounties: **Pyth Network** (*"compare the underlying TradFi equity
feed with the on-chain tokenized feed"*) and **PreStocks** (*$10,000, tokenized pre-IPO
stocks*). It then states §3.B:

> "AfterHours' regime scoring and policy governance are directly extensible to the
> PreStocks API (`prestocks.com/api/prestocks`)."

So the PreStocks direction is **sanctioned by the contest plan** — the README is not
off-plan, it is the execution of a recommendation that was never back-ported into
`PRODUCT.md`/`ARCHITECTURE.md`. The merge is therefore additive, not either/or:

- **Public equities (NVDA/AAPL/TSLA)** remain the canonical demo path. Every scripted
  artifact — `docs/DEMO.md`, both audits, the $10,420 portfolio, the +4.02% gap — is
  built on it. Do not disturb it.
- **Pre-IPO equities (8 symbols)** are the bounty-aligned surface (`/markets`).
- Both are legitimate. Neither is a deletion candidate.

---

## 3. Conflict register and resolutions

| # | Conflict | Sources | Resolution |
|---|---|---|---|
| C1 | **Screen count** — 5 vs 7 routes | ARCHITECTURE.md (`/`,`/assets/:symbol`,`/analysis`,`/action`,`/activity`) vs README (`+ /markets`, `+ /proof`) | **7 is correct.** README is newer and `/markets` is required by the PreStocks bounty. `ARCHITECTURE.md` §Web is stale — update it. |
| C2 | **Asset universe** — 3 vs 8 | see §2 | **Both, layered.** See §2. |
| C3 | **Network** — Devnet vs Mainnet-Beta | ADR-3 + TASKS.md D4 say Devnet; `SolanaWalletProvider.tsx:13-15` defaults **Mainnet-Beta**; `.env.example` uses a mainnet RPC; `ExecuteButton` prints "Solana Mainnet-Beta"; every Solscan link and the `/proof` copy say Devnet | **Unresolved — owner decision.** See §5. Do not change unilaterally. |
| C4 | **Design system** | ADR-0: "dark theme, lime accents, Georgia serif is preserved". Commit `ff8a97a` ("adopt Sluice UI design system") rewrote `globals.css` (687 lines) and commits `b0f6f2c`/`2ff6cbb` added a light mode | **Live divergence.** ADR-0 is contradicted by shipped code. Either write a superseding ADR or revert. Not a deletion question. |
| C5 | **Test count** | README "60/60", `TASKS.md` "57/57", contest audit "58/58" | **Determine by running `scripts/verify`.** Per `AGENTS.md` §5, do not ask a model what a script can check. |
| C6 | **README self-contradiction** | README §5 heading "Solana mainnet Settlement" but body says "on Solana Devnet"; §Receipts says Devnet | Fold into C3. |

---

## 4. Canonical scope (merged)

**In scope — build and keep:**

- 7 packages, 2 apps, as listed in §1.
- 7 web routes: `/`, `/assets/[symbol]`, `/assets/[symbol]/analysis`,
  `/assets/[symbol]/action`, `/activity`, `/markets`, `/proof`.
- Risk Governor policy as in §1. Both asset universes as in §2.
- Dual-mode wallet: real browser wallet **and** 1-click demo fallback (ADR-3).
- SPL Memo attestation with Solscan links.
- The doc set that supports the 2026-09-25 submission: `ADRs.md`, `ARCHITECTURE.md`,
  `PRODUCT.md`, `RISK-MODEL.md`, `SECURITY.md`, `DEMO.md`, `AUDIT.md`,
  `STOCKLANA_CONTEST_AUDIT.md`, `README.md`, `TASKS.md`, `CHANGELOG.md`.

**Out of scope — explicitly cut** (`PRODUCT.md` §"Not built", `RISK-MODEL.md`
§"What we do NOT build", `TASKS.md` §"Out of scope"). Do not build these:

social feed · copy trading · multiple AI agents · DAO · token/NFT · full brokerage ·
mobile app · 50-stock universe · autonomous trading · backtesting · elaborate charts ·
VaR models · options pricing · Monte Carlo · correlation matrices · risk parity ·
automated rebalancing

---

## 5. Open decision: network (C3)

Recorded here rather than resolved silently, per `AGENTS.md` ("if a request conflicts with
`DECISIONS.md`, stop and flag it").

The wallet adapter defaults to **Mainnet-Beta**, but the SPL Memo attestation flow and
every explorer link are built for **Devnet**. These cannot both be true — as written, the
app connects to mainnet and then labels the result with a devnet explorer URL.

Remaining owner decision: which network the submission actually settles on. Whatever is
chosen, the correct fix is to derive the cluster *and* the UI labels from one env var
(`NEXT_PUBLIC_SOLANA_NETWORK`) so a label can never disagree with where the transaction
actually landed. Hardcoding "mainnet" into the copy while transactions still settle on
devnet would make the submission claim an on-chain fact that is not true.

Note this touches ADR-3, a recorded decision. Changing it requires a new ADR entry.

---

## 6. Off-plan inventory (removal list)

Items present in the repo that **no** plan source calls for.

**Removed (2026-09-23):**

| Item | Why it is off-plan |
|---|---|
| `({t` | 0-byte junk file at repo root. Tracked in git. Matches no plan. |
| `deploy/.env.example` | Pre-pivot Ambit/BSC config: `POSTGRES_USER=ambit`, `BSC_RPC_URL`, `ERC8004_*` registry addresses, `AMBIT_HIRE_TOKEN`, `AMBIT_RELEASE_ID`. ADR-0 records the BSC stack as fully removed. `docker-compose.yml` reads the root `.env`, not this file, so nothing depends on it. |
| `process.env.AMBIT_RELEASE_ID` in `apps/api/src/index.ts` | Same Ambit leftover. Survived ADR-0's removal. |

**Retained after review — previously suspected, now cleared:**

| Item | Why it stays |
|---|---|
| `apps/web/app/markets/` | Required by the PreStocks bounty. See C1. |
| `apps/web/app/proof/` | Required by the Pyth/verification story. See C1. |
| `docs/AUDIT.md` | **Not stale.** The current security audit for AfterHours (2026-09-20), with a P0 fix list. `CHANGELOG.md` records that a *different*, BSC-era `AUDIT.md` was deleted — this is its replacement. |
| `docs/STOCKLANA_CONTEST_AUDIT.md` | **Not stale.** Live submission checklist with the deadline and bounty targets. |
| `docs/DEMO.md` | **Not stale.** The 90-second video script, referenced by both audits. |
| `docs/RISK-MODEL.md` | Core risk documentation; matches `risk-engine/src/policy.ts`. |
| `components/SiteFooter.tsx`, `NavigationHeader.tsx`, `SplashScreen.tsx`, `ThemeToggle.tsx`, `RiskSimulator.tsx` | Not named in any plan, but not contradicted either. Removing `NavigationHeader` would break navigation to all 7 routes. No gain, real risk, 2 days from submission. |
| `.kilo/worktrees/` | **Not project content.** Another agent tool's live worktree system, excluded via `.git/info/exclude`. Not touched. |

---

## 7. Read order

`AGENTS.md` points at `../deeen_plans/` for the standing manual. That folder is at
`~/Desktop/Deeen_Plans`, not inside `hack/`. Its `prd.md`, `setup.md`, and `design.md` are
the generic `web3-senior-engineer-auditor` skill templates — they are **not** AfterHours'
plan and should not be read as one.

This file should be read after `PROJECT`/`PRODUCT` and before `TASKS.md`. Where this file
and a plan source disagree, this file wins, and the source doc should be corrected.
