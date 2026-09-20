# Senior Web3 Audit & Contest-Winning Blueprint: AfterHours

**System:** AfterHours (`@afterhours/*`) — 24/7 Intelligence for Tokenized Stocks on Solana  
**Event / Target:** Stocklana Hackathon (Solana Tokenized Equities / DeFi / AI Agents Track)  
**Auditor:** Senior Web3 Software Engineer & Security Auditor  
**Operating Standard:** `web3-senior-engineer-auditor` (`deeen_plans/SKILL.md` & `deeen_plans/prd.md`)  
**Audit Date:** September 20, 2026  
**Deployment-Readiness Signal:** ⚠️ **WARN** *(Architecture is fundamentally sound; requires fixing 2 high-severity demo-breakers and 1 accounting defect before submitting)*

---

## 1. Executive Summary & Contest Evaluation

AfterHours addresses a massive, emerging market structure shift: **US equity markets trade 37.5 hours per week (closing at 4:00 PM ET on weekdays and remaining dark for 65 continuous hours over weekends), whereas tokenized equities on Solana trade 168 hours per week (24/7).**

When traditional markets sleep, news breaks, earnings release, and crypto-native liquidity trades tokenized equities away from the traditional reference close. This creates:
1. **Divergence gaps** between on-chain trades and the last reference close.
2. **Thin liquidity risks** where low volume can cause price manipulation or sharp slippage.
3. **Portfolio concentration risks** where gap movements can threaten collateral or asset caps.

### The Winning Thesis
The architecture's core design philosophy is its strongest competitive asset:
> **"AI interprets. The Governor enforces. The human approves. Solana executes."**

In hackathons, judges are fatigued by "autonomous AI trading agents" that hold private keys and hallucinate transactions. By introducing a **deterministic Risk Governor as an immutable policy boundary** (hard exposure caps, max trade limits, USDC reserve floors, and human-in-the-loop signatures), AfterHours establishes institutional credibility.

### What Blocks You From Winning Today
While the architectural design, packages, and styling (Bloomberg terminal aesthetic with lime accents) are exceptional, our code audit uncovered **three critical defects that would cause the live demo to break during judging**:
1. **Frontend Execution 404:** The Action screen's `ExecuteButton` sends a `fetch` request to a relative path (`/api/execute`) on the Next.js server (port 3000) instead of the Hono API server (port 8787). In a live test, clicking "Sign & execute" fails with HTTP 404.
2. **"Disappearing Funds" Accounting Bug:** In `apps/api/src/index.ts:updatePortfolio`, when a user sells $1,150 of NVDA, the code decrements the NVDA position but fails to credit USDC. The portfolio drops from $10,420 to $9,270 into thin air, and the resulting asset weights contradict what the UI and pitch deck promise.
3. **Cross-Screen Random Price Jitter:** Every page refresh recalculates prices using unseeded `Math.random()`. Navigating from Dashboard (+4.0% gap) to Asset Page (-1.5% gap) to Analysis Page (+5.8% gap) shows contradictory data to judges.

Fixing these three issues turns this project into an airtight, institutional-grade submission.

---

## 2. Trust Boundary Map

```text
[ Browser Client / Next.js Web UI (:3000) ]
         │
         │ (HTTP REST / JSON) ── Boundary 1: Untrusted Client Input
         ▼
[ Hono REST API Layer (:8787) ]
         │
         ├──────────────────────────────────────────────┐
         ▼                                              ▼
[ Market Gap Engine ]                           [ AI Analyst (LLM) ]
  • Deterministic gap %                           • Structured JSON prompt
  • Liquidity & Volatility bands                  • Advisory interpretation only
  • Regime Memory tracking                        • CANNOT execute or sign
         │                                              │
         └──────────────────────┬───────────────────────┘
                                ▼
                      [ Risk Governor ] ── Boundary 2: Security Gate
                        • Max 35% single asset exposure
                        • Max $1,500 trade size
                        • Min 10% USDC reserve
                        • Max 3% daily drawdown
                        • Enforced deterministically (PASS / BLOCK)
                                │
                        (PASS / BLOCK)
                                │
                                ▼
                      [ Solana Wallet / User ] ── Boundary 3: Human Signer
                        • Requires explicit user signature
                                │
                                ▼
                      [ Solana RPC & Jupiter ] ── Boundary 4: Settlement
                        • SPL Token balances
                        • Swap execution & confirmation
```

---

## 3. Risk Register

