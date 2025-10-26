# Scripts To Be Deleted

This folder contains scripts that are **NOT** used by the automated batch processes:
- `daily-eod-batch.sh` (runs daily after market close)
- `weekly-fundamentals-batch.sh` (runs weekly for fundamentals)

These files can be safely deleted after review.

## Category: Test/Debug Files

- `debug_darvas_v2.py` - Debugging script for Darvas box
- `debug_darvas.py` - Debugging script for Darvas box
- `test_corrected_darvas.py` - Test file for Darvas
- `test_darvas_detailed.py` - Test file for Darvas
- `test_darvas.py` - Test file for Darvas
- `test_single_stock.py` - Test file for single stock
- `test_single_symbol.py` - Test file for single symbol
- `test_updated_darvas.py` - Test file for Darvas

## Category: Deprecated/Replaced Scripts

- `analyze-symbols.py` - **Replaced by** `analyze-symbols-duckdb.py` (used in daily batch)
- `update_PEG_fundamentals.py` - Deprecated (PEG now calculated in `analyze-fundamentals.py`)

## Category: Standalone Screeners (Not in Batch)

- `bb-squeeze-screener.py` - Standalone Bollinger Band squeeze screener (not in batch)

## Category: Manual/Ad-hoc Tools

These are manual tools that need to be run manually when needed:

- `update-portfolio-fundamentals.py` - Manual portfolio update
- `update-portfolio-prices.py` - Manual price update
- `add_new_symbol.py` - Manual tool to add new symbols
- `adjust-historical-split.py` - Manual tool for stock split adjustments
- `batch-detect-and-fix-splits.py` - Manual tool for detecting splits
- `delete-small-positions.py` - Manual cleanup tool
- `eod-data-quality-check.py` - Manual data quality check
- `remove-delisted-symbols.py` - Manual cleanup tool

## What's Being Used

### Daily EOD Batch (`daily-eod-batch.sh`)
1. `fetch-eod-data.py` - Fetch NSE EOD data
2. `fetch-nifty50-index.py` - Fetch Nifty 50 index data
3. `analyze-symbols-duckdb.py` - Technical analysis
4. `screeners.py` - Run all screeners
5. `cleanup-firebase.py` - Clean old Firebase data
6. `generate-chart-data.py` - Generate chart data
7. `manage-portfolio-stoploss.py` - Manage stop-loss
8. `check-and-generate-alerts.py` - Generate alerts

### Weekly Fundamentals Batch (`weekly-fundamentals-batch.sh`)
1. `analyze-fundamentals.py` - Main fundamentals analysis
   - Imports: `yahoo_fundamentals_fetcher.py`
   - Imports: `peg_calculator.py`
   - Imports: `yahoo_xbrl_enricher.py`

### XBRL/Forensic (Used for Financial Analysis)
- `fetch_nse_financial_results.py` - Fetch XBRL financial data from NSE
- `fundamental_xbrl_storage.py` - Store XBRL data in DuckDB
- `xbrl_parser.py` - Parse XBRL files
- `xbrl_eod.py` - XBRL EOD processing
- `organize_xbrl_files.py` - Organize downloaded XBRL files
- `backfill_download_tracking.py` - Backfill XBRL download tracking
- `forensics/` folder - All forensic analysis modules

### Supporting Modules (Imported)
- `load_env.py` - Environment loader
- `fundamental_calculator.py` - Fundamental calculations
- `fundamental_duckdb_storage.py` - DuckDB storage utilities

## Decision

**Safe to delete after review** - These files are not connected to any automated batch process.

If you need any of these manual tools in the future, you can recover them from git history.

---

Last Updated: 2025-10-25
