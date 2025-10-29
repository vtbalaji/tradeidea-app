# Batch Scripts - Orchestration & Automation

This folder contains shell scripts that orchestrate data processing pipelines. These are the **entry points** you call from cron jobs or manually.

## 📋 Scripts Overview

### 1. `daily-eod-batch.sh`
**Purpose:** Daily End-of-Day data processing pipeline

**What it does:**
- Fetches daily EOD (End-of-Day) price data for all symbols
- Calculates technical indicators (RSI, MACD, moving averages)
- Generates chart data for UI
- Updates DuckDB with latest prices

**When to run:** Daily after market close (e.g., 6 PM IST)

**Usage:**
```bash
./scripts/batch/daily-eod-batch.sh
```

**Cron example:**
```cron
0 18 * * 1-5 cd /path/to/project && ./scripts/batch/daily-eod-batch.sh
```

---

### 2. `weekly-fundamentals-batch.sh`
**Purpose:** Weekly XBRL fundamental data processing (LEGACY - use weekly-fundamentals-fetch.sh)

**What it does:**
- Downloads new XBRL files from NSE/BSE
- Parses XBRL financial statements
- Calculates fundamental ratios (PE, ROE, ROA, etc.)
- Updates fundamentals database
- Enriches with Yahoo Finance data

**When to run:** Weekly (e.g., Sunday night or Saturday)

**Usage:**
```bash
./scripts/batch/weekly-fundamentals-batch.sh
```

**Cron example:**
```cron
0 22 * * 0 cd /path/to/project && ./scripts/batch/weekly-fundamentals-batch.sh
```

---

### 2b. `weekly-fundamentals-fetch.sh` 🆕 NEW!
**Purpose:** Automated weekly XBRL download & processing (RECOMMENDED)

**What it does:**
1. **Smart Symbol Detection** - Gets companies with recent results (3 strategies):
   - Strategy 1: NSE event calendar API (most accurate)
   - Strategy 2: Top N companies by market cap (fallback)
   - Strategy 3: Static list of major companies (last resort)
2. **Incremental Downloads** - Only fetches recent results (avoids duplicates)
3. **Parse & Store** - Processes XBRL files → DuckDB
4. **Full Logging** - Complete audit trail

**When to run:** Weekly (or daily for frequent updates)

**Usage:**
```bash
# Run full pipeline
./scripts/batch/weekly-fundamentals-fetch.sh

# Manual steps (if needed):
# 1. Get symbols
./venv/bin/python3 scripts/fundamental/get_recent_results_symbols.py --days 7

# 2. Download
./venv/bin/python3 scripts/fundamental/fetch_nse_financial_results.py --file symbols_this_week.txt

# 3. Process
./venv/bin/python3 scripts/fundamental/xbrl_eod.py --dir ./xbrl
```

**Cron example:**
```cron
# Weekly on Sunday at 8 AM
0 8 * * 0 cd /path/to/project && ./scripts/batch/weekly-fundamentals-fetch.sh

# Or daily for frequent updates
0 19 * * 1-5 cd /path/to/project && ./scripts/batch/weekly-fundamentals-fetch.sh
```

**Features:**
- ✅ Reuses existing scripts (no code duplication)
- ✅ Smart duplicate prevention (DuckDB tracking)
- ✅ Multiple fallback strategies
- ✅ DuckDB only (no Firebase dependency)
- ✅ Comprehensive logging

---

### 3. `run-eod-with-quality-check.sh`
**Purpose:** EOD processing with data quality validation

**What it does:**
- Runs daily EOD fetch
- Validates data quality (missing data, outliers, etc.)
- Sends alerts if quality issues detected
- Includes rollback mechanism if needed

**When to run:** Alternative to daily-eod-batch.sh when you need validation

**Usage:**
```bash
./scripts/batch/run-eod-with-quality-check.sh
```

---

### 4. `process_downloaded_xbrl.sh`
**Purpose:** Process already-downloaded XBRL files

**What it does:**
- Scans `xbrl/` directory for new files
- Processes each XBRL file through pipeline
- Calculates fundamental ratios
- Updates database
- Organizes processed files

**When to run:** After manual XBRL file downloads or bulk processing

**Usage:**
```bash
./scripts/batch/process_downloaded_xbrl.sh
```

**Example - Process specific directory:**
```bash
XBRL_DIR=/path/to/xbrl/files ./scripts/batch/process_downloaded_xbrl.sh
```

---

### 5. `top50.sh`
**Purpose:** Update Top 50 companies by market cap

**What it does:**
- Fetches current market caps for all symbols
- Sorts and identifies top 50 companies
- Updates database/cache with top 50 list
- Used for prioritizing chart data generation

**When to run:** Weekly or after significant market moves

**Usage:**
```bash
./scripts/batch/top50.sh
```

---

## 🔄 Typical Workflow

### Daily Workflow:
```bash
# 1. After market close, run EOD processing
./scripts/batch/daily-eod-batch.sh

# 2. Optional: Update top 50 if needed
./scripts/batch/top50.sh
```

### Weekly Workflow:
```bash
# 1. Download and process XBRL data (NEW - RECOMMENDED)
./scripts/batch/weekly-fundamentals-fetch.sh

# OR use legacy script
./scripts/batch/weekly-fundamentals-batch.sh

# 2. Update top companies list
./scripts/batch/top50.sh
```

### Manual XBRL Processing:
```bash
# After downloading XBRL files manually
./scripts/batch/process_downloaded_xbrl.sh
```

---

## ⚙️ Configuration

Most scripts use environment variables or config files. Set these before running:

```bash
# Database paths (usually default)
export EOD_DB="data/eod.duckdb"
export FUNDAMENTALS_DB="data/fundamentals.duckdb"

# XBRL directories
export XBRL_DIR="xbrl/"

# Run script
./scripts/batch/daily-eod-batch.sh
```

---

## 🐛 Troubleshooting

**Script fails with "Permission denied":**
```bash
chmod +x scripts/batch/*.sh
```

**Python scripts not found:**
- Ensure virtual environment is activated
- Check that Python scripts are in correct folders

**Database locked:**
- Another process might be using DuckDB
- Wait and retry, or check for zombie processes

---

## 📝 Logging

All batch scripts log to:
- `logs/daily-eod-YYYY-MM-DD.log`
- `logs/weekly-fundamentals-YYYY-MM-DD.log`

Check logs if scripts fail:
```bash
tail -f logs/daily-eod-*.log
```

---

## 🔗 Related Folders

- `scripts/technical/` - EOD data fetching scripts
- `scripts/fundamental/` - XBRL processing scripts
- `scripts/admin/` - Setup and deployment scripts

---

**Last Updated:** October 28, 2025
