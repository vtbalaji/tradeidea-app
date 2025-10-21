# PEG Ratio Implementation for Indian Market

## Overview

This implementation calculates **Hybrid PEG Ratios** tailored for the Indian market context, addressing the fundamental difference between global (Yahoo Finance) and Indian (Screener.in) PEG calculation methodologies.

## The Problem

| Metric | Yahoo Finance (Global) | Indian Market (Screener.in) |
|--------|----------------------|---------------------------|
| Growth Period | 1-year **forward** estimates | 3-year **historical** CAGR |
| Data Source | Analyst predictions | Actual audited results |
| Reliability | Variable (depends on coverage) | High (proven track record) |
| Best For | High-growth tech stocks | Conservative value investing |

**Why This Matters:**
- Yahoo's PEG using 1-year forward growth can be overly optimistic
- Indian investors prefer 3-year historical CAGR as more trustworthy
- Mid/small-cap Indian stocks often have poor analyst coverage

## Solution: Hybrid PEG Approach

We calculate **THREE PEG ratios** and use a weighted average:

```
PEG Hybrid = (0.7 × PEG Historical) + (0.3 × PEG Forward)
```

### Rationale for 70/30 Weighting

- **70% Historical**: Conservative baseline based on actual audited results
- **30% Forward**: Captures growth momentum and market expectations
- **Fallback**: Use only available metric if one is missing

---

## Architecture

### Data Storage Strategy

```
Yahoo Finance API
       ↓
   [Fetch Annual Financial Data]
       ↓
   ┌─────────────────┬─────────────────┐
   │                 │                 │
   v                 v                 v
DuckDB          Calculate PEG      Firebase
(All History)   (3Y CAGR + Forward) (Summary Only)
```

**DuckDB** (Heavy Data):
- All quarterly fundamentals (unlimited history)
- Yahoo current snapshot (PE, ratios, etc.)
- Full time-series for analytics

**Firebase** (Lean Summary):
- Only 8 PEG-related fields per symbol
- Latest quarter fundamentals
- Keeps Firebase costs low

### Database Schema

#### DuckDB: `yahoo_quarterly_fundamentals`
```sql
CREATE TABLE yahoo_quarterly_fundamentals (
  symbol VARCHAR,
  end_date DATE,
  period VARCHAR,           -- e.g., '2024Q1'

  -- Income Statement (₹ Crores)
  revenue_cr DOUBLE,
  net_income_cr DOUBLE,
  ebitda_cr DOUBLE,
  eps DOUBLE,

  -- Balance Sheet (₹ Crores)
  total_assets_cr DOUBLE,
  total_equity_cr DOUBLE,
  total_debt_cr DOUBLE,

  PRIMARY KEY (symbol, end_date)
);
```

#### DuckDB: `yahoo_current_fundamentals`
```sql
CREATE TABLE yahoo_current_fundamentals (
  symbol VARCHAR PRIMARY KEY,

  -- Valuation
  trailing_pe DOUBLE,
  forward_pe DOUBLE,
  price_to_book DOUBLE,

  -- Profitability
  roe DOUBLE,
  profit_margins DOUBLE,

  -- Growth
  earnings_growth DOUBLE,    -- Forward estimate
  revenue_growth DOUBLE,

  -- Analyst Data
  number_of_analyst_opinions INTEGER,

  last_updated TIMESTAMP
);
```

#### Firebase: `symbols/{NS_SYMBOL}/pegRatios`
```json
{
  "pegRatios": {
    // Main Metrics (3 fields)
    "pegHistorical3Y": 2.69,
    "pegForward1Y": 15.77,
    "pegHybrid": 6.61,

    // Supporting Data (2 fields)
    "earningsCagr3Y": 8.20,
    "earningsGrowthForward": 1.40,

    // Quality Indicators (3 fields)
    "confidence": "MEDIUM",
    "recommendation": "OVERVALUED",
    "lastCalculated": "2025-01-21T10:30:00"
  }
}
```

**Total Firebase Overhead**: ~8 fields × 50 bytes = **~400 bytes per symbol**

---

## Usage

### 1. Fetch Yahoo Fundamentals (Populate DuckDB)

```bash
# Fetch data for specific symbols
./scripts/yahoo_fundamentals_fetcher.py RELIANCE TCS INFY

# Or use in Python
from yahoo_fundamentals_fetcher import YahooFundamentalsFetcher

fetcher = YahooFundamentalsFetcher()
fetcher.fetch_and_store('RELIANCE')
fetcher.close()
```

