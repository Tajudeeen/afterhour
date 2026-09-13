# AfterHours Product

## The problem

U.S. equity markets close at 4pm ET. But tokenized stocks on Solana trade 24/7.

When a stock like NVDA is tokenized on Solana, it continues trading after the bell —
on Jupiter, Raydium, Orca, and other venues. The on-chain price can drift from
the last reference price (the official close). During this gap window:

- Liquidity is thin (fewer LPs)
- Volatility is elevated (no market makers from TradFi)
- Price divergence grows (on-chain trades away from reference)

This creates risk for investors holding tokenized equities — they don't know what
gap risk they're carrying until the market reopens.

## The solution

AfterHours detects price gaps, explains them, assesses portfolio risk, and helps
investors execute bounded actions on Solana.

### The gap formula

```
gap = (onchain_price - reference_price) / reference_price
```

This is combined with liquidity, volume, volatility, and market status into a
Gap Risk Score (0–100).

### The regime

The system remembers the recent market state (Regime Memory), so the AI Analyst
doesn't just look at the current price — it sees the context:

- Weekend / weekday
- Volatility rising or falling
- Liquidity thinning or expanding
- Market open or closed
- Price divergence magnitude
- Portfolio concentration

### The AI Analyst

The AI doesn't calculate. The deterministic backend computes all numbers. The AI
interprets:

- Why the gap matters
- What the primary risk is
- What action to take (within policy bounds)

### The Risk Governor

The AI proposes. The Governor checks. Hard limits:

| Policy | Value |
|--------|-------|
| Max single asset exposure | 35% |
| Max single trade | $1,500 |
| Min USDC reserve | 10% |
| Max daily drawdown | 3% |
| User approval required | Always |

The AI cannot override these. They exist to prevent the AI from making dangerous
recommendations, and to prevent a compromised LLM from draining a portfolio.

### The execution

After the user signs, the trade executes on Solana via Jupiter DEX aggregator.

## The user journey (entire demo)

### Step 1 — Connect wallet
User connects a Solana wallet. Sees their portfolio:

```
PORTFOLIO     $10,420

NVDA     $4,800  (46%)
AAPL     $2,100  (20%)
TSLA     $1,500  (14%)
USDC     $2,020  (19%)
```

### Step 2 — Gap detected
AfterHours scans the portfolio. NVDA is trading at a premium:

```
NVDA

Onchain:     $189.70
Reference:   $182.40
Premium:     +4.0%

Underlying market: CLOSED
Liquidity:       LOW
Risk:            HIGH
```

### Step 3 — Market Gap Engine investigates
Checks: price divergence, volatility, liquidity, volume, market session, news,
concentration, historical gap behavior.

### Step 4 — AI explains
> NVDA is trading 4% above its reference price while the underlying market is
> closed. Liquidity is currently thin and your portfolio has 46% exposure. This
> creates elevated gap risk at the next market open.

### Step 5 — Risk Governor evaluates
```
CURRENT         PROPOSED        AFTER
NVDA exposure: 46%    →   sell $1,150  →   35%
USDC:          19%    →   receive     →   31%

Policy limit:  35%     MAX_TRADE: $1,500
Result:        PASS ✅
```

### Step 6 — User approves, wallet signs, Solana executes
Transaction confirmed on Solana.

### Step 7 — Dashboard updates
NVDA exposure is now 35%, USDC is 31%.

## Supported assets

3 stocks (not 50). This is a hackathon product, not a brokerage.

| Symbol | Mint (Solana) |
|--------|---------------|
| NVDA   | [Verified]     |
| AAPL   | [Verified]     |
| TSLA   | [Verified]     |

## Not built

We deliberately cut these for the hackathon:

- Social feed
- Copy trading
- Multiple AI agents
- DAO
- Token / NFT
- Full brokerage
- Mobile app
- 50-stock universe
- Autonomous trading
- Backtesting
- Elaborate charts
