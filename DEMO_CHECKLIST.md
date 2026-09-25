# AfterHours Demo Recording Checklist

Complete this checklist *before* hitting record.

## 1. Environment Variables & Services
- [ ] Ensure `.env` is fully populated.
- [ ] If using live AI, ensure `OPENAI_API_KEY` is valid and funded. If not, verify fallback JSON is functioning.
- [ ] If using live Pyth, ensure `PYTH_HERMES_API_KEY` is present. If not, verify seeded fallback data is functioning.
- [ ] Verify both the Next.js frontend (`pnpm dev` in `apps/web`) and the Hono API backend (`pnpm dev` in `apps/api`) are running without errors.

## 2. Wallet & Network Setup
- [ ] Open your Solana Wallet extension (Phantom/Solflare).
- [ ] Ensure the wallet is connected to the correct network (Devnet/Mainnet-Beta) corresponding to your `SOLANA_NETWORK` env var.
- [ ] Ensure the wallet has sufficient SOL for gas fees (and the protocol deposit, if applicable).
- [ ] In the web UI, disconnect and reconnect the wallet to ensure the session is active.

## 3. Data Verification
- [ ] Open `http://localhost:3000/markets`. Verify that the PreStocks data is loading (either live or fallback).
- [ ] Locate `SPACEX` (or your chosen demo asset) and verify it has a meaningful gap (e.g., > 5% discount or premium).

## 4. Browser Setup
- [ ] Use a clean browser profile to hide personal bookmarks and extensions.
- [ ] Pre-open the necessary tabs:
  1. `http://localhost:3000/?intro=1` (Dashboard)
  2. Solscan homepage (ready for the transaction hash)
- [ ] Set browser zoom to 100% or 110% for clear recording.
- [ ] Clear any old console errors in Chrome DevTools to ensure a clean visual environment if the console is shown.

## 5. Rehearsal
- [ ] Click through the exact path defined in `SCREEN_RECORDING_SCRIPT.md` without recording to ensure no unexpected loading states or caching issues occur.
- [ ] Execute a test transaction and verify it appears on Solscan successfully.