### 2. Calculate PEG Ratios

```bash
# Calculate PEG for symbols
./scripts/peg_calculator.py RELIANCE TCS

# Or use in Python
from peg_calculator import PEGCalculator

calc = PEGCalculator()
peg_data = calc.calculate_hybrid_peg('RELIANCE', verbose=True)
print(peg_data)
calc.close()
```

### 3. Update All (DuckDB + Firebase)

```bash
# Update all portfolio symbols
./scripts/update_yahoo_fundamentals.py --portfolio

# Update specific symbols
./scripts/update_yahoo_fundamentals.py RELIANCE TCS INFY

# Update from file
./scripts/update_yahoo_fundamentals.py --file watchlist.txt

# DuckDB only (skip Firebase)
./scripts/update_yahoo_fundamentals.py --no-firebase RELIANCE
```

---

## Example Output

### TCS Analysis
```
============================================================
PEG CALCULATION FOR TCS
============================================================

  📊 3-Year CAGR Calculation:
     Start: FY2022 - Net Income: ₹38,327 Cr
     End:   FY2025 - Net Income: ₹48,553 Cr
     Earnings CAGR: 8.20%
     Current EPS: ₹136.59
     PE: 22.08
     PEG Historical: 2.69

  📊 Forward Estimates:
     Forward Growth: 1.40%
     PEG Forward: 15.77
     Analysts: 44

  ⚖️  Hybrid PEG:
     (0.7 × 2.69) + (0.3 × 15.77) = 6.61

  📊 FINAL RESULTS:
     PEG Historical: 2.69
     PEG Forward: 15.77
     PEG Hybrid: 6.61
     Confidence: MEDIUM
     Recommendation: OVERVALUED (MEDIUM confidence)
============================================================
```

### HDFCBANK Analysis
```
============================================================
PEG CALCULATION FOR HDFCBANK
============================================================

  📊 3-Year CAGR Calculation:
     Start: FY2022 - Net Income: ₹38,600 Cr
     End:   FY2025 - Net Income: ₹67,351 Cr
     Earnings CAGR: 20.39%
     Current EPS: ₹43.71
     PE: 22.96
     PEG Historical: 1.13

  📊 Forward Estimates:
     Forward Growth: -2.20%
     PEG Forward: N/A (negative growth)
     Analysts: 39

  📊 FINAL RESULTS:
     PEG Historical: 1.13
     PEG Forward: None
     PEG Hybrid: 1.13
     Confidence: MEDIUM
     Recommendation: FAIR_VALUE (MEDIUM confidence)
============================================================
```

---

## PEG Interpretation

| PEG Hybrid Value | Interpretation | Investment Signal |
|-----------------|---------------|------------------|
| < 1.0 | **Undervalued** | Strong Buy |
| 1.0 - 1.5 | **Fair Value** | Buy/Hold |
| 1.5 - 2.0 | **Slightly Expensive** | Hold |
| > 2.0 | **Overvalued** | Sell/Avoid |

### Confidence Levels

| Level | Criteria | Meaning |
|-------|----------|---------|
| **HIGH** | 4+ years data AND 5+ analysts | Very reliable |
| **MEDIUM** | 4+ years OR 2+ analysts | Moderately reliable |
| **LOW** | Limited data on both fronts | Use with caution |

---

## Real-World Results (October 2025)

| Stock | Historical CAGR | PEG Historical | Forward Growth | PEG Hybrid | Recommendation |
|-------|----------------|---------------|---------------|-----------|----------------|
| **HDFCBANK** | 20.39% | 1.13 | -2.2% | 1.13 | **FAIR_VALUE** ✅ |
| **TCS** | 8.20% | 2.69 | 1.4% | 6.61 | OVERVALUED ❌ |
| **RELIANCE** | 4.69% | 5.09 | 9.6% | 4.31 | OVERVALUED ❌ |
| **INFY** | 2.15% | 9.83 | 6.6% | 7.84 | OVERVALUED ❌ |

**Insights:**
- **HDFCBANK** shows strong historical growth (20.39%) with fair valuation (PEG 1.13)
- **TCS, INFY** are expensive relative to their slow growth
- **RELIANCE** has better forward prospects (9.6%) than history (4.69%)

---

## Files Created

