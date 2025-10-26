# Batch Processes Summary

## Overview

All data is updated automatically by running two batch processes:
1. **Daily EOD Batch** - Runs after market close (4:15 PM IST)
2. **Weekly Fundamentals Batch** - Runs weekly (Sunday 8 AM IST)

## Daily EOD Batch

**Script**: `scripts/daily-eod-batch.sh`

**Schedule**: Daily at 4:15 PM IST (after market close)

**Cron Entry**:
```bash
15 16 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1
```

**Process Flow**:

```
1. Fetch NSE EOD Data
   └─ scripts/fetch-eod-data.py
      └─ Updates: DuckDB (price_data table) + Firebase (symbols collection)

2. Fetch Nifty 50 Index Data
   └─ scripts/fetch-nifty50-index.py
      └─ Updates: Firebase (nifty50 collection)

3. Run Technical Analysis
   └─ scripts/analyze-symbols-duckdb.py
      └─ Calculates: RSI, MACD, Darvas Box, Support/Resistance
      └─ Updates: Firebase (symbols collection with technical indicators)

4. Run Screeners
   └─ scripts/screeners.py
      └─ Runs: Momentum, Darvas Box, SMA Crossover screeners
      └─ Updates: Firebase (screener results)

5. Cleanup Old Firebase Data
   └─ scripts/cleanup-firebase.py
      └─ Cleans: Old price data (keeps 500 days)

6. Generate Chart Data
   └─ scripts/generate-chart-data.py
      └─ Generates: Chart JSON files for top 250 stocks
      └─ Updates: public/chart-data/ folder

7. Manage Portfolio Stop-Loss
   └─ scripts/manage-portfolio-stoploss.py
      └─ Monitors: User portfolios for stop-loss triggers
      └─ Updates: Firebase (portfolio positions)

8. Check and Generate Alerts
   └─ scripts/check-and-generate-alerts.py
      └─ Checks: Price targets, stop-loss, technical signals
      └─ Updates: Firebase (alerts collection)
```

**Duration**: ~5-10 minutes for 1000+ stocks

**Logs**: `logs/eod-batch-YYYYMMDD_HHMMSS.log`

---

## Weekly Fundamentals Batch

**Script**: `scripts/weekly-fundamentals-batch.sh`

**Schedule**: Weekly on Sunday at 8:00 AM IST

**Cron Entry**:
```bash
0 8 * * 0 /path/to/myportfolio-web/scripts/weekly-fundamentals-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1
```

**Process Flow**:

```
1. Run Fundamentals Analysis
   └─ scripts/analyze-fundamentals.py
      │
      ├─ For each stock symbol:
      │  │
      │  ├─ Fetch Yahoo Finance fundamentals
      │  │  └─ Gets: PE, PEG, ROE, ROA, D/E, margins, growth rates
      │  │
      │  ├─ Calculate PEG Ratio (3-year CAGR)
      │  │  └─ scripts/peg_calculator.py
      │  │
      │  ├─ Calculate Piotroski F-Score
      │  │  └─ 9-point fundamental strength score
      │  │
      │  ├─ Calculate Fundamental Score
      │  │  └─ 0-100 composite score
      │  │
      │  ├─ UPDATE FIREBASE
      │  │  └─ symbols/{symbol}/fundamental
      │  │     ├─ All fundamental metrics
      │  │     ├─ PEG ratio
      │  │     ├─ Piotroski F-Score
      │  │     └─ Fundamental score & rating
      │  │
      │  └─ UPDATE DUCKDB
      │     │
      │     ├─ Store Yahoo quarterly fundamentals
      │     │  └─ scripts/yahoo_fundamentals_fetcher.py
      │     │     ├─ yahoo_quarterly_fundamentals table
      │     │     └─ yahoo_current_fundamentals table
      │     │
      │     └─ Enrich XBRL data for forensic analysis
      │        └─ scripts/yahoo_xbrl_enricher.py
      │           └─ Adds to xbrl_data table:
      │              ├─ market_cap (from Yahoo)
      │              ├─ current_price (from Yahoo)
      │              └─ yahoo_enriched_at timestamp
```

**Duration**: ~30-60 minutes for 1000+ stocks

**Logs**: `logs/fundamentals-batch-YYYYMMDD_HHMMSS.log`

---

## What Gets Updated

### Firebase (Real-time Database)

| Collection | Updated By | Frequency | Purpose |
|------------|-----------|-----------|---------|
| `symbols/{symbol}` | Daily + Weekly | Daily + Weekly | Stock prices, technicals, fundamentals |
| `symbols/{symbol}/prices` | Daily | Daily | Historical price data |
| `symbols/{symbol}/technical` | Daily | Daily | Technical indicators (RSI, MACD, Darvas) |
| `symbols/{symbol}/fundamental` | Weekly | Weekly | Fundamental metrics (PE, ROE, etc.) |
| `screeners/*` | Daily | Daily | Screener results |
| `nifty50` | Daily | Daily | Nifty 50 index data |
| `alerts/*` | Daily | Daily | Price alerts, stop-loss alerts |
| `users/{userId}/positions` | Daily | Daily | Portfolio stop-loss monitoring |

