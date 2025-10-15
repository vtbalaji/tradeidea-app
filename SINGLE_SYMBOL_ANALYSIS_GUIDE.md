# Single Symbol Analysis with Auto-Split Detection

## Overview

The `analyze-symbols-duckdb.py` script now supports **two modes**:

1. **Single Symbol Mode** - With split detection & adjustment
2. **Batch Mode** - All symbols, technical analysis only

---

## 🎯 Single Symbol Mode

### Usage:

```bash
python3 scripts/analyze-symbols-duckdb.py SYMBOL_NAME
```

### Example:

```bash
python3 scripts/analyze-symbols-duckdb.py ADANIPOWER
```

---

## 🔄 What Happens in Single Symbol Mode

### Step 1: Fetch Historical Data
```
📦 Connecting to DuckDB...
📥 Fetching historical data for ADANIPOWER...
✅ Fetched 730 rows
```

### Step 2: Auto-Detect Corporate Actions
```
🔍 Checking for corporate actions...

🚨 CORPORATE ACTION DETECTED!
   Type: 1:5 split
   Date: 2025-09-22
   Price Change: -80.0%
   Old Price: ₹658.55
   New Price: ₹131.71
   Ratio: 0.2000
```

### Step 3: Ask for Confirmation
```
⚠️  This indicates a potential split.
   Historical data in DuckDB needs adjustment.

   What will be adjusted:
   - All prices BEFORE 2025-09-22 (divided)
   - All volumes BEFORE 2025-09-22 (multiplied)

🚨 Adjust DuckDB data for this split? (yes/no):
```

### Step 4: Get Split Details (if confirmed)
```
📝 Please provide split/bonus details:
   Ex-date (YYYY-MM-DD) [2025-09-22]: ← Press Enter to accept
   Ratio (e.g., 1:2, 1:5) [1:5]: ← Press Enter to accept
```

### Step 5: Adjust DuckDB
```
🔧 Adjusting DuckDB historical data...

📊 Split Adjustment Parameters:
   Price Multiplier: 0.2000 (prices divided)
   Volume Multiplier: 5.0000 (volumes multiplied)

💾 Creating backup: ohlcv_backup_20251015_150530
🔧 Adjusting historical data before 2025-09-22...
✅ DuckDB data adjusted successfully!
   Backup table: ohlcv_backup_20251015_150530

📥 Re-fetching adjusted data...
✅ Fetched 730 rows
```

### Step 6: Run Technical Analysis
```
📈 Calculating technical indicators...

💾 Saving to Firestore...
```

### Step 7: Display Results
```
📊 Technical Analysis Results:
======================================================================
Signal: BUY
Price: ₹149.60 (+1.23%)
Weekly: +2.5% | Monthly: +8.7% | Quarterly: +15.3%
RSI: 62.3
50 EMA: ₹145.20
100 MA: ₹138.50
200 MA: ₹120.80
Supertrend: ₹142.00 🟢 Bullish
======================================================================
✅ Analysis complete for ADANIPOWER
```

---

## 📦 Batch Mode (No Split Detection)

### Usage:

```bash
python3 scripts/analyze-symbols-duckdb.py
```

### What It Does:

1. ✅ Fetches all symbols from Firestore
2. ✅ Runs technical analysis on each
3. ❌ **NO** split detection
4. ❌ **NO** DuckDB adjustment
5. ✅ Saves results to Firestore

**Use this for daily EOD batch jobs.**

---

## 🆚 Comparison

| Feature | Single Symbol Mode | Batch Mode |
|---------|-------------------|------------|
| **Command** | `python3 scripts/analyze-symbols-duckdb.py SYMBOL` | `python3 scripts/analyze-symbols-duckdb.py` |
| **Split Detection** | ✅ Yes | ❌ No |
| **DuckDB Adjustment** | ✅ Yes (with confirmation) | ❌ No |
| **Technical Analysis** | ✅ Yes | ✅ Yes |
| **Save to Firestore** | ✅ Yes | ✅ Yes |
| **Interactive** | ✅ Yes (asks for confirmation) | ❌ No (fully automated) |
| **Use Case** | Fix individual symbols with splits | Daily batch processing |

---

## 🎬 Complete Example: ADANIPOWER

