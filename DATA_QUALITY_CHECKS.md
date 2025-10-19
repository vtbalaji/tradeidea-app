# Data Quality Checks - Documentation

## Overview

Automated data quality checks to prevent issues like the ADANIPOWER bug (incorrect MACD calculations due to stale/corrupt DuckDB data).

## What Happened with ADANIPOWER

**Problem**: Momentum score showing 3/6 instead of 6/6

**Root Causes**:
1. **Code bugs**:
   - Supertrend detection not implemented (always `undefined`)
   - RSI condition too restrictive (50-70 instead of >=50)

2. **Data issue**:
   - DuckDB historical data was accidentally deleted during troubleshooting
   - This caused MACD histogram to be calculated incorrectly
   - Yahoo Finance showed +0.46 (positive) but DuckDB showed -0.11 (negative)
   - The sign difference caused momentum signals to fail

## Prevention: Automated Quality Checks

### 1. EOD Data Quality Check

**Script**: `scripts/eod-data-quality-check.py`

**What it checks**:
- ✅ Data freshness (DuckDB vs Yahoo Finance)
- ✅ Price accuracy (latest prices match)
- ✅ **MACD calculation accuracy** (critical for momentum signals)
- ✅ **RSI calculation** (14-day RSI values match)
- ✅ **EMA50 calculation** (used in golden cross detection)
- ✅ **SMA200 calculation** (trend confirmation)
- ✅ **Golden Cross detection** (EMA50 vs SMA200)
- ✅ Zero/null values
- ✅ Suspicious price gaps (possible splits/bonuses)

**Usage**:
```bash
# Check 20 random symbols + portfolio (recommended for daily EOD)
python3 scripts/eod-data-quality-check.py

# Check only portfolio/watchlist symbols
python3 scripts/eod-data-quality-check.py --portfolio

# Check ALL symbols (slow, use weekly)
python3 scripts/eod-data-quality-check.py --full

# Check 50 random symbols
python3 scripts/eod-data-quality-check.py --count 50

# Save detailed report
python3 scripts/eod-data-quality-check.py --save-report
```

### 2. Integrated EOD Workflow

**Script**: `scripts/run-eod-with-quality-check.sh`

**What it does**:
1. Fetches EOD data
2. Calculates technical indicators
3. **Runs automated quality checks**
4. Reports any issues

**Usage**:
```bash
# Full EOD with quality checks
./scripts/run-eod-with-quality-check.sh

# Single symbol with checks
./scripts/run-eod-with-quality-check.sh ADANIPOWER
```

## Checks Performed

### Critical Checks (will fail if detected):

1. **Missing Data**: Symbol not in DuckDB
2. **Stale Data**: >2 days behind Yahoo Finance
3. **Price Mismatch**: >2% difference in latest price
4. **MACD Sign Mismatch**: Histogram positive in YF but negative in DB (or vice versa)
5. **RSI Mismatch**: >10 point difference in RSI values
6. **EMA50 Mismatch**: >2% difference in EMA50 calculation
7. **SMA200 Mismatch**: >2% difference in SMA200 calculation
8. **Golden Cross Mismatch**: YF shows golden cross but DB doesn't (or vice versa)
9. **Zero/Negative Prices**: Invalid price data

### Warning Checks (informational):

1. **Data 1 day behind**: Minor staleness
2. **Small price difference**: 0.5-2% difference
3. **MACD value difference**: Same sign but different magnitude
4. **Large price gaps**: Possible unadjusted stock splits

## Quality Check Output

### Successful Run:
```
🔍 Running data quality checks on 25 symbols...

[1/25] RELIANCE... ✅ OK
[2/25] TCS... ✅ OK
[3/25] INFY... ⚠️  WARNING
...

📊 DATA QUALITY SUMMARY
======================================================================
Total symbols checked:  25
✅ Passed:              23 (92.0%)
⚠️  Warnings:            2 (8.0%)
❌ Critical issues:     0 (0.0%)

✅ All checks passed! Data quality is good.
```

### Failed Run with Issues:
```
[5/25] ADANIPOWER... ❌ CRITICAL

📊 DATA QUALITY SUMMARY
======================================================================
Total symbols checked:  25
✅ Passed:              22 (88.0%)
⚠️  Warnings:            2 (8.0%)
❌ Critical issues:     1 (4.0%)

❌ CRITICAL ISSUES FOUND:
======================================================================

ADANIPOWER:
  • MACD sign mismatch: YF=0.4662, DB=-0.1085

⚠️  ACTION REQUIRED: Fix critical issues before using data!
💡 Run: python3 scripts/fix-data-issues.py
```

## How to Fix Issues

### 1. Refresh DuckDB Data

```bash
# For single symbol
python3 scripts/fetch-eod-data.py ADANIPOWER

# For all symbols
python3 scripts/fetch-eod-data.py
```

### 2. Recalculate Technical Indicators

```bash
python3 scripts/analyze-symbols.py ADANIPOWER
```

### 3. Verify Fix

```bash
python3 scripts/eod-data-quality-check.py --portfolio
```

## Recommended Workflow

### Daily (Automated via Cron):
```bash
# Run full EOD with quality checks
./scripts/run-eod-with-quality-check.sh

# If checks fail, alert admin and don't deploy
```

### Weekly:
```bash
# Deep check of all symbols
python3 scripts/eod-data-quality-check.py --full --save-report
```

### Before Important Analysis:
```bash
# Always check portfolio symbols
python3 scripts/eod-data-quality-check.py --portfolio
```

## Integration with CI/CD

Add to your deployment pipeline:

```yaml
# .github/workflows/eod.yml
steps:
  - name: Run EOD Process
    run: ./scripts/run-eod-with-quality-check.sh

  - name: Check for Quality Issues
    run: |
      if [ $? -ne 0 ]; then
        echo "❌ Data quality check failed!"
        exit 1
      fi
```

## Monitoring Metrics

Track these over time:
- **Pass Rate**: % of symbols passing all checks
- **Critical Issues**: Count of symbols with MACD mismatches
- **Data Freshness**: Average days behind
- **Price Accuracy**: Average % difference

## Alert Thresholds

**Trigger manual review if**:
- >5% of symbols have critical issues
- >10% of portfolio symbols have warnings
- Any symbol >3 days stale
- MACD sign mismatch detected

## Summary

These automated checks prevent issues like:
- ✅ Incorrect momentum signals (ADANIPOWER bug)
- ✅ Stale data affecting investment decisions
- ✅ Missing symbols in database
- ✅ Unadjusted stock splits/bonuses
- ✅ Data corruption

**Bottom line**: Run quality checks as part of your EOD process!