### DuckDB (Local Database)

| Table | Updated By | Frequency | Purpose |
|-------|-----------|-----------|---------|
| `price_data` | Daily | Daily | Historical price/volume data |
| `yahoo_quarterly_fundamentals` | Weekly | Weekly | Yahoo quarterly financial data |
| `yahoo_current_fundamentals` | Weekly | Weekly | Yahoo current snapshot |
| `xbrl_data` | Weekly (enrichment) | Weekly | NSE XBRL financial data + Yahoo enrichment |

### File System

| Location | Updated By | Frequency | Purpose |
|----------|-----------|-----------|---------|
| `public/chart-data/` | Daily | Daily | Chart JSON files for web app |
| `logs/` | Both | Daily + Weekly | Batch process logs |

---

## XBRL / Forensic Analysis

**NOT** part of automated batches (run manually when needed):

```bash
# Fetch NSE financial results (XBRL data)
python3 scripts/fetch_nse_financial_results.py

# Run forensic analysis on a stock
python3 scripts/forensics/forensic_analyzer.py TCS --statement-type consolidated
```

**XBRL Scripts** (manual):
- `scripts/fetch_nse_financial_results.py` - Download XBRL files from NSE
- `scripts/xbrl_eod.py` - Process XBRL files EOD-style
- `scripts/organize_xbrl_files.py` - Organize downloaded XBRL files
- `scripts/backfill_download_tracking.py` - Backfill download tracking

**Forensic Analysis** (manual):
- `scripts/forensics/forensic_analyzer.py` - Main forensic analysis
- `scripts/forensics/beneish_m_score.py` - Earnings manipulation detection
- `scripts/forensics/altman_z_score.py` - Bankruptcy prediction
- `scripts/forensics/piotroski_f_score.py` - Fundamental strength
- `scripts/forensics/j_score.py` - Cash flow quality
- `scripts/forensics/red_flags.py` - Financial anomaly detection

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY EOD BATCH                          │
│                  (After Market Close)                       │
│                                                             │
│  NSE Website → fetch-eod-data.py → DuckDB + Firebase       │
│                                                             │
│  DuckDB → analyze-symbols-duckdb.py → Firebase             │
│           (Technical Analysis)                              │
│                                                             │
│  Firebase → screeners.py → Firebase                         │
│            (Screener Results)                               │
│                                                             │
│  Firebase → generate-chart-data.py → public/chart-data/    │
│                                                             │
│  Firebase → manage-portfolio-stoploss.py → Firebase        │
│                                                             │
│  Firebase → check-and-generate-alerts.py → Firebase        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  WEEKLY FUNDAMENTALS BATCH                  │
│                    (Sunday Morning)                         │
│                                                             │
│  Yahoo Finance → analyze-fundamentals.py                    │
│                  │                                          │
│                  ├─→ Firebase (fundamentals)               │
│                  │                                          │
│                  └─→ DuckDB                                 │
│                      ├─ yahoo_quarterly_fundamentals        │
│                      ├─ yahoo_current_fundamentals          │
│                      └─ xbrl_data (enrichment)              │
│                         └─ Enables Forensic Analysis!       │
└─────────────────────────────────────────────────────────────┘
```

---

## Running Batches Manually

### Daily EOD Batch
```bash
cd /path/to/myportfolio-web
./scripts/daily-eod-batch.sh
```

### Weekly Fundamentals Batch
```bash
cd /path/to/myportfolio-web
./scripts/weekly-fundamentals-batch.sh
```

### Single Stock Update
```bash
# Update fundamentals for one stock
python3 scripts/analyze-fundamentals.py TCS

# Update EOD data for specific date
python3 scripts/fetch-eod-data.py --date 2025-10-25
```

---

## Monitoring

### Check Logs
```bash
# Latest EOD batch log
tail -f logs/eod-batch-*.log

# Latest fundamentals batch log
tail -f logs/fundamentals-batch-*.log

# Error logs
cat logs/eod-batch-error.log
cat logs/fundamentals-batch-error.log
```

### Check Data Freshness
```bash
# Check latest price data in DuckDB
duckdb data/fundamentals.duckdb "SELECT symbol, MAX(date) as latest FROM price_data GROUP BY symbol LIMIT 5"

# Check Firebase updates
# (Use Firebase Console)
```

---

## Summary

✅ **YES** - Running `daily-eod-batch.sh` and `weekly-fundamentals-batch.sh` keeps ALL data up to date:
- ✅ Firebase (for web app)
- ✅ DuckDB (for analysis)
- ✅ Chart data (for charts)
- ✅ XBRL enrichment (for forensic analysis)

🎯 **Everything is connected and automated!**

---

Last Updated: 2025-10-25
