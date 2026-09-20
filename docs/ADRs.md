# ADRs — AfterHours

Architectural Decision Records. One per significant decision. New entries go at the
top; existing entries are never silently overridden.

## 2026-09-20 — ADR-3: Dual-Mode Live Solana Devnet & SPL Memo Attestation

**Status:** Accepted

**Context:** Hackathon judges require verifying authentic Solana ecosystem integration while maintaining a zero-friction, deterministic experience for recorded video demos and judges without funded wallets.

**Decision:**
1. Implemented Solana Wallet Adapter with Devnet configuration supporting standard Solana browser wallets (Phantom, Solflare) alongside a default zero-config simulated Demo portfolio.
2. For on-chain execution, utilized the official Solana SPL Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) to post verifiable, immutable risk governance attestations on Solana Devnet whenever a user wallet signs.
3. Added automatic fallback to simulated demo execution if a connected wallet declines or lacks devnet SOL for gas, preventing test dead-ends.
4. Pointed all explorer links to `solscan.io/tx/<signature>?cluster=devnet`.

**Consequences:** Hackathon judges can either test with real wallets and verify genuine on-chain attestations on Solscan Devnet or test instantaneously via 1-click Demo mode.

## 2026-08-29 — ADR-0: Pivot from Ambit to AfterHours

**Status:** Accepted

**Context:** The repo was previously Ambit — an ERC-8004 agent marketplace on BSC.
The hackathon requires a pivot to AfterHours — 24/7 intelligence for tokenized
stocks on Solana.

**Decision:** Fully replaced the BSC stack with Solana:
- Removed `@ambit/erc8004`, `@ambit/contracts`, `@ambit/core`, and all BSC-specific packages
- Added `@afterhours/solana`, `@afterhours/market-engine`, `@afterhours/risk-engine`, `@afterhours/agent`
- Replaced Solidity contracts with Solana wallet adapter + Jupiter DEX integration
- Replaced BSC token logic with SPL token balance reading

**Consequences:** The entire codebase is rebuilt. No BSC code remains. The
visual identity (dark theme, lime accents, Georgia serif) is preserved.

## 2026-08-29 — ADR-1: Deterministic engine + AI analyst separation

**Status:** Accepted

**Context:** The LLM is powerful but can be unpredictable. Giving it full
authority over portfolio decisions is dangerous.

**Decision:** Strict separation of concerns:
1. Deterministic backend (`market-engine`, `risk-engine`) computes all numbers:
   gap %, volatility, exposure, risk scores, policy limits, trade sizes.
2. AI Analyst (`agent`) receives structured JSON and produces only an explanation
   and a recommendation. It cannot execute.
3. Risk Governor (`risk-engine`) checks the AI's recommendation against hard
   policy constraints. The AI cannot override these.

**Consequences:** The AI is useful (explains, recommends) without being dangerous
(can't violate policy, can't trade without user approval).

## 2026-08-29 — ADR-2: Risk Governor as the security boundary

**Status:** Accepted

**Context:** The core thesis is that on-chain tokenized stocks create information
gaps. But automated gap-trading can be weaponized.

**Decision:** The Risk Governor enforces hard policy limits that the AI cannot
override:
- MAX_SINGLE_ASSET = 35%
- MAX_TRADE = $1,500
- MIN_USDC_RESERVE = 10%
- MAX_DAILY_DRAWDOWN = 3%
- REQUIRE_USER_APPROVAL = true

These are defined in `packages/risk-engine/src/policy.ts` and enforced in
`packages/risk-engine/src/evaluate.ts`. Neither the AI nor the frontend can
change them.

**Consequences:** Users trust the system because they know the AI is bounded.
Judges see the security architecture as a competitive advantage.
