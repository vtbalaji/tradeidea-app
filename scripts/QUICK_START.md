# Quick Start Guide - EOD Data & Screeners

## ✅ Prerequisites

### Ensure Virtual Environment is Set Up
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web

# Check if venv exists
ls venv/

# If not, create it
python3 -m venv venv

# Activate and install dependencies
source venv/bin/activate
pip install jugaad-data duckdb pandas ta pytz firebase-admin
deactivate
```

## 🚀 One-Command Setup

### Run Everything at Once (Recommended)
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts

# Make executable (first time only)
chmod +x daily-eod-batch.sh

# Run the complete batch (automatically uses venv)
./daily-eod-batch.sh
```

**Note**: The batch script automatically activates the virtual environment, so you don't need to activate it manually.

**What it does:**
1. ✅ Fetches EOD data from NSE using `fetch-eod-data.py`
2. ✅ Runs technical analysis using `analyze-symbols.py`
3. ✅ Runs screeners (MA, Supertrend, Volume) using `screeners.py`
4. ✅ Saves all results to Firebase

---

## 📋 Step-by-Step (Manual)

If you need to run steps individually, activate venv first:

```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web
source venv/bin/activate
```

### Step 1: Fetch EOD Data
```bash
cd scripts
../venv/bin/python3 fetch-eod-data.py
```

**Expected output:**
```
📥 Fetching NSE EOD data...
🎯 Target trading day: 2025-10-13
Fetching RELIANCE...
✅ Stored 1 rows for RELIANCE
...
✅ Script completed
```

### Step 2: Run Technical Analysis
```bash
../venv/bin/python3 analyze-symbols.py
```

**Expected output:**
```
📊 Analyzing symbols...
Analyzing RELIANCE...
✅ Updated RELIANCE with technical data
...
✅ Analysis completed
```

### Step 3: Run Screeners
```bash
../venv/bin/python3 screeners.py
```

**Expected output:**
```
🔍 Stock Screeners: MA & Supertrend Crossovers & Volume Spikes
📊 Fetching symbols from DuckDB...
✅ Found 500 symbols

🔄 Scanning for crossovers and volume spikes...

🟢 BULLISH 50 MA CROSSOVERS (15 stocks):
Symbol       Yesterday    50 MA        Today        % Above MA
LGHL         ₹360.00      ₹350.00      ₹368.00      +2.34%
...

✅ Data saved to Firebase successfully
```

---

## ⚡ Quick Test (Single Symbol)

Test with just one symbol to verify everything works:

```bash
cd scripts
../venv/bin/python3 -c "
import sys
sys.path.insert(0, 'experimental')
from fetch_nse_data import NSEDataFetcher

# Fetch data
print('📥 Fetching RELIANCE...')
fetcher = NSEDataFetcher()
success = fetcher.fetch_and_store('RELIANCE')

if success:
    print('✅ Fetch successful!')

    # Get last 5 days
    df = fetcher.get_data('RELIANCE', days=5)
    print('\n📊 Last 5 days:')
    print(df)

    # Stats
    stats = fetcher.get_stats()
    print(f'\n📈 Database: {stats[\"total_rows\"]} rows, {stats[\"total_symbols\"]} symbols')
else:
    print('❌ Fetch failed')

fetcher.close()
"
```

---

## ⏰ Automated Daily Run

### Setup Cron Job
```bash
# Open crontab editor
crontab -e

# Add this line (runs at 4:30 PM IST daily)
30 16 * * * cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1
```

### Check Cron Status
```bash
# List active cron jobs
crontab -l

# Watch live logs
tail -f /tmp/eod-batch.log

# View last 50 lines
tail -n 50 /tmp/eod-batch.log
```

---

## 🔍 Verify Results

### 1. Check DuckDB Database
```bash
cd scripts/experimental
../../venv/bin/python3 -c "
from fetch_nse_data import NSEDataFetcher
fetcher = NSEDataFetcher()
stats = fetcher.get_stats()
print(f'📊 Total Rows: {stats[\"total_rows\"]:,}')
print(f'📊 Total Symbols: {stats[\"total_symbols\"]}')
print(f'📊 Date Range: {stats[\"min_date\"]} to {stats[\"max_date\"]}')
fetcher.close()
"
```

### 2. Check Firebase Collections
Go to Firebase Console:
- `macrossover50` - 50 MA crossovers
- `macrossover200` - 200 MA crossovers
- `supertrendcrossover` - Supertrend signals
- `volumespike` - Volume spikes

### 3. Check Web App
```bash
# Start dev server
npm run dev

# Visit:
# - http://localhost:3000/cross50200 (Screeners)
# - http://localhost:3000/ideas (Trading Ideas)
```

---

## 🐛 Troubleshooting

### Error: "serviceAccountKey.json not found"
```bash
# Ensure file exists in project root
ls /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/serviceAccountKey.json
```

### Error: "No data available"
**Cause**: Running before 4 PM IST (today's data not published)

**Solution**: Wait until after 4 PM or check date logic:
```bash
cd scripts/experimental
python3 test_date_logic.py
```

### Error: "Module not found"
```bash
# Install dependencies
pip3 install jugaad-data duckdb pandas ta pytz firebase-admin
```

### Database Locked
```bash
# Close other processes or delete database
rm scripts/experimental/data/eod.duckdb
# Re-run fetch
cd scripts && python3 fetch-eod-data.py
```

---

## 📊 Expected Timeline

| Time | Status | Action |
|------|--------|--------|
| Before 4 PM | ⏳ Waiting | Market still open, EOD data not ready |
| 4:00 PM | 📈 Market Close | NSE publishes EOD data |
| 4:30 PM | ✅ Run Batch | Fetch data & run screeners |
| 5:00 PM | 🎯 Ready | Results available in web app |

---

## 📝 Summary

**For first time setup:**
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts
chmod +x daily-eod-batch.sh
./daily-eod-batch.sh
```

**For daily automated run:**
```bash
crontab -e
# Add: 30 16 * * * cd /path/to/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1
```

**To check results:**
- View logs: `tail -f /tmp/eod-batch.log`
- Check web: `http://localhost:3000/cross50200`
- Verify DB: See "Verify Results" section above

---

## 🎯 What You Get

After running successfully:
1. ✅ Historical EOD data in DuckDB
2. ✅ Daily crossover signals in Firebase
3. ✅ Trading ideas with auto-calculated entry/SL/targets
4. ✅ Real-time screener results in web app
5. ✅ One-click conversion from screener to trading idea

**Next**: Open web app and click on any crossover signal to convert it to a trading idea! 🚀
