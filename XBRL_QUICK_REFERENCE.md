# XBRL System - Quick Reference

## Common Commands

### Download XBRL Files
```bash
# Single symbol
./scripts/fetch_nse_financial_results.py TCS

# Multiple symbols
./scripts/fetch_nse_financial_results.py TCS RELIANCE INFY

# From file
./scripts/fetch_nse_financial_results.py --file symbols.txt

# Limit to 4 most recent
./scripts/fetch_nse_financial_results.py TCS --limit 4
```

### Check Download Status
```bash
# View all download stats
./scripts/fetch_nse_financial_results.py --stats

# View history for specific symbol
./scripts/fetch_nse_financial_results.py --show-history TCS

# Backfill existing files
./scripts/backfill_download_tracking.py
```

### Process XBRL Files
```bash
# Process single symbol's files
./scripts/xbrl_eod.py --symbol TCS

# Process entire directory
./scripts/xbrl_eod.py --dir xbrl/

# Process only consolidated statements
./scripts/xbrl_eod.py --symbol TCS --prefer consolidated

# Retry failed files
./scripts/xbrl_eod.py --retry-failed
```

### Query Data
```bash
# View download tracking
duckdb data/fundamentals.duckdb "SELECT * FROM xbrl_downloads WHERE symbol='TCS'"

# View processed files
duckdb data/fundamentals.duckdb "SELECT * FROM xbrl_processed_files WHERE symbol='TCS'"

# View fundamental data
duckdb data/fundamentals.duckdb "SELECT * FROM xbrl_data WHERE symbol='TCS' ORDER BY end_date DESC LIMIT 4"
```

## File Structure

```
myportfolio-web/
├── xbrl/                                    # Downloaded XBRL files
│   ├── TCS_standalone_sep_2024.xml
│   ├── TCS_consolidated_sep_2024.xml
│   └── ...
├── data/
│   └── fundamentals.duckdb                  # Database with 3 tables:
│       ├── xbrl_downloads                   # Download tracking
│       ├── xbrl_processed_files             # Processing tracking
│       └── xbrl_data                        # Fundamental data (raw + calculated)
└── scripts/
    ├── fetch_nse_financial_results.py       # Download XBRL files
    ├── xbrl_eod.py                          # Process XBRL files
    ├── xbrl_parser.py                       # Parse XBRL XML
    ├── fundamental_calculator.py            # Calculate ratios
    ├── fundamental_xbrl_storage.py          # DuckDB storage layer
    └── backfill_download_tracking.py        # Backfill tracking
```

## Database Tables

### 1. `xbrl_downloads` - Download Tracking
Tracks what files have been downloaded (prevents re-downloading)

**Key columns:**
- `symbol`, `fy`, `quarter`, `statement_type` (PRIMARY KEY)
- `file_name`, `file_path`, `source_url`
- `download_date`

### 2. `xbrl_processed_files` - Processing Tracking
Tracks what files have been processed (prevents re-parsing)

**Key columns:**
- `file_name` (PRIMARY KEY)
- `symbol`, `fy`, `quarter`, `statement_type`
- `status` ('success' or 'failed')
- `processed_at`

### 3. `xbrl_data` - Fundamental Data
Stores raw + calculated fundamental data

**Key columns:**
- `symbol`, `fy`, `quarter`, `statement_type` (PRIMARY KEY)
- Raw data: `raw_revenue`, `raw_net_profit`, `raw_assets`, etc.
- Calculated: `pe`, `roe`, `roa`, `debt_to_equity`, etc.

## Filename Convention

Format: `SYMBOL_type_month_year.xml`

Examples:
- `TCS_standalone_sep_2024.xml` → FY2025 Q2
- `TCS_consolidated_mar_2025.xml` → FY2025 Q4
- `RELIANCE_standalone_jun_2024.xml` → FY2025 Q1

## Financial Year & Quarter Mapping

Indian FY: April 1 to March 31

| File Month | Quarter | FY |
|------------|---------|-----|
| `mar_2024` | Q4 | FY2024 |
| `jun_2024` | Q1 | FY2025 |
| `sep_2024` | Q2 | FY2025 |
| `dec_2024` | Q3 | FY2025 |
| `mar_2025` | Q4 | FY2025 |

## Typical Workflow

### Daily/Weekly: Download Latest Results
```bash
# Download for portfolio symbols
./scripts/fetch_nse_financial_results.py --file my_symbols.txt --limit 2

# Check what was downloaded
./scripts/fetch_nse_financial_results.py --stats
```

### Process Downloaded Files
```bash
# Process all new files
./scripts/xbrl_eod.py --dir xbrl/

# Or process specific symbol
./scripts/xbrl_eod.py --symbol TCS
```

### Query Results
```bash
# View latest fundamentals
duckdb data/fundamentals.duckdb "
    SELECT symbol, fy, quarter, pe, roe, debt_to_equity, net_profit_cr
    FROM xbrl_data
    WHERE statement_type = 'standalone'
    ORDER BY end_date DESC
    LIMIT 10
"
```

## Troubleshooting

### "Already downloaded in DB" - but file missing
File was tracked but deleted from disk. Re-download:
```bash
# Remove from tracking
duckdb data/fundamentals.duckdb "DELETE FROM xbrl_downloads WHERE symbol='TCS' AND fy='FY2025' AND quarter='Q2'"

# Re-download
./scripts/fetch_nse_financial_results.py TCS
```

### "Failed to parse XBRL file"
Check if file is valid XML:
```bash
head -20 xbrl/TCS_standalone_sep_2024.xml
```

Retry processing:
```bash
./scripts/xbrl_eod.py --retry-failed
```

### NSE blocking downloads (403 error)
Use manual download or Selenium:
```bash
./scripts/fetch_nse_financial_results.py TCS --selenium
```

## Best Practices

1. **Always check download history first**
   ```bash
   ./scripts/fetch_nse_financial_results.py --show-history TCS
   ```

2. **Use --limit to avoid overwhelming NSE servers**
   ```bash
   ./scripts/fetch_nse_financial_results.py TCS --limit 4
   ```

3. **Process files after downloading**
   ```bash
   ./scripts/xbrl_eod.py --dir xbrl/
   ```

4. **Prefer consolidated statements for group companies**
   ```bash
   ./scripts/xbrl_eod.py --symbol RELIANCE --prefer consolidated
   ```

5. **Check processing status**
   ```bash
   duckdb data/fundamentals.duckdb "SELECT status, COUNT(*) FROM xbrl_processed_files GROUP BY status"
   ```

## Help

```bash
# Download script help
./scripts/fetch_nse_financial_results.py --help

# Processing script help
./scripts/xbrl_eod.py --help
```
