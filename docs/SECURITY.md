# Security Policy

## Threat model

AfterHours handles:
- Wallet connections (read-only balance reading)
- Trade proposals (AI-generated, user-approved)
- On-chain execution (Solana transactions)
- Portfolio data (user-specific)

## In-scope

- AI Analyst prompt injection (the LLM could produce malicious recommendations)
- Risk Governor bypass (AI overrides policy)
- Front-run detection (gap trading is profitable for insiders)
- Transaction replay
- Wallet signature phishing

## Out-of-scope

- Solana consensus attacks
- RPC provider compromise
- Smart contract bugs in tokenized stock contracts (we don't deploy any)

## Security controls

### 1. Risk Governor as security boundary

The AI can propose. The Governor enforces. The AI cannot override:
- Max single asset exposure
- Max trade size
- Min USDC reserve
- Max daily drawdown

These are hardcoded in the backend, not in the frontend or the AI prompt.

### 2. User approval

`REQUIRE_USER_APPROVAL = true` is the default and cannot be disabled.

### 3. No autonomous trading

The system never executes without a user signature. The AI recommendation is
always advisory.

### 4. No secrets in code

Environment variables are loaded from `.env` (gitignored).

### 5. Transaction simulation

Trades are simulated before sending to the blockchain. The user always sees:
- The exact asset
- The exact amount
- The expected output
- The price impact

## Off-limits

- Do NOT access production wallets or private keys
- Do NOT modify risk policy limits without review
- Do NOT deploy to mainnet without audit
- Do NOT store API keys in code
- Do NOT send real funds in the hackathon demo

## Reporting

Security issues should be documented in `AUDIT.md` (if the project grows to that
complexity) and raised with the team before the submission deadline.