| Finding ID | Severity | File / Component | Title | Status |
| :--- | :---: | :--- | :--- | :---: |
| **FINDING-01** | **HIGH** | `apps/web/.../action/page.tsx:203` | Execute button calls relative Next.js path instead of Hono API service (HTTP 404) | Open |
| **FINDING-02** | **HIGH** | `apps/api/src/index.ts:372` | Portfolio simulation drops cash on sell without crediting USDC ("disappearing funds") | Open |
| **FINDING-03** | **MED** | `apps/web/.../action/page.tsx:1-7` | Client Component declared as async function creates React 19 / Next.js warning | Open |
| **FINDING-04** | **MED** | `apps/api/src/index.ts:179,312` | Unseeded `Math.random()` price calculations cause cross-screen UI state jitter | Open |
| **FINDING-05** | **MED** | `scripts/verify:22-24` | Verification script swallows web build failures with `\|\|` error masking | Open |
| **FINDING-06** | **MED** | `packages/agent/src/analyze.ts:173` | Hardcoded \$10,000 portfolio multiplier in agent fallback trade sizing | Open |
| **FINDING-07** | **LOW** | `apps/web/package.json` | Solana wallet adapter dependencies installed but UI button is unbonded static mock | Open |
| **FINDING-08** | **LOW** | `packages/agent/test/analyze.test.ts` | Test asserts mock provider output instead of testing fallback logic | Open |
| **FINDING-09** | **INFO** | `packages/db/prisma/schema.prisma` | Full schema defined but decoupled from active API runtime | Documented |

---

## 4. Code-Level Audit Checklist & Findings

### ⚠️ FINDING-01 · HIGH
> **File:** `apps/web/app/assets/[symbol]/action/page.tsx:203`  
> **Title:** Execute button calls relative Next.js path instead of Hono API service (HTTP 404)  
> **Path:** `apps/web/app/assets/[symbol]/action/page.tsx` line 203:
> ```tsx
> const res = await fetch('/api/execute', {
>   method: 'POST',
>   headers: { 'Content-Type': 'application/json' },
>   body: JSON.stringify({ ... }),
> });
> ```
> **Impact:** The Next.js frontend runs on `:3000`, while the API runs on `:8787`. Next.js has no `app/api/execute` route. In the browser, clicking "Sign & execute" sends a POST request to `http://localhost:3000/api/execute` which immediately yields **HTTP 404 Not Found**. The button displays red error text: `"HTTP 404"`. The single most important action in the entire demo fails in the browser.  
> **Fix:** Call `executeTrade(...)` from `@/lib/api` (which correctly prefixes `${apiUrl()}/api/execute`), or replace the relative URL with `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8787'`.

---

### ⚠️ FINDING-02 · HIGH
> **File:** `apps/api/src/index.ts:372-384`  
> **Title:** Portfolio simulation drops cash on sell without crediting USDC  
> **Path:** In `updatePortfolio`:
> ```ts
> function updatePortfolio(portfolio: Portfolio, trade: { action: 'buy' | 'sell'; asset: string; amountUsd: number }): void {
>   if (trade.action === 'sell') {
>     const holding = portfolio.holdings.find((h) => h.symbol === trade.asset);
>     if (holding) holding.valueUsd = Math.max(0, holding.valueUsd - trade.amountUsd);
>   }
>   const total = portfolio.holdings.reduce((sum, h) => sum + h.valueUsd, 0);
>   for (const h of portfolio.holdings) {
>     h.weightPercent = total > 0 ? (h.valueUsd / total) * 100 : 0;
>   }
>   portfolio.totalValueUsd = total;
>   portfolio.timestamp = new Date().toISOString();
> }
> ```
> **Impact:** When a user executes the recommended sell of $1,150 NVDA:
> - NVDA value drops from $4,800 to $3,650.
> - USDC remains unchanged at $2,020 (the $1,150 sale proceeds vanish).
> - Total portfolio value decreases from $10,420 to $9,270.
> - NVDA weight becomes `3650 / 9270 = 39.37%` (failing to reach the 35% target).
> - USDC weight becomes `2020 / 9270 = 21.79%` instead of the 31% promised in `README.md` and `docs/DEMO.md`.
> **Fix:** 
> ```ts
> if (trade.action === 'sell') {
>   const holding = portfolio.holdings.find((h) => h.symbol === trade.asset);
>   const usdc = portfolio.holdings.find((h) => h.symbol === 'USDC');
>   if (holding) holding.valueUsd = Math.max(0, holding.valueUsd - trade.amountUsd);
>   if (usdc) usdc.valueUsd += trade.amountUsd;
> } else if (trade.action === 'buy') {
>   const holding = portfolio.holdings.find((h) => h.symbol === trade.asset);
>   const usdc = portfolio.holdings.find((h) => h.symbol === 'USDC');
>   if (holding) holding.valueUsd += trade.amountUsd;
>   if (usdc) usdc.valueUsd = Math.max(0, usdc.valueUsd - trade.amountUsd);
> }
> ```

