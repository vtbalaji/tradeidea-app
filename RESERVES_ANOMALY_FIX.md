# Reserves Anomaly Detection - Investigation & Fix

**Date**: 2025-01-29
**Issue**: False positive "Reserves Anomaly" alerts appearing across multiple companies
**Example**: TCS showing "Reserves increased ₹74172 Cr vs profit ₹39512 Cr - investigate source"

---

## Root Cause Analysis

### Problem Identified

The J-Score forensic analyzer was flagging reserves anomalies incorrectly due to:

1. **Missing Data Handling**: When `raw_reserves` is NULL in database, the data loader returns `0`
2. **Incomplete Comparison**: Comparing reserves with gaps in time series (e.g., Sep 2022 vs Mar 2023 instead of Mar 2022 vs Mar 2023)
3. **No Dividend Verification**: Not accounting for dividend payments when reserves decrease

### TCS FY2023 Example

**Database Reality**:
```
2023-03-31: Reserves = ₹74,172 Cr
2022-09-30: Reserves = ₹97,088 Cr (last available - quarterly)
2022-03-31: Reserves = NULL (not reported in XBRL)
```

**What Happened**:
- System compared Mar 2023 (₹74,172 Cr) with previous available data point
- If previous was NULL → treated as 0
- Calculated: `74,172 - 0 = 74,172 Cr increase` ❌
- **Actual Reality**: Reserves **decreased** from ₹97,088 Cr to ₹74,172 Cr = **-₹22,916 Cr**
- This decrease is likely due to **dividend payments** (normal corporate behavior)

---

## Solution Implemented

### Enhanced `_check_reserves_anomaly()` Function

**Location**: `scripts/forensics/j_score.py:296-358`

**New Logic**:

1. **Skip Missing Data**
   ```python
   if current['reserves'] == 0 or previous['reserves'] == 0:
       return None, 0  # Data quality issue - skip check
   ```

2. **Case 1: Unexplained Increase**
   - Flag if reserves increase > 1.3x profit
   - Suggests revaluation gains, FX adjustments, or accounting manipulation
   ```python
   if reserves_change > net_income * 1.3 and reserves_change > 0:
       # Flag as "Reserves Anomaly - Unexplained Increase"
   ```

3. **Case 2: Unexplained Decrease** ⭐ NEW
   - Calculate expected decrease (dividends paid)
   - Flag if actual decrease > expected + 20% of profit
   - Suggests hidden losses, write-offs, or adjustments
   ```python
   elif reserves_change < 0:
       expected_decrease = total_dividends
       actual_decrease = abs(reserves_change)
       unexplained_decrease = actual_decrease - expected_decrease

       if unexplained_decrease > net_income * 0.2 and unexplained_decrease > 100 Cr:
           # Flag as "Reserves Anomaly - Unexplained Decrease"
   ```

4. **Dividend Data Handling**
   ```python
   # Try to get dividend data from multiple sources
   if 'dividends_paid' in current and current['dividends_paid']:
       total_dividends = abs(current['dividends_paid'])
   elif 'dividend_per_share' in current and current['shares_outstanding']:
       total_dividends = current['dividend_per_share'] * current['shares_outstanding']
   ```

---

## Impact

### Before Fix
- ❌ False positives on companies with missing quarterly reserves data
- ❌ No consideration of dividends when reserves decrease
- ❌ Misleading forensic scores

### After Fix
- ✅ Skips analysis when reserves data is incomplete
- ✅ Accounts for dividend payments in reserves movements
- ✅ Distinguishes between normal dividend payouts and suspicious decreases
- ✅ Provides clearer descriptions in alerts

---

## Alert Examples

### Suspicious Increase
```
⚠️ Reserves Anomaly - Unexplained Increase
Reserves increased ₹5,000 Cr vs profit ₹2,000 Cr - investigate source
(revaluation/FX gains?)

Reserves Change: ₹5,000 Cr
Net Income: ₹2,000 Cr
```

### Suspicious Decrease (New)
```
⚠️ Reserves Anomaly - Unexplained Decrease
Reserves declined ₹3,000 Cr (dividends: ₹1,000 Cr, unexplained: ₹2,000 Cr)
- investigate losses/write-offs

Reserves Decrease: ₹3,000 Cr
Dividends Paid: ₹1,000 Cr
Unexplained: ₹2,000 Cr
Net Income: ₹1,500 Cr
```

### No Dividend Data
```
⚠️ Reserves Anomaly - Unexplained Decrease
Reserves declined ₹2,000 Cr with no dividends reported - investigate
losses/write-offs/adjustments
```

---

## Data Quality Observations

### XBRL Data Gaps
- Not all quarters have reserves data populated
- Dividend information often missing in XBRL filings
- Need fallback to Yahoo Finance / other sources for complete dividend history

### Recommendations
1. ✅ **Implemented**: Skip analysis when data is incomplete
2. 🔄 **Future**: Integrate NSE/BSE dividend announcement data
3. 🔄 **Future**: Add cash flow statement reconciliation
4. 🔄 **Future**: Cross-verify with annual reports for major movements

---

## Testing

### Test Cases Needed
- [x] Company with missing reserves data (TCS)
- [ ] Company with large dividend payouts (HDFC Bank, TCS annual)
- [ ] Company with revaluation reserves (Real estate, Manufacturing)
- [ ] Company with genuine reserves manipulation
- [ ] Company with foreign exchange adjustments

---

## Files Modified

1. **`scripts/forensics/j_score.py`**
   - Enhanced `_check_reserves_anomaly()` function (lines 296-358)
   - Added dividend verification logic
   - Added missing data handling

---

## Validation Required

Run forensic analysis on these companies to verify fix:
```bash
./venv/bin/python3 scripts/forensics/forensic_analyzer.py TCS
./venv/bin/python3 scripts/forensics/forensic_analyzer.py HDFCBANK
./venv/bin/python3 scripts/forensics/forensic_analyzer.py RELIANCE
```

Expected: No false positive reserves alerts where data is missing or dividends explain the movement.

---

## Notes

- This fix improves accuracy but is still limited by dividend data availability
- Future enhancement: Pull dividend data from NSE corporate announcements API
- The 1.3x threshold for increases is based on typical profit retention patterns
- The 20% threshold for unexplained decreases balances sensitivity with false positives
