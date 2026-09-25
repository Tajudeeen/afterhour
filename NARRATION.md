# AfterHours: 90-Second Demo Narration

**Style Guide**: Speak naturally, like a builder walking a colleague through a pull request. Do not sound like a marketing pitch. Emphasize the technical boundaries between the AI and the deterministic math.

---

*(0:00 - UI: Dashboard loaded with $10,420 evaluation portfolio)*

"Traditional equity markets close at 4 PM Friday and stay dark for 65 hours. But tokenized stocks on Solana trade 24/7. When real-world news breaks over the weekend, on-chain prices drift wildly from their traditional reference points, creating both massive opportunities and unmanaged risk for retail traders."

*(0:15 - UI: Click over to /markets, scrolling through the Pyth vs PreStocks list)*

"AfterHours bridges this gap. Our intelligence engine constantly polls Pyth Network TradFi feeds and the live PreStocks API, comparing them directly against on-chain DEX prices to find statistical divergence."

*(0:28 - UI: Click into SPACEX asset page, showing the large discount)*

"Right now, we can see SPACEX is trading at a significant discount on-chain compared to its private market fair value. To act on this, we pass the market regime and our current portfolio state to an AI Analyst."

*(0:40 - UI: Click 'Market analysis ->', viewing the AI recommendation)*

"The AI evaluates the liquidity and gap, and recommends a specific buy action to capture the discount. But here's the core of our architecture: an LLM should never have unrestricted execution power."

*(0:52 - UI: Click 'Review action ->', viewing the Risk Governor grid)*

"Before any transaction can be signed, the proposal must pass our Risk Governor. This engine is 100% deterministic math. It strictly enforces a 35% max portfolio concentration and a $1,500 single-trade limit. If the AI recommends a trade that violates these bounds, the transaction is hard-blocked at the API level. The AI proposes; math enforces."

*(1:10 - UI: Expand Solana Instruction Inspector, click "Sign & execute")*

"Once the Governor approves, we require human cryptographic sign-off. We bundle the Jupiter DEX swap with an SPL Memo instruction."

*(1:20 - UI: Confirmation UI appears, click Solscan link)*

"When we execute, that Memo permanently writes the Risk Governor's policy attestation to the Solana ledger alongside the trade."

*(1:25 - UI: Switch to /proof page)*

"We've captured a 24/7 market gap, securely bounded an AI agent, and created an immutable, verifiable receipt of the entire process."
