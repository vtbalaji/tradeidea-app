# Scripts - EOD Data & Technical Analysis

## ⚡ Quick Start (2 Commands)

### First Time Setup
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web
./scripts/setup-venv.sh
```

### Daily EOD Batch (Run after 4 PM IST)
```bash
./scripts/daily-eod-batch.sh
```

This automatically:
1. ✅ **Activates virtual environment**
2. ✅ **Fetches NSE EOD data** → DuckDB (official NSE data with smart date logic)
3. ✅ **Runs technical analysis** → Firebase (calculates indicators)
4. ✅ **Runs screeners** → Firebase (finds crossovers & volume spikes)
5. ✅ **Deactivates virtual environment**

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[HOW_TO_RUN.md](HOW_TO_RUN.md)** - Detailed usage guide
- **[WORKFLOW.md](WORKFLOW.md)** - Visual workflow & data flow
- **[EOD_SMART_DATE_LOGIC.md](EOD_SMART_DATE_LOGIC.md)** - Date logic details

## 🐍 Virtual Environment

## ⚠️ CRITICAL: NEVER USE SYSTEM PYTHON

**All Python scripts MUST run in virtual environment (`venv/`).**

### ❌ WRONG - DON'T DO THIS:
```bash
python3 scripts/fetch-eod-data.py     # ❌ Uses system Python
python scripts/screeners.py           # ❌ Will fail
```

### ✅ CORRECT - ALWAYS DO THIS:
```bash
./venv/bin/python3 scripts/fetch-eod-data.py  # ✅ Uses venv Python
./scripts/daily-eod-batch.sh                   # ✅ Batch script uses venv
```

**See [IMPORTANT_VENV.md](IMPORTANT_VENV.md) for complete details.**

**Why?**
- ✅ Isolated dependencies (jugaad-data, duckdb, etc.)
- ✅ No conflicts with system Python
- ✅ Reproducible environment
- ✅ Works reliably everywhere (manual, cron, scripts)

---

# EOD Technical Analysis Batch Job

This script analyzes stock symbols from your TradeIdea platform and calculates technical indicators.

## Features

- ✅ Fetches EOD data from Yahoo Finance (free, no API key needed)
- ✅ Calculates 15+ technical indicators
- ✅ Detects key signals (MA cross, RSI levels, MACD, etc.)
- ✅ Stores results in Firestore
- ✅ Saves local backup in JSON files
- ✅ Generates overall buy/sell signals

## Technical Indicators Calculated

### Moving Averages
- SMA 20, 50, 200
- EMA 9, 21, 50

### Oscillators
- RSI (14-period)
- MACD (12, 26, 9)

### Bands
- Bollinger Bands (20-period, 2 std dev)

### Volume
- Average Volume (20-period)
- Volume spike detection

## Signals Detected

1. **Price Cross SMA200** - Price above/below 200-day moving average
2. **Price Cross EMA50** - Price above/below 50-day EMA
3. **RSI Overbought** - RSI > 70
4. **RSI Oversold** - RSI < 30
5. **MACD Bullish/Bearish** - MACD histogram positive/negative
6. **Volume Spike** - Volume > 2x average
7. **Golden Cross** - SMA50 crosses above SMA200 (bullish)
8. **Death Cross** - SMA50 crosses below SMA200 (bearish)

## Usage

### 1. Setup Firebase Admin (First Time Only)

Download your Firebase service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `serviceAccountKey.json` in project root
4. **Do NOT commit this file to git** (already in .gitignore)

### 2. Run the Analysis

```bash
# Run the batch job
npm run analyze

# Or directly with tsx
tsx scripts/analyze-symbols.ts
```

### 3. Schedule Daily Runs

**Option A: Manual (After Market Close)**
```bash
# Run at 6 PM IST after market closes
npm run analyze
```

**Option B: Cron Job (Linux/Mac)**
```bash
# Edit crontab
crontab -e

# Add this line (runs at 6 PM daily)
0 18 * * * cd /path/to/myportfolio-web && npm run analyze
```

**Option C: Windows Task Scheduler**
Create a task that runs daily at 6 PM:
```
Program: npm
Arguments: run analyze
Start in: C:\path\to\myportfolio-web
```

## Output

### Firestore Collections

1. **`/technicals/{symbol}`** - Technical analysis for each symbol
```json
{
  "symbol": "RELIANCE",
  "lastPrice": 2456.75,
  "rsi14": 58.23,
  "sma200": 2400.50,
  "ema50": 2430.15,
  "signals": {
    "priceCrossSMA200": "above",
    "priceCrossEMA50": "above",
    "goldenCross": true
  },
  "overallSignal": "BUY",
  "updatedAt": "2025-01-05T18:30:00Z"
}
```

2. **`/ideas/{ideaId}`** - Ideas updated with technical data
3. **`/portfolio/{positionId}`** - Portfolio positions updated with technical data

### Local Files

```
data/
├── RELIANCE.json
├── HDFCBANK.json
├── TCS.json
└── ...
```

Each file contains:
- Technical analysis
- Last 30 days OHLCV data
- Timestamp

## Example Output

```
🚀 Starting EOD Technical Analysis Batch Job

============================================================
📊 Fetching symbols from Firestore...
✅ Found 5 unique symbols

[1/5] Processing RELIANCE...
  Fetching RELIANCE...
  📈 Calculating indicators...
  💾 Saving to Firestore...
  📁 Saving to local file...
  ✅ RELIANCE - BUY
     Price: ₹2456.75 (+0.27%)
     RSI: 58.2 | SMA200: ₹2400.50 | EMA50: ₹2430.15
     🟢 Price ABOVE SMA200
     🟢 Price ABOVE EMA50

[2/5] Processing HDFCBANK...
  ...

============================================================
📊 Analysis Complete!
============================================================
✅ Success: 5 symbols
❌ Failed: 0 symbols
⏱️  Duration: 12.3s
📁 Data saved to: ./data/
============================================================
```

## Troubleshooting

### Error: "Insufficient data"
- Symbol may not be available on Yahoo Finance with `.NS` suffix
- Try adding `.BO` for BSE symbols in the script

### Error: "Firebase auth error"
- Make sure `serviceAccountKey.json` exists in project root
- Check that Firebase project ID matches in the file

### Error: "Too many requests"
- The script includes 1-second delays between requests
- If still hitting limits, increase delay in the script

## Configuration

Edit `scripts/analyze-symbols.ts` to customize:

- **Historical data period**: Change `days: 250` parameter
- **Rate limiting**: Adjust `setTimeout(resolve, 1000)` delay
- **Exchange**: Change `.NS` to `.BO` for BSE
- **Signal thresholds**: Modify RSI/MACD thresholds in signal calculation

## Data Sources

- **Yahoo Finance** - EOD data (free, unlimited)
- **NSE/BSE** - Live market data via broker APIs (future integration)

## Next Steps

After running the batch job, the technical data will be available in:
1. Firestore collections (accessible by your app)
2. Local JSON files (for backup/debugging)

You can then display this data in your idea cards and portfolio views.