```bash
$ python3 scripts/analyze-symbols-duckdb.py ADANIPOWER

======================================================================
🔍 Single Symbol Analysis: ADANIPOWER
======================================================================
📦 Connecting to DuckDB...

📥 Fetching historical data for ADANIPOWER...
  📥 Fetching data for ADANIPOWER from DuckDB...
  ✅ Fetched 730 rows

🔍 Checking for corporate actions...

🚨 CORPORATE ACTION DETECTED!
   Type: 1:5 split
   Date: 2025-09-22
   Price Change: -80.0%
   Old Price: ₹658.55
   New Price: ₹131.71
   Ratio: 0.2000

⚠️  This indicates a potential split.
   Historical data in DuckDB needs adjustment.

   What will be adjusted:
   - All prices BEFORE 2025-09-22 (divided)
   - All volumes BEFORE 2025-09-22 (multiplied)

🚨 Adjust DuckDB data for this split? (yes/no): yes

📝 Please provide split/bonus details:
   Ex-date (YYYY-MM-DD) [2025-09-22]:
   Ratio (e.g., 1:2, 1:5) [1:5]:

🔧 Adjusting DuckDB historical data...

📊 Split Adjustment Parameters:
   Price Multiplier: 0.2000 (prices divided)
   Volume Multiplier: 5.0000 (volumes multiplied)

💾 Creating backup: ohlcv_backup_20251015_150530
🔧 Adjusting historical data before 2025-09-22...
✅ DuckDB data adjusted successfully!
   Backup table: ohlcv_backup_20251015_150530

📥 Re-fetching adjusted data...
  📥 Fetching data for ADANIPOWER from DuckDB...
  ✅ Fetched 730 rows

📈 Calculating technical indicators...

💾 Saving to Firestore...

📊 Technical Analysis Results:
======================================================================
Signal: BUY
Price: ₹149.60 (+1.23%)
Weekly: +2.5% | Monthly: +8.7% | Quarterly: +15.3%
RSI: 62.3
50 EMA: ₹145.20
100 MA: ₹138.50
200 MA: ₹120.80
Supertrend: ₹142.00 🟢 Bullish
======================================================================
✅ Analysis complete for ADANIPOWER

✅ Job completed
```

---

## 💡 When to Use Each Mode

### Use Single Symbol Mode When:
- ✅ You discover a stock had a split/bonus
- ✅ You want to fix one symbol's historical data
- ✅ You need to verify split detection works
- ✅ You want interactive control

### Use Batch Mode When:
- ✅ Running daily EOD batch jobs
- ✅ Updating all symbols at once
- ✅ You've already fixed all splits
- ✅ Fully automated processing needed

---

## 🛡️ Safety Features

### 1. Automatic Backup
Every adjustment creates a backup table:
```
ohlcv_backup_20251015_150530
```

### 2. Manual Confirmation Required
Script asks `yes/no` before adjusting.

### 3. Interactive Input
You can override detected values:
- Ex-date
- Split ratio

### 4. No Adjustment in Batch Mode
Batch mode never adjusts DuckDB (safe for automation).

---

## 🔍 Detection Logic

### What Gets Detected:

**Splits** (40-60% price drop):
- 1:2 split (50% drop)
- 1:3 split (33% drop)
- 1:4 split (25% drop)
- 1:5 split (20% drop)
- 1:10 split (10% drop)

**Bonuses** (10-35% price drop):
- 1:1 bonus (50% drop)
- 1:2 bonus (33% drop)
- 1:3 bonus (25% drop)

### What Does NOT Get Detected:
- ❌ Dividends (no adjustment needed)
- ❌ Normal price movements
- ❌ Splits that already happened long ago and data is adjusted

---

## 📝 Examples

### Example 1: ADANIPOWER (1:5 split)
```bash
python3 scripts/analyze-symbols-duckdb.py ADANIPOWER
# Follow prompts, press Enter to accept defaults
```

### Example 2: RELIANCE (1:1 bonus)
```bash
python3 scripts/analyze-symbols-duckdb.py RELIANCE
# Detected as bonus
# Adjust DuckDB if prompted
```

### Example 3: Symbol with NO split
```bash
python3 scripts/analyze-symbols-duckdb.py INFY

# Output:
# 🔍 Checking for corporate actions...
#    ✅ No corporate actions detected
# 📈 Calculating technical indicators...
# ...
```

### Example 4: Decline adjustment
```bash
python3 scripts/analyze-symbols-duckdb.py WIPRO

# 🚨 Adjust DuckDB data for this split? (yes/no): no
# ⏭️  Skipping DuckDB adjustment
# 📈 Calculating technical indicators...
# (continues with unadjusted data)
```

---

## 🚨 Important Notes

### 1. Single Symbol Mode Only
Split detection and adjustment **ONLY** happens when you provide a symbol name.

### 2. Batch Mode Never Adjusts
Running without arguments processes all symbols but **NEVER** adjusts DuckDB.

### 3. Backup Created
Always creates backup before adjustment.

### 4. Re-fetches Data
After adjustment, data is re-fetched to ensure calculations use corrected values.

### 5. Logs to Firestore
Detected splits are logged to `corporateActions` collection for tracking.

---

## 🔄 Workflow Recommendation

### For Known Splits:
1. Run single symbol mode
2. Confirm adjustment when prompted
3. Accept default ex-date and ratio (or override)
4. Review technical analysis results

### For Regular Updates:
1. Run batch mode daily
2. No interaction needed
3. Fully automated

### For Discovering Splits:
1. Check `corporateActions` collection in Firestore
2. Review detected splits
3. Run single symbol mode to adjust each
4. Verify results

---

## 📊 Summary

✅ **Single Symbol Mode**:
- Command: `python3 scripts/analyze-symbols-duckdb.py SYMBOL`
- Detects splits
- Adjusts DuckDB with confirmation
- Interactive
- Perfect for fixing individual symbols

✅ **Batch Mode**:
- Command: `python3 scripts/analyze-symbols-duckdb.py`
- No split detection
- No DuckDB adjustment
- Fully automated
- Perfect for daily jobs

**Choose the right mode for your needs!**
