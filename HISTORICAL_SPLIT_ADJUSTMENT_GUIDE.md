# Historical Split/Bonus Adjustment Guide

## Problem

Some stocks had splits/bonuses **long ago**, but your DuckDB historical data was never adjusted. This causes:
- ❌ Moving averages calculated on wrong historical prices
- ❌ Technical indicators show incorrect signals
- ❌ Charts look broken (huge price jumps)
- ❌ Stop-loss/target comparisons fail

## Solution

Use `adjust-historical-split.py` to retroactively adjust historical data in DuckDB.

---

## Quick Start

### Example: RELIANCE had 1:1 bonus on Oct 28, 2024

```bash
python3 scripts/adjust-historical-split.py RELIANCE 2024-10-28 1:1 bonus
```

This will:
1. ✅ Adjust all prices **BEFORE** 2024-10-28 (divide by 2)
2. ✅ Adjust all volumes **BEFORE** 2024-10-28 (multiply by 2)
3. ✅ Leave data **ON/AFTER** 2024-10-28 unchanged
4. ✅ Create backup before making changes

---

## Usage

```bash
python3 scripts/adjust-historical-split.py SYMBOL EX_DATE RATIO TYPE
```

### Arguments:

| Argument | Description | Example |
|----------|-------------|---------|
| **SYMBOL** | Stock symbol | RELIANCE, TCS, WIPRO |
| **EX_DATE** | Ex-date (YYYY-MM-DD) | 2024-10-28 |
| **RATIO** | Split/bonus ratio | 1:2, 1:3, 1:1 |
| **TYPE** | Action type | split or bonus |

---

## Examples

### Example 1: RELIANCE - 1:1 Bonus (Oct 2024)

```bash
python3 scripts/adjust-historical-split.py RELIANCE 2024-10-28 1:1 bonus
```

**What happens:**
- All prices before Oct 28, 2024 are divided by 2
- All volumes before Oct 28, 2024 are multiplied by 2
- Data on/after Oct 28, 2024 stays unchanged

**Before adjustment:**
```
2024-10-27: Close = ₹2,500, Volume = 1,000,000  ← WRONG (too high)
2024-10-28: Close = ₹1,250, Volume = 2,000,000  ← Correct (post-bonus)
```

**After adjustment:**
```
2024-10-27: Close = ₹1,250, Volume = 2,000,000  ← CORRECTED
2024-10-28: Close = ₹1,250, Volume = 2,000,000  ← Unchanged
```

---

### Example 2: WIPRO - 1:3 Split (July 2019)

```bash
python3 scripts/adjust-historical-split.py WIPRO 2019-07-18 1:3 split
```

**What happens:**
- All prices before July 18, 2019 are divided by 3
- All volumes before July 18, 2019 are multiplied by 3

**Before adjustment:**
```
2019-07-17: Close = ₹300, Volume = 100,000  ← WRONG (pre-split price)
2019-07-18: Close = ₹100, Volume = 300,000  ← Correct (post-split)
```

**After adjustment:**
```
2019-07-17: Close = ₹100, Volume = 300,000  ← CORRECTED
2019-07-18: Close = ₹100, Volume = 300,000  ← Unchanged
```

---

### Example 3: TCS - 1:1 Bonus (Sep 2022)

```bash
python3 scripts/adjust-historical-split.py TCS 2022-09-16 1:1 bonus
```

---

## How It Works

### Step 1: Parse Ratio

**1:2 split** = 1 share becomes 2 shares
- Multiplier = 2
- Price adjustment = ÷2
- Volume adjustment = ×2

**1:1 bonus** = Get 1 free share per share owned
- Total shares = 1 + 1 = 2
- Multiplier = 2
- Price adjustment = ÷2
- Volume adjustment = ×2

**1:3 split** = 1 share becomes 3 shares
- Multiplier = 3
- Price adjustment = ÷3
- Volume adjustment = ×3

### Step 2: Identify Records to Adjust

```sql
-- Records BEFORE ex-date get adjusted
SELECT * FROM nse_eod_data
WHERE symbol = 'RELIANCE'
  AND date < '2024-10-28'
```

### Step 3: Apply Adjustment

