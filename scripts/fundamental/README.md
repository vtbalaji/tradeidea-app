# Fundamental Analysis Scripts - XBRL Processing

Scripts for parsing XBRL financial statements, calculating fundamental ratios, and storing in DuckDB.

## 📋 Scripts Overview

### 1. `xbrl_parser_v3.py`
**Purpose:** Parse XBRL financial statement files

**What it does:**
- Parses XML-based XBRL files from NSE/BSE
- Extracts financial data:
  - Balance Sheet (assets, equity, liabilities)
  - P&L Statement (revenue, expenses, profit)
  - Cash Flow Statement
  - Per-share metrics (EPS, DPS, book value)
- Handles Indian accounting taxonomies (Ind AS, Banking, NBFC)
- Detects statement type (consolidated vs standalone)
- Auto-detects fiscal year and quarter

**Usage:**
```bash
# Parse single file
python scripts/fundamental/xbrl_parser_v3.py --file xbrl/TCS_FY2025_Q2_Consolidated.xml

# Parse and display data
python scripts/fundamental/xbrl_parser_v3.py --file xbrl/TCS.xml --verbose
```

**Returns:** Dictionary with extracted financial data

---

### 2. `xbrl_eod.py`
**Purpose:** Main XBRL processing pipeline (end-to-end)

**What it does:**
- **Complete pipeline:**
  1. Parse XBRL file → Extract data
  2. Fetch current market price (for PE, PB calculation)
  3. Calculate 40+ fundamental ratios
  4. Store in DuckDB
  5. Update Firebase (latest quarter only)
- Supports both consolidated and standalone statements
- Tracks processed files (prevents duplicates)
- Handles errors gracefully

**Usage:**
```bash
# Process all files for a symbol
python scripts/fundamental/xbrl_eod.py --symbol TCS

# Process only consolidated files
python scripts/fundamental/xbrl_eod.py --symbol TCS --prefer consolidated

# Process only standalone files
python scripts/fundamental/xbrl_eod.py --symbol RELIANCE --prefer standalone

# Process all files in directory
python scripts/fundamental/xbrl_eod.py --dir ./xbrl

# Reprocess failed files
python scripts/fundamental/xbrl_eod.py --retry-failed
```

**Output:**
- Database: `data/fundamentals.duckdb`
- Table: `xbrl_data` (single consolidated table)
- Firebase: `symbols/{symbol}/fundamentals` (latest quarter only)

---

### 3. `fundamental_calculator.py`
**Purpose:** Calculate fundamental ratios from XBRL data

**What it does:**
- Takes raw XBRL data + current price
- Calculates 40+ ratios:
  - **Valuation:** PE, PB, PS, EV/EBITDA
  - **Profitability:** ROE, ROA, ROCE, Margins
  - **Liquidity:** Current Ratio, Quick Ratio
  - **Leverage:** Debt/Equity, Interest Coverage
  - **Efficiency:** Asset Turnover, Receivables Turnover
  - **Per Share:** EPS, Book Value, Revenue/Share
- **Special handling:**
  - TTM EPS for quarterly reports (Q1-Q3)
  - Actual EPS stored, TTM EPS calculated separately

**Usage (imported by other scripts):**
```python
from fundamental_calculator import FundamentalCalculator

calc = FundamentalCalculator()
ratios = calc.calculate(
    xbrl_data=parsed_data,
    symbol='TCS',
    current_price=3500.50,
    quarter='Q2',
    is_annual=False
)

print(f"PE Ratio: {ratios['PE']}")
print(f"ROE: {ratios['ROE']}%")
print(f"EPS: {ratios['EPS']}")
```

**Key fix applied:**
- EPS field now stores actual quarterly/annual EPS
- TTM EPS stored separately in `EPS_TTM` field

---

### 4. `fundamental_xbrl_storage.py`
**Purpose:** DuckDB storage layer for XBRL data

**What it does:**
- Creates/manages DuckDB schema
- Stores raw XBRL data + calculated ratios in single table
- **Schema:** 100+ columns including:
  - Raw data (assets, revenue, profit, etc.)
  - Calculated ratios (PE, ROE, margins, etc.)
  - Metadata (symbol, fy, quarter, dates, source)
- **Primary Key:** (symbol, fy, quarter, statement_type)
- Handles updates and duplicates
- Tracks processed files

**Usage (imported by xbrl_eod.py):**
```python
from fundamental_xbrl_storage import XBRLStorage

storage = XBRLStorage()
storage.store_xbrl_data(
    symbol='TCS',
    xbrl_data=parsed_data,
    fundamentals=calculated_ratios,
    metadata={...}
)
```