---

### ⚠️ FINDING-03 · MED
> **File:** `apps/web/app/assets/[symbol]/action/page.tsx:1-7`  
> **Title:** Client Component declared as async function creates React 19 / Next.js warning  
> **Path:** `page.tsx` starts with `'use client'`, yet exports `export default async function ActionPage(...)`.  
> **Impact:** In Next.js 15 and React 19, async function components are reserved for Server Components. Declaring an async Client Component triggers runtime component lifecycle warnings.  
> **Fix:** Structure `ActionPage` as a Server Component that awaits `getAssetRisk(upperSymbol)` and passes the resolved data down to a dedicated client component (e.g. `<ActionView />`).

---

### ⚠️ FINDING-04 · MED
> **File:** `apps/api/src/index.ts:179, 312`  
> **Title:** Unseeded `Math.random()` price calculations cause cross-screen UI state jitter  
> **Path:**
> ```ts
> const onchainPrice = stock.referencePrice * (1 + (Math.random() * 8 - 2) / 100);
> ```
> **Impact:** Every time a route is hit, `Math.random()` recalculates prices. A judge clicking from Dashboard (showing NVDA +4.02%) to Asset Page might suddenly see NVDA at -1.5%, and Analysis Page might show +5.8%. This price jitter damages credibility.  
> **Fix:** Cache or seed the price snapshot per symbol for 60 seconds (or tie it to the hour/minute timestamp) so the entire flow sees identical prices.

---

### ⚠️ FINDING-05 · MED
> **File:** `scripts/verify:22-24`  
> **Title:** Verification script swallows web build failures with `||` error masking  
> **Path:**
> ```bash
> pnpm --filter @afterhours/web build 2>&1 || {
>   echo "⚠ web build had warnings, but continuing"
> }
> ```
> **Impact:** Masks real Next.js build errors, allowing invalid code to be committed and falsely reporting that the verification gate passed.  
> **Fix:** Remove the fallback. Require `pnpm --filter @afterhours/web build` to exit cleanly with code 0.

---

### ⚠️ FINDING-06 · MED
> **File:** `packages/agent/src/analyze.ts:173`  
> **Title:** Hardcoded \$10,000 portfolio multiplier in agent fallback trade sizing  
> **Path:**
> ```ts
> amountUsd = Math.min(
>   policy.maxTradeUsd,
>   Math.max(0, (exposure - maxExposure) / 100 * 10000),
> );
> ```
> **Impact:** The formula assumes every portfolio is worth \$10,000. For a \$2,000 or \$100,000 portfolio, the rebalancing recommendation generates incorrect dollar amounts.  
> **Fix:** Include `portfolioTotalValueUsd` in `AIAnalysisContext` and compute `(exposure - maxExposure) / 100 * context.portfolioTotalValueUsd`.

---