```sql
UPDATE nse_eod_data
SET
  open = open / 2,      -- Divide prices
  high = high / 2,
  low = low / 2,
  close = close / 2,
  volume = volume * 2   -- Multiply volume
WHERE symbol = 'RELIANCE'
  AND date < '2024-10-28'
```

### Step 4: Verify

Show sample of adjusted data to confirm changes are correct.

---

## Interactive Flow

```
$ python3 scripts/adjust-historical-split.py RELIANCE 2024-10-28 1:1 bonus

======================================================================
🔧 Historical Corporate Action Adjustment
======================================================================
Symbol: RELIANCE
Ex-Date: 2024-10-28
Ratio: 1:1
Type: bonus
======================================================================

📊 Adjustment Multipliers:
  Price Multiplier: 0.5000 (prices will be DIVIDED)
  Volume Multiplier: 2.0000 (volumes will be MULTIPLIED)

📦 Connecting to DuckDB: nse_data.duckdb

🔍 Fetching historical data for RELIANCE...
✅ Found 1,250 records

📅 Date Analysis:
  Records BEFORE 2024-10-28: 1,248 (will be adjusted)
  Records ON/AFTER 2024-10-28: 2 (will NOT be adjusted)

📋 Sample of adjustments (first 3 records):
======================================================================

Date: 2020-01-01
  Open:   ₹2,400.00 → ₹1,200.00
  High:   ₹2,450.00 → ₹1,225.00
  Low:    ₹2,380.00 → ₹1,190.00
  Close:  ₹2,420.00 → ₹1,210.00
  Volume: 1,000,000 → 2,000,000

...

📋 Records after ex-date (will NOT change) - Sample:
======================================================================

Date: 2024-10-28 (and all dates after)
  Open:   ₹1,250.00 (unchanged)
  Close:  ₹1,250.00 (unchanged)
  Volume: 2,000,000 (unchanged)

======================================================================
⚠️  WARNING: This will modify historical data in DuckDB
======================================================================

🚨 Adjust 1,248 records before 2024-10-28? (yes/no): yes

💾 Creating backup...
✅ Backup created: nse_eod_data_backup_20251015_143022

🔧 Adjusting 1,248 records...
✅ Adjustment complete!

🔍 Verifying adjustment...

📊 Latest 5 records after adjustment:
======================================================================
2024-10-29: Close = ₹1,250.00, Volume = 2,000,000 📌 (unchanged)
2024-10-28: Close = ₹1,250.00, Volume = 2,000,000 📌 (unchanged)
2024-10-27: Close = ₹1,250.00, Volume = 2,000,000 ✅ (adjusted)
2024-10-26: Close = ₹1,240.00, Volume = 2,100,000 ✅ (adjusted)
2024-10-25: Close = ₹1,230.00, Volume = 1,950,000 ✅ (adjusted)

======================================================================
✅ Historical Data Adjustment Complete!
======================================================================
📊 Summary:
  Symbol: RELIANCE
  Records Adjusted: 1,248
  Records Unchanged: 2
  Backup Table: nse_eod_data_backup_20251015_143022
  Price Adjustment: ÷2.00
  Volume Adjustment: ×2.00
======================================================================

💡 Next Steps:
  1. Run technical analysis to recalculate indicators
     ./venv/bin/python3 scripts/test-single-symbol.py RELIANCE
  2. If something went wrong, you can restore from backup table:
     Backup table: nse_eod_data_backup_20251015_143022
```

---

## Safety Features

### 1. Backup Created Automatically

Before any changes, script creates backup table:
```
nse_eod_data_backup_20251015_143022
```

### 2. Preview Before Execution

Shows exactly what will change before asking for confirmation.

### 3. Manual Confirmation Required

Must type `yes` to proceed (not just `y`).

### 4. Verification After Adjustment

Shows sample of adjusted data to verify correctness.

---

## After Adjustment

### Step 1: Recalculate Technical Indicators

```bash
# Test single symbol
./venv/bin/python3 scripts/test-single-symbol.py RELIANCE

# Or run full batch
./venv/bin/python3 scripts/analyze-symbols-duckdb.py
```

This will:
- Recalculate moving averages on corrected data
- Update RSI, MACD, Bollinger Bands
- Save corrected technicals to Firestore