**Database location:** `data/fundamentals.duckdb`

---

### 5. `fundamental_duckdb_storage.py`
**Purpose:** Legacy storage module (being phased out)

**Note:** Use `fundamental_xbrl_storage.py` for new code. This file maintained for backward compatibility.

---

### 6. `fetch_nse_financial_results.py`
**Purpose:** Download XBRL files from NSE website

**What it does:**
- Connects to NSE portal
- Downloads financial result XBRL files
- Supports filters:
  - By symbol
  - By financial year
  - By quarter
  - By company type (Banking, NBFC, Corporate, etc.)
- Organizes downloaded files by symbol
- Tracks downloads to prevent re-downloading

**Usage:**
```bash
# Download for single symbol
python scripts/fundamental/fetch_nse_financial_results.py --symbol TCS

# Download for multiple symbols
python scripts/fundamental/fetch_nse_financial_results.py --symbols TCS,INFY,WIPRO

# Download all banking companies
python scripts/fundamental/fetch_nse_financial_results.py --sector BANKING

# Download specific quarter
python scripts/fundamental/fetch_nse_financial_results.py --symbol TCS --fy FY2025 --quarter Q2

# Download latest quarter for all symbols
python scripts/fundamental/fetch_nse_financial_results.py --all --latest
```

**Output:** Downloads to `xbrl/{symbol}/` directory

---

### 7. `organize_xbrl_files.py`
**Purpose:** Organize downloaded XBRL files

**What it does:**
- Scans XBRL directory
- Renames files to standard format: `{SYMBOL}_{FY}_{Q}_{TYPE}.xml`
- Moves files to symbol-specific folders
- Removes duplicates
- Creates manifest file

**Usage:**
```bash
# Organize all files in xbrl/ directory
python scripts/fundamental/organize_xbrl_files.py

# Organize specific directory
python scripts/fundamental/organize_xbrl_files.py --dir /path/to/xbrl/files

# Dry run (preview changes without moving)
python scripts/fundamental/organize_xbrl_files.py --dry-run
```

**Example transformation:**
```
Before:
xbrl/500325-31032024-CONS.xml
xbrl/500325-31032024-STANDALONE.xml

After:
xbrl/TCS/TCS_FY2025_Q4_Consolidated.xml
xbrl/TCS/TCS_FY2025_Q4_Standalone.xml
```

---

### 8. `yahoo_xbrl_enricher.py`
**Purpose:** Enrich XBRL data with Yahoo Finance current prices

**What it does:**
- Reads XBRL data from DuckDB (without prices)
- Fetches current market prices from Yahoo Finance
- Updates PE, PB ratios with current prices
- Updates market cap calculations

**When needed:** When XBRL data processed without current price

**Usage:**
```bash
# Enrich single symbol
python scripts/fundamental/yahoo_xbrl_enricher.py --symbol TCS

# Enrich all symbols
python scripts/fundamental/yahoo_xbrl_enricher.py --all

# Enrich specific quarter
python scripts/fundamental/yahoo_xbrl_enricher.py --symbol TCS --fy FY2025 --quarter Q2
```

**Updates:**
- `current_price`
- `market_cap`
- `PE` (Price/EPS)
- `PB` (Price/Book)
- `PS` (Market Cap/Revenue)

---

### 9. `backfill_download_tracking.py`
**Purpose:** Backfill download tracking table

**What it does:**
- Scans existing XBRL files
- Updates `xbrl_downloads` table
- Prevents re-downloading already processed files
- Useful after manual file additions

**Usage:**
```bash
# Backfill from existing files
python scripts/fundamental/backfill_download_tracking.py

# Backfill specific directory
python scripts/fundamental/backfill_download_tracking.py --dir xbrl/
```

**Updates:** `xbrl_downloads` table in `fundamentals.duckdb`

---

## 🔄 Complete XBRL Processing Workflow

### Method 1: Automatic Download + Process
```bash
# 1. Download latest XBRL files for symbols
python scripts/fundamental/fetch_nse_financial_results.py --symbols TCS,INFY,WIPRO --latest

# 2. Organize downloaded files
python scripts/fundamental/organize_xbrl_files.py

# 3. Process all files (full pipeline)
python scripts/fundamental/xbrl_eod.py --dir xbrl/

# 4. Verify in database
duckdb data/fundamentals.duckdb "SELECT symbol, fy, quarter, eps, roe FROM xbrl_data ORDER BY end_date DESC LIMIT 10"
```

