# Batch Jobs Setup Guide

## Overview

Your portfolio system has two main batch jobs:

### 1. **Daily EOD Batch** (Existing)
- **What**: Fetches stock prices and technical indicators
- **When**: Daily after market close (4:15 PM IST)
- **Script**: `scripts/daily-eod-batch.sh`
- **Data**: Stock prices, technical analysis, Nifty 50 index

### 2. **Weekly Fundamentals Batch** (New)
- **What**: Fetches company fundamentals (sector, industry, market cap, beta)
- **When**: Weekly (recommended: Sunday 8 AM IST)
- **Script**: `scripts/weekly-fundamentals-batch.sh`
- **Data**: Sector, industry, market cap, beta, PE, ROE, etc.

## Cron Job Setup

### Current Setup (Daily)
```bash
# Daily EOD at 4:15 PM IST (already configured)
15 16 * * * cd /path/to/myportfolio-web && ./scripts/daily-eod-batch.sh >> logs/cron.log 2>&1
```

### Add Weekly Fundamentals
```bash
# Edit crontab
crontab -e

# Add this line (runs every Sunday at 8:00 AM IST)
0 8 * * 0 cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web && ./scripts/weekly-fundamentals-batch.sh >> logs/cron.log 2>&1
```

## Manual Execution

### Run Daily Batch
```bash
./scripts/daily-eod-batch.sh
```

### Run Weekly Fundamentals
```bash
./scripts/weekly-fundamentals-batch.sh
```

### Run in Background
```bash
# Daily batch
nohup ./scripts/daily-eod-batch.sh > logs/daily-$(date +%Y%m%d).log 2>&1 &

# Weekly fundamentals
nohup ./scripts/weekly-fundamentals-batch.sh > logs/fundamentals-$(date +%Y%m%d).log 2>&1 &
```

## What Each Job Does

### Daily EOD Batch (Steps 1-6)
1. **Fetch NSE EOD Data** - Stock prices from NSE
2. **Fetch Nifty 50 Index** - Benchmark data
3. **Technical Analysis** - Calculate indicators (MA, RSI, MACD, etc.)
4. **Run Screeners** - Find stocks matching criteria
5. **Generate Chart Data** - Pre-calculate chart data
6. **Manage Stop-Loss** - Check positions and send alerts

### Weekly Fundamentals Batch
1. **Fetch Company Info** - Sector, industry from Yahoo Finance
2. **Fetch Financial Data** - Market cap, beta, PE, ROE, etc.
3. **Calculate Scores** - Fundamental strength score (0-100)
4. **Save to Firestore** - Update symbols collection

## Why Weekly for Fundamentals?

- ✅ **Fundamentals change slowly** - Company data doesn't change daily
- ✅ **Reduces API calls** - Yahoo Finance has rate limits
- ✅ **Faster daily batch** - Keep daily jobs focused on prices
- ✅ **Sufficient for analysis** - Weekly updates are enough for fundamental analysis

## Monitoring

### Check Daily Batch
```bash
# View latest log
tail -f logs/eod-batch-*.log

# Check status
ps aux | grep daily-eod-batch
```

### Check Weekly Batch
```bash
# View latest log
tail -f logs/fundamentals-batch-*.log

# Count completed symbols
grep "✅" logs/fundamentals-batch-*.log | wc -l
```

### Check Firestore Data
```bash
# Verify data was saved
./venv/bin/python3 -c "
from firebase_admin import credentials, firestore
import firebase_admin

firebase_admin.initialize_app(credentials.Certificate('serviceAccountKey.json'))
db = firestore.client()

# Check a symbol
doc = db.collection('symbols').document('NS_RELIANCE').get()
if doc.exists:
    data = doc.to_dict()
    print(f\"Sector: {data.get('sector')}\")
    print(f\"Market Cap: {data.get('fundamental', {}).get('marketCap')}\")
"
```

## Troubleshooting

### Daily Batch Not Running
1. Check cron is active: `crontab -l`
2. Check logs: `tail -f logs/eod-batch-error.log`
3. Verify venv: `./venv/bin/python3 --version`

### Fundamentals Not Updating
1. Check if job ran: `ls -lt logs/fundamentals-batch-*.log`
2. Check for errors: `grep "ERROR\|❌" logs/fundamentals-batch-*.log`
3. Verify Yahoo Finance access: Test one symbol manually

### Risk Analysis Shows "Unknown" Sectors
1. Run fundamentals batch: `./scripts/weekly-fundamentals-batch.sh`
2. Wait for completion (15-30 minutes)
3. Refresh risk analysis page
4. Check Firebase console for data

## Performance

### Daily Batch
- **Duration**: ~2-3 hours for 2165 symbols
- **When**: 4:15 PM - 7:00 PM IST
- **Impact**: None on web app (reads from DuckDB)

### Weekly Batch
- **Duration**: ~15-30 minutes for 2157 symbols
- **When**: Sunday 8:00 AM - 8:30 AM IST
- **Impact**: Minimal (updates Firestore)

## Data Flow

```
┌─────────────────────────────────────────────────┐
│                DAILY EOD BATCH                  │
├─────────────────────────────────────────────────┤
│ NSE (jugaad-data) → DuckDB → Firestore         │
│ • Stock prices (OHLCV)                          │
│ • Nifty 50 index                                │
│ • Technical indicators                          │
└─────────────────────────────────────────────────┘
                      ↓
            ┌─────────────────┐
            │   Web App Reads │
            │   from Firestore│
            └─────────────────┘

┌─────────────────────────────────────────────────┐
│            WEEKLY FUNDAMENTALS BATCH            │
├─────────────────────────────────────────────────┤
│ Yahoo Finance → Firestore (symbols collection)  │
│ • Sector, Industry                              │
│ • Market Cap, Beta                              │
│ • PE, ROE, Debt/Equity                          │
└─────────────────────────────────────────────────┘
                      ↓
            ┌─────────────────┐
            │   Risk Analysis │
            │   Uses This Data│
            └─────────────────┘
```

## First-Time Setup Checklist

- [x] ✅ Daily EOD batch configured in cron
- [x] ✅ Weekly fundamentals script created
- [ ] ⏳ Add weekly fundamentals to cron
- [x] ✅ Test fundamentals batch manually (running now)
- [ ] ⏳ Verify data in Firestore after completion
- [ ] ⏳ Confirm risk analysis shows sectors correctly

---

**Last Updated**: October 17, 2025
**Status**: Fundamentals batch running (first-time population in progress)
