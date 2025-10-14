# Daily EOD Batch Workflow

Complete workflow for updating technical analysis, fundamentals, and screeners with EOD data.

## Prerequisites

Install required Python packages:

```bash
pip3 install --break-system-packages duckdb jugaad-data pandas numpy ta yfinance firebase-admin
```

## Daily Workflow (Run after 6 PM IST)

### 1. Fetch NSE EOD Data (Run First)

Fetches official NSE End-of-Day data and stores in DuckDB:

```bash
python3 scripts/fetch-eod-data.py
```

**What it does:**
- Fetches all symbols from Firebase (symbols collection + active positions/ideas)
- Downloads latest EOD data from NSE using `jugaad-data`
- Stores in `data/eod.duckdb` for fast local access
- Updates existing data incrementally (only fetches new dates)

**Duration:** ~5-10 minutes for ~2000 symbols

---

### 2. Run Technical Analysis (Yahoo Finance)

Calculates technical indicators using Yahoo Finance data:

```bash
python3 scripts/analyze-symbols.py
```

**What it does:**
- Fetches 2 years of data from Yahoo Finance
- Calculates: SMA, EMA, RSI, MACD, Bollinger Bands, Supertrend
- Saves to Firebase `symbols/{symbol}/technical`
- Used for real-time price display (`lastPrice`)

**Duration:** ~10-20 minutes for ~2000 symbols

---

### 3. Run Screeners (NSE EOD Data)

Detects crossovers and volume spikes using DuckDB NSE data:

```bash
python3 scripts/screeners.py
```

**What it does:**
- Uses NSE EOD data from DuckDB for accurate crossover detection
- Detects: 50 MA crossovers, 200 MA crossovers, Supertrend crossovers, Volume spikes
- Saves to Firebase collections: `macrossover50`, `macrossover200`, `supertrendcrossover`, `volumespike`
- Also fetches `lastPrice` from technical analysis for display consistency

**Duration:** ~2-3 minutes (fast due to local DuckDB)

---

## Data Source Summary

| Script | Data Source | Purpose | Price Field |
|--------|-------------|---------|-------------|
| `fetch-eod-data.py` | NSE (jugaad-data) | Store official EOD data | `close` |
| `analyze-symbols.py` | Yahoo Finance (yfinance) | Technical indicators | `lastPrice` |
| `screeners.py` | DuckDB (NSE EOD) | Crossover detection | `todayClose` + `lastPrice` |

## Why Two Price Sources?

**NSE EOD Data (`todayClose`):**
- Official exchange data
- Used for accurate crossover calculations
- Stored in DuckDB for fast queries
- Example: BIOCON = ₹353 (official closing)

**Yahoo Finance (`lastPrice`):**
- Used for technical analysis and real-time display
- May differ slightly from NSE due to adjustments
- Consistent across all UI displays
- Example: BIOCON = ₹349 (Yahoo data)

**Both prices are now saved** in screener results for flexibility.

---

## Complete Daily Script

Create a single script to run all three:

```bash
#!/bin/bash
# daily-eod-batch.sh

echo "🚀 Starting Daily EOD Batch Process"
echo "===================================="
echo "Run after 6 PM IST for accurate EOD data"
echo ""

# 1. Fetch NSE EOD Data
echo "📥 Step 1/3: Fetching NSE EOD Data..."
python3 scripts/fetch-eod-data.py
if [ $? -ne 0 ]; then
    echo "❌ EOD fetch failed!"
    exit 1
fi

# 2. Run Technical Analysis
echo ""
echo "📊 Step 2/3: Running Technical Analysis..."
python3 scripts/analyze-symbols.py
if [ $? -ne 0 ]; then
    echo "❌ Technical analysis failed!"
    exit 1
fi

# 3. Run Screeners
echo ""
echo "🔍 Step 3/3: Running Screeners..."
python3 scripts/screeners.py
if [ $? -ne 0 ]; then
    echo "❌ Screeners failed!"
    exit 1
fi

echo ""
echo "✅ Daily EOD Batch Process Completed!"
echo "===================================="
```

Save as `scripts/daily-eod-batch.sh` and make executable:

```bash
chmod +x scripts/daily-eod-batch.sh
```

Run daily:

```bash
./scripts/daily-eod-batch.sh
```

---

## Automation with Cron

To run automatically every day at 6:30 PM IST:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your project)
30 18 * * 1-5 cd /path/to/myportfolio-web && ./scripts/daily-eod-batch.sh >> logs/eod-batch.log 2>&1
```

This runs Monday-Friday at 6:30 PM IST (after market closes at 3:30 PM + NSE settlement time).

---

## Troubleshooting

### DuckDB Module Not Found

```bash
pip3 install --break-system-packages duckdb jugaad-data
```

### NSE API Errors / Rate Limiting

The `jugaad-data` library has built-in retry logic. If you see many failures:

1. Check NSE website is accessible: https://www.nseindia.com/
2. Reduce concurrent requests (script already includes 0.5s delay)
3. Run during off-peak hours (evening after 7 PM)

### Data Freshness Check

```bash
python3 -c "
import sys
sys.path.insert(0, 'scripts/experimental')
from fetch_nse_data import NSEDataFetcher
from datetime import datetime

fetcher = NSEDataFetcher()
stats = fetcher.get_stats()
print(f'Latest data: {stats[\"max_date\"]}')
print(f'Symbols: {stats[\"total_symbols\"]}')
print(f'Total rows: {stats[\"total_rows\"]:,}')
fetcher.close()
"
```

### Clear Old Data

To start fresh (if data is corrupted):

```bash
rm -rf data/eod.duckdb
python3 scripts/fetch-eod-data.py
```

---

## Performance Tips

1. **Run in sequence** - Each step depends on previous data
2. **Schedule after 6 PM IST** - Ensures NSE EOD data is available
3. **Monitor logs** - Track success/failure rates
4. **Incremental updates** - DuckDB only fetches new data after first run

---

## Next Steps

1. Run the fetch script now to populate DuckDB
2. Test the complete workflow manually
3. Set up cron job for daily automation
4. Monitor for first few days to ensure smooth operation