### ⚠️ FINDING-07 · LOW
> **File:** `apps/web/package.json` & `apps/web/app/page.tsx`  
> **Title:** Solana wallet adapter dependencies installed but UI button is unbonded static mock  
> **Path:** `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, and `@solana/web3.js` are in `package.json`, but `page.tsx` renders a plain button with no event handler:
> ```tsx
> <button className="wallet-connect">
>   <span className="dot" /> Connect Solana wallet
> </button>
> <span className="wallet-connected">Connected as demo</span>
> ```
> **Impact:** Solana hackathon judges inspect wallet connectivity closely. If the wallet button cannot connect a Phantom or Solflare wallet, judges may classify the project as a "mockup" rather than functional Web3 infrastructure.  
> **Fix:** Add a real `WalletMultiButton` or a simple Phantom wallet connect provider alongside the "demo mode" fallback.

---

## 5. The Contest-Winning Blueprint (Stocklana Hackathon)

To win 1st place in the Stocklana Hackathon, AfterHours needs to excel across three judging criteria: **Narrative, Visual Experience, and On-Chain Reality**.

### Pillar 1: The "Dual Mode" UI (Demo Mode + Real Phantom Connect)
- **Why:** In video demos, you need 100% deterministic, instant flows. In live judge testing, judges love connecting their own Phantom/Solflare wallet.
- **Action:**
  - Keep the **Demo Portfolio ($10,420 across NVDA/AAPL/TSLA/USDC)** as the default one-click experience.
  - Implement `@solana/wallet-adapter-react` in `apps/web/app/layout.tsx`. If a user connects their Phantom wallet on Solana Devnet, read their actual SOL/USDC balance or simulate a devnet token account.
  - When the user clicks "Sign & execute", prompt a real wallet signature request via `wallet.signMessage` or a 0-SOL memo transaction on Devnet. This gives judges a **real Solscan transaction link** they can click and verify on `solscan.io/tx/...` on Devnet.

### Pillar 2: Perfect the 90-Second Demo Storyboard
Judges spend an average of 2-3 minutes reviewing a submission. Your video and live demo should follow this exact sequence:

1. **The Hook (0:00 - 0:15): The 65-Hour TradFi Blindspot**
   - *"TradFi equity markets close Friday at 4 PM and reopen Monday at 9:30 AM. That's 65 continuous hours where Wall Street is closed, but tokenized stocks on Solana trade 24/7."*
   - Show: Dashboard with `Market Status: CLOSED` and `Solana: ACTIVE (24/7)`.

2. **The Discovery (0:15 - 0:35): Gap Detection & Regime Memory**
   - *"NVDA reports earnings over the weekend; on Solana, NVDA trades up +4.02% to $189.70 while the official close is $182.40. Liquidity is thin ($18.5k), driving Gap Risk Score to 72 (High)."*
   - Show: Asset page displaying the split view: Onchain Price vs. Reference Price, Gap Risk Score Pill, and Regime Memory State.

3. **The Intelligence (0:35 - 0:50): AI Analyst Context**
   - *"The AI Analyst doesn't guess prices. It interprets the deterministic regime: high concentration (46% NVDA) + thin weekend liquidity = severe Monday open gap risk."*
   - Show: AI Analysis screen with structured regime grid, explanation, and confidence score.

4. **The Gate (0:50 - 1:10): The Risk Governor**
   - *"The AI proposes a rebalance. But AI never touches user funds directly. The deterministic Risk Governor checks hard policy: Max single-asset exposure is 35%. NVDA is 46%. It calculates an exact $1,150 sell to bring exposure to 34.5%."*
   - Show: Policy Check table comparing Before vs. After exposure, trade size, and USDC reserve.

5. **The Execution (1:10 - 1:30): User Approval & Solana Settlement**
   - *"The user signs in their wallet. Solana confirms in 400ms. The portfolio updates: NVDA exposure drops to 35%, USDC reserve grows to 31%. Risk mitigated before Wall Street even wakes up."*
   - Show: Wallet confirmation, live Solscan link, and updated Dashboard.

---

## 6. Priority Action Plan

### Stage 1: P0 Fixes (Must complete before any recording or judging)
1. **Fix `apps/web/app/assets/[symbol]/action/page.tsx`:**
   - Change `fetch('/api/execute')` to use `executeTrade` from `@/lib/api`.
   - Separate the page into a Server Component page and a Client Component view.
2. **Fix `apps/api/src/index.ts:updatePortfolio`:**
   - Add USDC credit on sell, debit on buy. Ensure total portfolio balance remains constant.
3. **Stabilize Price Feed in `apps/api/src/index.ts`:**
   - Memoize the price snapshot so repeated requests across Dashboard, Asset, Analysis, and Action screens have identical numbers.
4. **Fix `scripts/verify`:**
   - Remove `2>&1 || { ... }` so verification is honest and fails if the build fails.

### Stage 2: P1 Polish (Elevates project from good to winning)
1. **Connect Real Phantom Wallet:**
   - Wrap `apps/web` with `WalletProvider` and `WalletModalProvider`.
   - Add a functional "Connect Wallet" button in the top bar.
2. **Real Devnet Attestation / Memo:**
   - When executing, optionally emit a real Solana Devnet transaction (e.g. Memo instruction containing the Risk Governor pass verdict) so the Solscan link points to a live transaction.
3. **Tighten Agent Fallback:**
   - Add `portfolioTotalValueUsd` to `AIAnalysisContext` and fix the hardcoded `10000` multiplier in `analyze.ts`.