| File | Purpose |
|------|---------|
| `scripts/yahoo_fundamentals_fetcher.py` | Fetch quarterly/annual data from Yahoo Finance |
| `scripts/peg_calculator.py` | Calculate 3-year CAGR and hybrid PEG |
| `scripts/update_yahoo_fundamentals.py` | Main batch script (DuckDB + Firebase) |
| `scripts/check_yahoo_data.py` | Diagnostic tool to check data availability |
| `docs/PEG_RATIO_IMPLEMENTATION.md` | This documentation |

---

## Integration with Existing System

### Using PEG in Investment Rules

Update your investment rules to use hybrid PEG:

```typescript
// lib/investment-rules/rules/growthInvestor.ts

export const growthInvestorRules = {
  fundamentalCriteria: {
    // Use hybrid PEG instead of Yahoo's unreliable PEG
    pegHybrid: fundamental.pegRatios?.pegHybrid < 1.5,

    // Optional: Check confidence level
    pegConfidence: fundamental.pegRatios?.confidence !== 'LOW',

    // Existing rules...
    roe: fundamental.ROE > 15,
    earningsGrowth: fundamental.earningsCagr3Y > 15,
  }
};
```

### Displaying in UI

```tsx
// components/FundamentalsCard.tsx

function PEGRatiosSection({ symbol }: { symbol: string }) {
  const [pegData, setPegData] = useState(null);

  useEffect(() => {
    const fetchPEG = async () => {
      const doc = await db.collection('symbols').doc(`NS_${symbol}`).get();
      setPegData(doc.data()?.pegRatios);
    };
    fetchPEG();
  }, [symbol]);

  if (!pegData) return null;

  return (
    <div className="peg-section">
      <h3>PEG Ratios (Indian Market Context)</h3>

      <div className="metric">
        <span>PEG Hybrid:</span>
        <strong className={pegData.pegHybrid < 1.5 ? 'good' : 'warning'}>
          {pegData.pegHybrid?.toFixed(2) || 'N/A'}
        </strong>
      </div>

      <div className="metric">
        <span>3-Year CAGR:</span>
        <span>{pegData.earningsCagr3Y?.toFixed(2)}%</span>
      </div>

      <div className="metric">
        <span>Recommendation:</span>
        <span className={`badge ${pegData.recommendation}`}>
          {pegData.recommendation}
        </span>
      </div>

      <div className="confidence">
        Confidence: {pegData.confidence}
      </div>
    </div>
  );
}
```

---

## Advantages of This Approach

✅ **Market-Aligned**: Uses 3-year CAGR matching Indian investor expectations
✅ **Balanced**: Combines conservative (historical) + optimistic (forward) views
✅ **Data Quality**: Tracks confidence based on data availability
✅ **Firebase-Friendly**: Only 8 fields per symbol (minimal overhead)
✅ **DuckDB Power**: Full historical data for analytics and backtesting
✅ **Flexible**: Falls back gracefully when data is missing

---

## Future Enhancements

1. **Sector-Specific PEG Thresholds**
   - Tech stocks: PEG < 2.0 acceptable
   - Banks: PEG < 1.2 preferred
   - Utilities: PEG < 1.0 expected

2. **5-Year CAGR Option**
   - For very stable companies
   - Requires more historical data

3. **TTM (Trailing Twelve Months) Growth**
   - Use last 4 quarters for more recent trends
   - Supplement to annual CAGR

4. **XBRL Integration**
   - Once XBRL files are available
   - More accurate than Yahoo Finance
   - Can calculate custom metrics

---

## Troubleshooting

### Issue: "Insufficient historical data"
**Cause**: Yahoo Finance only provides 4 years of annual data
**Solution**: Stock is too new or data unavailable - skip PEG for this symbol

### Issue: "Forward growth is negative"
**Cause**: Analysts expect earnings decline
**Solution**: PEG Forward set to None, use PEG Historical only

### Issue: Forward growth seems wrong
**Cause**: Yahoo's forward estimates can be unreliable
**Solution**: Check `analystCount` - if < 5, treat with caution

### Issue: CAGR is very high/low
**Cause**: Base year might have been exceptional (very low/high earnings)
**Solution**: Check individual years manually, consider 5-year CAGR

---

## References

- **Screener.in**: Indian market PEG standard (3-year CAGR)
- **Yahoo Finance API**: Global data source
- **yfinance**: Python library for Yahoo Finance data
- **DuckDB**: Embedded analytical database

---

## Conclusion

This hybrid PEG implementation provides the best of both worlds:
- **Conservative baseline** from proven historical growth
- **Forward-looking insight** from analyst expectations
- **Minimal Firebase overhead** with full DuckDB analytics power

Perfect for Indian market analysis while keeping your infrastructure lean! 🚀