### Method 2: Process Existing Files
```bash
# If you already have XBRL files manually downloaded
# 1. Organize them first
python scripts/fundamental/organize_xbrl_files.py --dir /path/to/xbrl

# 2. Process organized files
python scripts/fundamental/xbrl_eod.py --dir xbrl/

# 3. Backfill download tracking
python scripts/fundamental/backfill_download_tracking.py
```

### Method 3: Single Symbol Quick Process
```bash
# Process all XBRL files for TCS (auto-discovers files)
python scripts/fundamental/xbrl_eod.py --symbol TCS

# Or process specific file
python scripts/fundamental/xbrl_eod.py --file xbrl/TCS/TCS_FY2025_Q2_Consolidated.xml
```

---

## 📊 Data Flow

```
NSE Website
     ↓
fetch_nse_financial_results.py → xbrl/{symbol}/*.xml
     ↓
organize_xbrl_files.py → Organized files
     ↓
xbrl_eod.py (Pipeline):
  ├─→ xbrl_parser_v3.py (Parse XML)
  ├─→ fundamental_calculator.py (Calculate ratios)
  └─→ fundamental_xbrl_storage.py (Store)
     ↓
DuckDB (fundamentals.duckdb) + Firebase (latest quarter)
```

---

## 🗄️ Database Schema Highlights

**Table:** `xbrl_data`

**Key Columns:**
```sql
-- Primary Key
symbol, fy, quarter, statement_type

-- Raw Data (from XBRL)
raw_revenue, raw_net_profit, raw_assets, raw_equity,
raw_eps, raw_number_of_shares, ...

-- Calculated Ratios
pe_ratio, pb_ratio, roe, roa, roce,
net_profit_margin, current_ratio, debt_to_equity,
eps, eps_ttm, ...

-- Metadata
end_date, start_date, is_annual, source, processed_at
```

**Query Examples:**
```sql
-- Latest quarter for TCS
SELECT * FROM xbrl_data
WHERE symbol = 'TCS'
ORDER BY end_date DESC
LIMIT 1;

-- Compare last 5 quarters
SELECT fy, quarter, revenue_cr, net_profit_cr, eps, roe
FROM xbrl_data
WHERE symbol = 'TCS' AND statement_type = 'consolidated'
ORDER BY end_date DESC
LIMIT 5;

-- All symbols with ROE > 20%
SELECT symbol, fy, quarter, roe, eps
FROM xbrl_data
WHERE roe > 20 AND quarter = 'Q4'
ORDER BY roe DESC;
```

---

## ⚙️ Configuration

### Environment Variables:
```bash
# Database path
export FUNDAMENTALS_DB="data/fundamentals.duckdb"
export EOD_DB="data/eod.duckdb"

# XBRL directory
export XBRL_DIR="xbrl/"

# Firebase (for UI updates)
export GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json"
```

### Dependencies:
```
lxml
pandas
duckdb
yfinance (for prices)
firebase-admin (for UI updates)
```

---

## 🐛 Troubleshooting

**"Cannot parse XBRL file":**
- Check if file is valid XML
- Verify it's using Indian taxonomy
- Some PDFs are mislabeled as XML

**"EPS showing TTM instead of quarterly":**
- Fixed! Now stores actual EPS in `eps` field
- TTM EPS in separate `eps_ttm` field

**"Duplicate key error":**
- Same symbol+fy+quarter+type already exists
- Use `--force` to overwrite or delete old record first

**"No price data available":**
- Run `yahoo_xbrl_enricher.py` to add prices
- Or provide `--price` parameter to xbrl_eod.py

---

## 📈 Fundamental Ratios Reference

| Ratio | Formula | Good Value | Purpose |
|-------|---------|------------|---------|
| **PE** | Price / EPS | 15-25 | Valuation |
| **PB** | Price / Book Value | <3 | Asset value |
| **ROE** | Net Profit / Equity | >15% | Profitability |
| **ROA** | Net Profit / Assets | >5% | Asset efficiency |
| **Debt/Equity** | Debt / Equity | <1 | Leverage |
| **Current Ratio** | Current Assets / Current Liab | >1.5 | Liquidity |

---

## 🔗 Related Folders

- `scripts/batch/` - Batch scripts call these
- `scripts/forensics/` - Uses fundamental data for analysis
- `scripts/analysis/` - Advanced fundamental analysis
- `scripts/reports/` - Generate reports from this data

---

**Last Updated:** October 28, 2025
