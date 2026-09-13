# Demo Script

**Target length:** 90 seconds.

## Script

### 0:00 — Opening

> "U.S. stock markets close. Solana doesn't."

Show: Dashboard with market status = "US CLOSED" and risk score.

### 0:10 — The problem

> "That creates a new problem. Tokenized stocks can continue trading while the
> underlying market is asleep."

Show: NVDA asset card with +4.02% gap badge.

### 0:20 — Gap detection

> "AfterHours detects the divergence."

Show: Asset page — Onchain $189.70 vs Reference $182.40, Gap +4.0%, Market: CLOSED,
Liquidity: LOW, Risk: HIGH.

### 0:30 — AI explains

Show: AI Analysis page — explanation + primary risk + recommendation.

### 0:45 — Risk Governor catches it

Show: Action screen — "NVDA exposure: 46% — Policy limit: 35% — PASS" with the
before/after exposure table.

### 0:55 — User approves

Show: User clicks "Sign & execute" — wallet modal appears.

### 1:00 — Solana transaction

Show: Transaction confirmation — Solana signature, Solscan link.

### 1:10 — Portfolio updates

Show: Dashboard — NVDA exposure now 35%, USDC 31%.

### 1:20 — End

Text overlay: "AfterHours — 24/7 intelligence for tokenized stocks on Solana."

## Rehearsal checklist

- [ ] API starts in <3s
- [ ] Portfolio loads in <2s
- [ ] AI analysis renders in <5s
- [ ] Risk evaluation is instant
- [ ] Execute simulates confirmation in <2s
- [ ] No console errors
- [ ] Mobile layout works
- [ ] All 5 screens reachable via click path
