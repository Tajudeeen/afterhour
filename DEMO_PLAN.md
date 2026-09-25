# AfterHours Demo Plan

**Theme**: "AfterHours gives tokenized-stock traders 24/7 market intelligence and puts deterministic controls between an AI recommendation and an on-chain transaction."

**Primary Asset Scenario**: SPACEX (Strong discount: On-chain DEX price significantly below PreStocks fair value mark).
*(Fallback: Seeded fallback data in `packages/solana/src/assets.ts` guarantees this divergence if live PreStocks API fails).*

---

## Storyboard (2 Minutes)

### Scene 1: System Entry (0:00 - 0:10)
- **Duration**: 10s
- **UI/Page**: `/` (Dashboard with `?intro=1` if applicable, or base Dashboard)
- **Action**: Load the $10,420 Evaluation Portfolio.
- **Visible**: The user's portfolio holding tokenized stocks, overall risk score, and system status (Solana Active, U.S. Equities Closed).
- **Narrator**: "Traditional equity markets close for 65 hours every weekend. Tokenized stocks trade 24/7. When news breaks on Saturday, on-chain prices drift, and traders need guardrails."
- **Technical Mechanism**: ISR-cached portfolio state fetching combined with market regime tracking.
- **Why it matters**: Establishes the core problem— TradFi is closed, Crypto is open, risk is unmanaged.
- **Do NOT show**: Wallet connect modal if it delays the flow. Just use the evaluation portfolio button.

### Scene 2: Live Market Intelligence (0:10 - 0:25)
- **Duration**: 15s
- **UI/Page**: `/markets`
- **Action**: Scroll to show the PreStocks vs On-chain price comparisons.
- **Visible**: Pyth Network dual-feed logic and PreStocks live API data streaming in.
- **Narrator**: "AfterHours bridges this gap. Our intelligence engine directly compares TradFi fair value against on-chain DEX prices in real-time, using Pyth dual-feeds and the PreStocks API."
- **Technical Mechanism**: Live API polling (`PRESTOCKS_API`) and Pyth network price band feeds.
- **Why it matters**: Proves we are acting on real, live oracle data, not just theoretical models.
- **Do NOT show**: Loading states. Pre-load the page in a tab if network is slow.

### Scene 3: Identifying the Divergence (0:25 - 0:40)
- **Duration**: 15s
- **UI/Page**: `/assets/SPACEX`
- **Action**: Click into the SPACEX asset page.
- **Visible**: The "Discount" gap (e.g., -22.3%). The Route Engine showing Jupiter DEX impact vs PreStocks mark.
- **Narrator**: "Right now, SPACEX tokenized stock is trading at a massive discount on-chain compared to its private market valuation. But trading this gap requires speed and safety. We compare DEX quotes against fair value."
- **Technical Mechanism**: Route comparison engine combining Jupiter DEX API with PreStocks Mark Price.
- **Why it matters**: Demonstrates the immediate financial opportunity.
- **Do NOT show**: Raw JSON or API error states.

### Scene 4: AI Analysis & Recommendation (0:40 - 0:55)
- **Duration**: 15s
- **UI/Page**: `/assets/SPACEX/analysis`
- **Action**: Click "Market analysis →"
- **Visible**: The AI Analyst explanation, primary risk factor, and the specific recommendation (e.g., BUY $1,500).
- **Narrator**: "Our AI Analyst evaluates the divergence and portfolio state, recommending we buy the discount. But an LLM shouldn't have unrestricted access to your wallet."
- **Technical Mechanism**: Agent context generation passing regime data into a prompt, returning structured JSON recommendations.
- **Why it matters**: Shows AI utility but immediately highlights its danger.

