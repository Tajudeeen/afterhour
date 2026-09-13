# Risk Model

## Gap Risk Score

For each supported tokenized stock, we compute:

```
gap = (onchain_price - reference_price) / reference_price
```

Then combine into a 0–100 score using weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Gap % | 30% | Absolute gap magnitude |
| Market status | 20% | Closed market increases risk |
| Liquidity | 20% | Low liquidity increases risk |
| Volatility | 15% | High volatility increases risk |
| Volume | 10% | Low volume increases risk |
| Time since reference | 5% | Stale reference increases risk |

### Bands

| Score | Band | Meaning |
|-------|------|---------|
| 0-20 | Normal | No action needed |
| 21-40 | Watch | Monitor |
| 41-60 | Elevated | Consider hedging |
| 61-80 | High | Active risk |
| 81-100 | Extreme | Immediate action |

This is a hackathon risk signal, not a perfect financial model.

## Regime classification

The Regime Memory engine classifies the current market state into one of:

| Regime | Trigger |
|--------|---------|
| NORMAL | Open market, low volatility, high liquidity, small gap |
| VOLATILITY RISING | Volatility > medium |
| LIQUIDITY FALLING | Liquidity < medium |
| MARKET CLOSED | Market status = closed |
| PRICE DIVERGENCE | Gap > 2% (when market open) |
| HIGH GAP RISK | Closed + high vol + low liquidity + gap > 3% |

## Portfolio exposure

```
exposure = (holding_value / total_portfolio_value) * 100
```

## Risk Governor policy

| Constraint | Limit | Rationale |
|-----------|-------|-----------|
| MAX_SINGLE_ASSET | 35% | Diversification floor |
| MAX_TRADE | $1,500 | Cap per-transaction impact in thin liquidity |
| MIN_USDC_RESERVE | 10% | Stablecoin buffer for opportunistic buying |
| MAX_DAILY_DRAWDOWN | 3% | Stop trading if daily loss is too large |
| REQUIRE_USER_APPROVAL | true | Never trade autonomously |

## What we do NOT build

- Value-at-Risk (VaR) models
- Options pricing
- Historical backtesting
- Monte Carlo simulations
- Correlation matrices
- Risk parity optimization
- Automated rebalancing

This is a 7-day hackathon. We pick 3 stocks and make them work extremely well.
