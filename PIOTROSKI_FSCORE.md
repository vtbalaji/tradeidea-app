# Piotroski F-Score Implementation

## Overview

The **Piotroski F-Score** is now calculated automatically when fetching fundamentals from Yahoo Finance. This is a value investing metric developed by Joseph Piotroski that evaluates a company's financial strength using 9 criteria.

## Data Source

**Yahoo Finance** (via yfinance library)

Data used:
- Financial Statements (`ticker.financials`)
- Balance Sheet (`ticker.balance_sheet`)
- Cash Flow Statement (`ticker.cashflow`)

## Score Calculation (0-9 Points)

The score evaluates 9 binary criteria (1 point each if passed, 0 if failed):

### Profitability (4 points max)

| Criteria | Points | Description |
|----------|--------|-------------|
| **Net Income** | 1 | Net Income > 0 (company is profitable) |
| **Operating Cash Flow** | 1 | Operating Cash Flow > 0 (generating cash) |
| **ROA Increase** | 1 | Return on Assets increased year-over-year |
| **Quality of Earnings** | 1 | Operating Cash Flow > Net Income (quality earnings) |

### Leverage/Liquidity (3 points max)

| Criteria | Points | Description |
|----------|--------|-------------|
| **Debt Decrease** | 1 | Long-term debt decreased year-over-year |
| **Current Ratio Increase** | 1 | Current ratio improved year-over-year |
| **No Share Dilution** | 1 | No new shares issued (no dilution) |

### Operating Efficiency (2 points max)

| Criteria | Points | Description |
|----------|--------|-------------|
| **Gross Margin Increase** | 1 | Gross margin improved year-over-year |
| **Asset Turnover Increase** | 1 | Asset turnover ratio improved year-over-year |

## Score Interpretation

| Score | Rating | Interpretation |
|-------|--------|----------------|
| **7-9** | 💪 STRONG | High quality value stock |
| **5-6** | 👍 GOOD | Decent fundamentals |
| **3-4** | ⚠️ AVERAGE | Mixed signals |
| **0-2** | ❌ WEAK | Poor fundamentals |

## Usage

### 1. Batch Script (Weekly Fundamentals Update)

```bash
./venv/bin/python3 scripts/analyze-fundamentals.py
```

This will:
- Fetch fundamentals for all symbols in Firestore
- Calculate Piotroski F-Score for each stock
- Store results in Firestore under `symbols/{symbol}/fundamental`

### 2. Test Individual Stock

```bash
./venv/bin/python3 test_piotroski.py
```

### 3. Programmatic Usage

```python
from analyze_fundamentals import calculate_piotroski_score
import yfinance as yf

ticker = yf.Ticker('RELIANCE.NS')
piotroski = calculate_piotroski_score(ticker)

if piotroski:
    print(f"Score: {piotroski['score']}/9")
    print("Breakdown:", piotroski['breakdown'])
    print("Details:", piotroski['details'])
```

## Firestore Storage

The Piotroski data is stored in Firestore at:

```
symbols/{symbol}/fundamental/
  ├── piotroskiScore: number (0-9)
  ├── piotroskiBreakdown: object
  │   ├── netIncome: 0 or 1
  │   ├── operatingCashFlow: 0 or 1
  │   ├── roaIncrease: 0 or 1
  │   ├── qualityOfEarnings: 0 or 1
  │   ├── debtDecrease: 0 or 1
  │   ├── currentRatioIncrease: 0 or 1
  │   ├── noSharesIssued: 0 or 1
  │   ├── grossMarginIncrease: 0 or 1
  │   └── assetTurnoverIncrease: 0 or 1
  └── piotroskiDetails: array of strings
      └── ["✓ Net Income > 0", "✗ ROA decreased", ...]
```

## Example Output

```
[1/100] Processing RELIANCE...
  📥 Fetching fundamentals for RELIANCE...
  📊 Calculating Piotroski F-Score...
  ✅ Piotroski F-Score: 3/9
  ✅ RELIANCE - AVERAGE (Score: 68.5)
     Piotroski: 3/9 | PE: 24.35 | ROE: 13.2% | D/E: 0.37
```

## Implementation Details

**Location**: `scripts/analyze-fundamentals.py`

**Function**: `calculate_piotroski_score(ticker)`
- Lines: 116-318

**Integration**: Called from `fetch_fundamentals()` function
- Lines: 109-121

## Advantages of This Implementation

1. ✅ **Automated** - Runs with weekly fundamentals batch job
2. ✅ **Authentic Data** - Uses actual financial statements from Yahoo Finance
3. ✅ **Year-over-Year Comparison** - Compares current vs previous year
4. ✅ **Detailed Breakdown** - Shows which criteria passed/failed
5. ✅ **No Manual Calculation** - Fully automated calculation
6. ✅ **Stored in Firestore** - Available to all frontend components
7. ✅ **Error Handling** - Gracefully handles missing data

## Limitations

- Requires at least 2 years of historical financial data
- Some stocks may not have complete financial statement data
- Returns `None` if insufficient data is available
- Yahoo Finance data quality may vary by stock

## Next Steps

To display Piotroski F-Score in your frontend:

1. **Portfolio Page** - Show Piotroski score alongside other metrics
2. **Fundamentals Card** - Add Piotroski breakdown with visual indicators
3. **Stock Screener** - Filter by Piotroski score (e.g., score >= 7)
4. **Investor Type Rules** - Use Piotroski in Value Investor criteria

## References

- Original Paper: "Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers" (Joseph Piotroski, 2000)
- The Piotroski F-Score is widely used by value investors to identify fundamentally strong stocks trading at low valuations

---

**Last Updated**: January 2025
**Version**: 1.0