### Step 2: Verify Charts

Check your frontend to ensure:
- ✅ Price charts look smooth (no huge jumps)
- ✅ Moving averages align with current price
- ✅ Indicators show correct signals

---

## Common Split/Bonus Ratios

### Splits:
- **1:2** - Most common (1 share → 2 shares)
- **1:3** - Moderately common (1 share → 3 shares)
- **1:5** - Less common (1 share → 5 shares)
- **1:10** - Rare (1 share → 10 shares)

### Bonuses:
- **1:1** - Most common (1 free share per 1 held = 2 total)
- **1:2** - Common (1 free share per 2 held = 1.5x total)
- **1:3** - Less common (1 free share per 3 held)

---

## Finding Split Information

### Option 1: NSE Website

Visit: https://www.nseindia.com/companies-listing/corporate-filings-actions

Search for symbol → Look for "Stock Split" or "Bonus" announcements

### Option 2: Company Websites

Most companies list corporate actions in Investor Relations section.

### Option 3: Financial News Sites

- Moneycontrol
- Economic Times
- BSE/NSE announcements

---

## Troubleshooting

### Error: "No data found for symbol"

**Cause**: Symbol not in DuckDB

**Fix**: Ensure symbol exists in database first
```bash
# Check if symbol exists
duckdb nse_data.duckdb "SELECT COUNT(*) FROM nse_eod_data WHERE symbol='RELIANCE'"
```

### Error: "No records found before ex-date"

**Cause**: All data is already after the ex-date

**Fix**: Check if you have the ex-date correct. Data might already be adjusted.

### Wrong Adjustment Applied

**Solution**: Restore from backup table
```sql
-- In DuckDB CLI:
DELETE FROM nse_eod_data WHERE symbol='RELIANCE';

INSERT INTO nse_eod_data
SELECT * FROM nse_eod_data_backup_20251015_143022;
```

---

## Best Practices

### 1. Find Ex-Date from Official Source

Always use official ex-date from NSE/BSE announcements.

### 2. Run on One Symbol First

Test with one symbol before doing batch adjustments.

### 3. Verify Before Full Batch

Check technical indicators after adjustment to ensure correctness.

### 4. Keep Backup Tables

Don't delete backup tables until you're confident adjustment is correct.

### 5. Document Adjustments

Keep a log of which symbols you've adjusted:
```
RELIANCE: 2024-10-28, 1:1 bonus ✅
TCS: 2022-09-16, 1:1 bonus ✅
WIPRO: 2019-07-18, 1:3 split ✅
```

---

## Known Issues & Limitations

### 1. Only Adjusts DuckDB

This script only fixes DuckDB historical data. It does NOT adjust:
- ❌ User portfolio positions (entry/stop-loss/target)
- ❌ Trading ideas
- ❌ Firestore data

Use separate scripts for those adjustments.

### 2. Requires Manual Input

You must provide split details manually. Not automated.

### 3. One Symbol at a Time

Cannot batch-adjust multiple symbols in one command.

---

## Example: Complete Workflow

### Scenario: Discovered RELIANCE had 1:1 bonus on Oct 28, 2024

**Step 1**: Adjust DuckDB historical data
```bash
python3 scripts/adjust-historical-split.py RELIANCE 2024-10-28 1:1 bonus
```

**Step 2**: Recalculate technical indicators
```bash
./venv/bin/python3 scripts/test-single-symbol.py RELIANCE
```

**Step 3**: Verify on frontend
- Check RELIANCE chart
- Verify moving averages align
- Confirm no huge price jumps

**Step 4**: (Future) Adjust user portfolios
```bash
# NOT YET IMPLEMENTED
python3 scripts/adjust-portfolio-for-split.py RELIANCE 2024-10-28 0.5
```

---

## Summary

✅ **Purpose**: Fix historical data in DuckDB for past splits/bonuses
✅ **Scope**: Only modifies DuckDB, not user data
✅ **Safety**: Creates backup, requires confirmation
✅ **Manual**: Requires you to provide split details
✅ **One-time**: Run once per symbol per corporate action

**Next Phase**: Create script to adjust user portfolios based on detected/adjusted splits.
