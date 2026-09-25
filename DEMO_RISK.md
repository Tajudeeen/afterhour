# Live Demo Risk & Fallback Mitigation

If executing this demo live on stage or recording in a single take, these are the primary points of failure and how the application handles them.

## 1. PreStocks API Rate Limiting / Timeout
- **Risk**: The live `https://prestocks.com/api/prestocks` endpoint times out or rate limits the IP during the demo, causing the `/markets` page to fail or load infinitely.
- **Fallback**: The application utilizes Next.js Incremental Static Regeneration (ISR) with a 30-second stale-while-revalidate window. If the fetch fails or times out (5000ms limit), it automatically returns `FALLBACK_PRESTOCKS_ASSETS` defined in `apps/web/app/markets/page.tsx`, ensuring the UI renders instantly with realistic gap data (e.g., SpaceX tokenPrice: 118.45 vs markPrice: 152.59).

## 2. OpenAI API Failure / Latency
- **Risk**: Generating the AI Analyst explanation on the `/assets/[symbol]/analysis` page takes 15+ seconds or fails entirely, disrupting the flow.
- **Fallback**: The backend `getAssetRisk` and `getAssetAnalysis` endpoints wrap the LLM call in a `try/catch`. If the API key is missing or the call fails, it instantly returns structured, seeded mock analysis (e.g., "SPACEX is trading 4.0% above its reference price..."). The demo narrator can proceed without interruption.

## 3. Solana Devnet/Mainnet Congestion
- **Risk**: Clicking "Sign & execute on-chain" triggers the wallet, but the Solana network is congested, causing the transaction to hang on "Confirming..." indefinitely.
- **Fallback**: If recording a video, simply cut the waiting time out in post-production. If doing it live, explain: "We've submitted the bundled SPL Memo and Swap instruction to the network. While we wait for finality, let's look at the `/proof` page to see how we verify these transactions."

## 4. Wallet Connection Issues
- **Risk**: The Phantom or Solflare browser extension fails to inject into the `window` object, or the RPC node rejects the connection, making the execute button unclickable.
- **Fallback**: Utilize the "Evaluation Mode" toggle on the dashboard. The application is built to simulate a $10,420 portfolio. If the wallet outright fails to sign, rely on the `/activity` log to show previous successfully attested transactions as proof of functionality.

## 5. Jupiter Route Engine Failure
- **Risk**: Jupiter DEX API fails to find a valid route for the specific tokenized asset pair, preventing the "Best Execution Route" UI from populating.
- **Fallback**: The UI gracefully hides the Route Execution card if `intelligence.routes.length === 0` and proceeds to the AI Analysis and Risk Governor phases, which are the true technical highlights of the project.