### Scene 5: The Deterministic Risk Governor (0:55 - 1:15)
- **Duration**: 20s
- **UI/Page**: `/assets/SPACEX/action`
- **Action**: Click "Review action →". First, show a *rejected* scenario (e.g., if we try to buy too much and hit the 35% cap). Then, show the *passed* scenario for a $1,000 buy. *(Note: If the code only allows passing the current recommendation, highlight the strict policy limits on screen).*
- **Visible**: The Risk Governor grid showing "Exposure now vs Exposure after" and the "Result: PASS/BLOCK" indicator.
- **Narrator**: "This is where the Risk Governor takes over. It is 100% deterministic. If a trade pushes our single-asset exposure over 35% or exceeds $1,500, it hard-blocks the transaction. The AI proposes, but math enforces."
- **Technical Mechanism**: The `packages/risk-engine` fail-closed policy evaluation executing strictly outside the LLM.
- **Why it matters**: The absolute core technical achievement of the demo.

### Scene 6: Human Approval & On-Chain Settlement (1:15 - 1:40)
- **Duration**: 25s
- **UI/Page**: `/assets/SPACEX/action`
- **Action**: Expand the "🔍 Solana Instruction Payload Inspector". Click the "Sign & execute on-chain" button.
- **Visible**: The raw instruction payload, followed by the confirmation UI with the Solscan link.
- **Narrator**: "Finally, we require human approval. By clicking execute, the user signs a bundled transaction. It executes the swap on Jupiter and permanently writes the Risk Governor's approval attestation to the Solana ledger via the SPL Memo program."
- **Technical Mechanism**: `@solana/web3.js` assembling a Jupiter Swap Ix + SPL Memo Ix into a single atomic transaction.
- **Why it matters**: Proves it actually works on a real blockchain, not a web2 database.

### Scene 7: Verifiable Proof (1:40 - 2:00)
- **Duration**: 20s
- **UI/Page**: The resulting Solscan link (briefly), then switch to `/proof`
- **Action**: Open the Solscan link showing the Memo, then tab over to the AfterHours `/proof` page.
- **Visible**: The `AfterHours: BUY $1000 SPACEX | Risk Governor: Passed` memo string on Solscan, followed by the live transparency dashboard.
- **Narrator**: "Here is the on-chain receipt. We've bridged the 65-hour TradFi blackout, captured a market gap, bounded the AI with strict deterministic limits, and cryptographically proven the entire execution on Solana."
- **Technical Mechanism**: Blockchain immutability and transparency.
- **Why it matters**: Closes the loop. Provides concrete proof that the project is real.
- **Do NOT show**: Any pending transaction spinners for too long. If Solana Devnet is slow, edit the wait out of the final video.

---

## THE 90-SECOND DEMO TIMELINE

**0:00 - 0:10 (Dashboard)**: "Traditional equity markets close for 65 hours every weekend. Tokenized stocks trade 24/7. When news breaks on Saturday, on-chain prices drift, and traders need guardrails."

**0:10 - 0:25 (Markets)**: "AfterHours bridges this gap. Our intelligence engine directly compares TradFi fair value against on-chain DEX prices in real-time, using Pyth dual-feeds and the PreStocks API."

**0:25 - 0:40 (Asset Page - SPACEX)**: "Right now, SPACEX tokenized stock is trading at a massive discount on-chain compared to its private market valuation. But trading this gap requires speed and safety."

**0:40 - 0:55 (Analysis)**: "Our AI Analyst evaluates the divergence and portfolio state, recommending we buy the discount. But an LLM shouldn't have unrestricted access to your wallet."

**0:55 - 1:15 (Action/Governor)**: "This is where the Risk Governor takes over. It is 100% deterministic. If a trade pushes our single-asset exposure over 35% or exceeds $1,500, it hard-blocks the transaction. The AI proposes, but math enforces."

**1:15 - 1:30 (Execution)**: "By clicking execute, the user signs a bundled transaction. It executes the swap on Jupiter and permanently writes the Risk Governor's approval attestation to the Solana ledger."

**1:30 - 2:00 (Solscan / Proof)**: "Here is the on-chain receipt. We've bridged the 65-hour TradFi blackout, captured a market gap, bounded the AI with strict deterministic limits, and cryptographically proven the entire execution on Solana."
