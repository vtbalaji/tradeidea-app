# Bug Fix Summary: EPS Column Issue

## Date: October 28, 2025

## Problem Identified

❌ **TCS Q2 FY2026 EPS was showing 116.14 instead of 33.37**

### Root Cause
The `eps` column in `xbrl_data` table was storing **TTM (Trailing Twelve Months) EPS** instead of the **actual quarterly/annual EPS** for quarterly reports (Q1, Q2, Q3).

This was happening in `fundamental_calculator.py` at line 285:
```python
'EPS': round(eps_for_pe, 2),  # Bug: Using TTM EPS for quarterly reports
```

## Impact
- 1,953 rows affected across the database
- All quarterly reports (Q1, Q2, Q3) had incorrect EPS values
- Annual reports (Q4) were correct

## Solution Implemented

### 1. Fixed Calculation Logic (`fundamental_calculator.py`)
- ✅ Changed `'EPS'` to store actual quarterly/annual EPS
- ✅ Added new field `'EPS_TTM'` to store TTM EPS separately
- ✅ TTM EPS is now used only for PE calculation, not stored as primary EPS

**Changes:**
```python
# Before (line 285):
'EPS': round(eps_for_pe, 2),  # Stored TTM EPS for Q1-Q3

# After (lines 285-286):
'EPS': round(eps, 2),  # Store actual quarterly/annual EPS
'EPS_TTM': round(ttm_eps_value, 2) if ttm_eps_value else None,  # Store TTM separately
```

### 2. Updated Database Schema (`fundamental_xbrl_storage.py`)
- ✅ Added `eps_ttm DOUBLE` column to schema
- ✅ Updated INSERT statement to include new field

### 3. Migrated Existing Data (`scripts/migrations/001_fix_eps_column.py`)
- ✅ Added `eps_ttm` column to existing database
- ✅ Backed up TTM values to `eps_ttm` for quarterly reports (1,950 rows)
- ✅ Fixed `eps` column to use `raw_eps` values (1,953 rows)
- ✅ Verified fix: TCS Q2 FY2026 now shows 33.37 ✓

## Verification

### Before Fix:
```
TCS Q2 FY2026:
  raw_eps: 33.37 (correct, from XBRL)
  eps:     116.14 (wrong, TTM value)
```

### After Fix:
```
TCS Q2 FY2026:
  raw_eps:  33.37 (correct, from XBRL)
  eps:      33.37 ✅ (now correct!)
  eps_ttm:  116.14 (TTM value, stored separately)
```

### External Verification:
- ✅ TCS Q2 FY26: 33.37 (matches Business Standard, TCS official results)
- ✅ WIPRO Q2 FY26: 3.10 (matches Business Today)
- ✅ INFY Q2 FY26: 17.76 (matches Business Today)

## Files Modified

1. **`scripts/fundamental_calculator.py`**
   - Lines 213-224: Store TTM EPS separately
   - Lines 285-286: Fixed EPS field assignment

2. **`scripts/fundamental_xbrl_storage.py`**
   - Line 175: Added `eps_ttm DOUBLE` column
   - Line 431: Added `eps_ttm` to INSERT statement

3. **One-time migration** (completed & deleted)
   - Successfully migrated 1,953 rows
   - Migration script deleted after successful run

4. **`scripts/reports/quarterly_financial_report.py`**
   - Updated to use corrected `eps` field
   - Added `eps_ttm` to columns list

## Future Implications

✅ **All new XBRL data processed will have:**
- Correct quarterly/annual EPS in `eps` field
- TTM EPS in `eps_ttm` field (for Q1-Q3 only)

✅ **All reports now use:**
- `eps` field for displaying quarterly/annual EPS
- `eps_ttm` available if needed for analysis

✅ **No more patching needed:**
- Fixed at the source (calculation level)
- All reports automatically benefit from the fix

## Lesson Learned

🎯 **Always fix at the source, not in reports!**
- Database/calculation issues should be fixed at the data layer
- Reports should trust the database (after validation)
- Migration scripts ensure consistency across historical data

## Testing

Run the quarterly report to verify:
```bash
./venv/bin/python3 scripts/reports/quarterly_financial_report.py TCS WIPRO INFY --compare
```

Expected output:
- TCS: EPS 33.37 ✅
- WIPRO: EPS 3.10 ✅
- INFY: EPS 17.76 ✅
