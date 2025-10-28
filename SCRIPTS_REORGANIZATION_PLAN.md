# Scripts Folder Reorganization Plan

## 📋 Current Issues
- 34+ scripts in root `scripts/` folder (cluttered)
- Existing subfolders: `analysis/`, `forensics/`, `shared/`, `reports/`, `admin/`, `experimental/`, `tobedeleted/`, `unused/`
- Mix of batch scripts (.sh) and Python scripts (.py)
- Hard to find what you need

## 🎯 Proposed Folder Structure

```
scripts/
│
├── batch/                          # 🔄 Orchestration scripts (entry points)
│   ├── daily-eod-batch.sh         # Daily EOD data pipeline
│   ├── weekly-fundamentals-batch.sh  # Weekly XBRL processing
│   ├── run-eod-with-quality-check.sh # EOD with validation
│   ├── process_downloaded_xbrl.sh  # Process XBRL files
│   └── top50.sh                    # Top 50 companies update
│
├── technical/                      # 📈 Technical Analysis & EOD Data
│   ├── fetch-eod-data.py          # Fetch daily EOD prices
│   ├── analyze-symbols-duckdb.py  # Technical indicators calculation
│   ├── generate-chart-data.py     # Chart data generation
│   ├── yahoo_fundamentals_fetcher.py  # Yahoo Finance data
│   └── fetch-nifty50-index.py     # Index data
│
├── fundamental/                    # 💰 XBRL & Fundamental Analysis
│   ├── xbrl_parser_v3.py          # XBRL file parser
│   ├── xbrl_eod.py                # XBRL processing pipeline
│   ├── fundamental_calculator.py   # Calculate ratios
│   ├── fundamental_xbrl_storage.py # DuckDB storage
│   ├── fundamental_duckdb_storage.py # Legacy storage
│   ├── organize_xbrl_files.py     # File organization
│   ├── fetch_nse_financial_results.py # NSE XBRL download
│   ├── yahoo_xbrl_enricher.py     # Enrich with Yahoo data
│   └── backfill_download_tracking.py # Track downloads
│
├── analysis/                       # 🔍 Advanced Analysis
│   ├── enhanced_company_report_v2.py  # Comprehensive reports
│   ├── analyze-fundamentals.py    # Fundamental analysis
│   ├── screeners.py               # Stock screeners
│   ├── peg_calculator.py          # PEG ratio calculator
│   ├── find_bottomed_out_stocks.py # Technical patterns
│   └── fetch_nse_data.py          # NSE data analysis
│
├── forensics/                      # 🕵️ Forensic Accounting
│   ├── forensic_analyzer.py       # Main analyzer
│   ├── altman_z_score.py          # Z-Score (bankruptcy risk)
│   ├── beneish_m_score.py         # M-Score (earnings manipulation)
│   ├── piotroski_f_score.py       # F-Score (financial strength)
│   ├── j_score.py                 # J-Score
│   ├── red_flags.py               # Red flags detection
│   ├── data_loader.py             # Data loading
│   ├── data_validator.py          # Data validation
│   └── multi_source_loader.py     # Multi-source data
│
├── reports/                        # 📊 Report Generation
│   └── quarterly_financial_report.py  # Quarterly reports (sector-specific)
│
├── portfolio/                      # 💼 Portfolio Management (NEW)
│   ├── manage-portfolio-stoploss.py  # Stop-loss management
│   ├── check-idea-triggers.py     # Trading idea triggers
│   ├── expire-ideas.py            # Expire old ideas
│   └── check-and-generate-alerts.py # Alerts generation
│
├── shared/                         # 🔧 Shared Utilities
│   ├── __init__.py
│   ├── fundamental_metrics.py     # Shared metrics calculations
│   ├── forensic_scores.py         # Shared forensic utilities
│   ├── valuation.py               # Valuation models
│   └── load_env.py                # Environment loader
│
├── admin/                          # ⚙️ Admin & Setup
│   ├── setup-venv.sh              # Virtual environment setup
│   ├── deploy.sh                  # Deployment script
│   └── view-duckdb.sh             # DuckDB viewer
│
├── onetime/                        # 🧪 One-time & Test Scripts (NEW)
│   ├── test_xbrl_v3.py           # XBRL v3 tests
│   ├── test_xbrl_pipeline.py     # Pipeline tests
│   ├── test_xbrl_comprehensive_v2.py  # Comprehensive tests
│   ├── test_multi_source.py      # Multi-source tests
│   ├── extract_metrics_for_validation.py  # Metric extraction
│   └── extract_test_data_metrics.py  # Test data extraction
│
└── README.md                       # 📖 Scripts documentation
```

## 📦 Folder Descriptions

### `batch/` - Entry Points (Shell Scripts)
**Purpose:** Orchestration scripts that you call daily/weekly
- Main entry points for cron jobs
- Call multiple Python scripts in sequence
- Handle error checking and logging

### `technical/` - Technical Analysis
**Purpose:** EOD data, technical indicators, chart generation
- Fetch daily price data
- Calculate technical indicators (RSI, MACD, etc.)
- Generate chart data for UI
- Yahoo Finance integration for UI needs

### `fundamental/` - XBRL & Fundamentals
**Purpose:** XBRL parsing, fundamental calculations
- Parse XBRL files from NSE/BSE
- Calculate fundamental ratios (PE, ROE, etc.)
- Store in DuckDB
- Download and organize XBRL files

### `analysis/` - Advanced Analysis
**Purpose:** Stock screening, analysis, pattern detection
- Company analysis reports
- Stock screeners
- Technical pattern detection
- PEG calculations

### `forensics/` - Forensic Accounting
**Purpose:** Detect accounting fraud, financial distress
- Beneish M-Score (earnings manipulation)
- Altman Z-Score (bankruptcy risk)
- Piotroski F-Score (financial strength)
- Red flags detection

### `reports/` - Report Generation
**Purpose:** Generate formatted reports
- Quarterly financial reports (sector-specific)
- PDF/HTML report generation
- Comparison reports

### `portfolio/` - Portfolio Management (NEW)
**Purpose:** Manage user portfolios and ideas
- Stop-loss management
- Idea triggers and alerts
- Expire old ideas

### `shared/` - Shared Utilities
**Purpose:** Reusable code across scripts
- Common calculations
- Shared models
- Utility functions

### `admin/` - Admin & Setup
**Purpose:** Setup, deployment, maintenance
- Environment setup
- Deployment scripts
- Database viewers

### `onetime/` - Test & One-time Scripts (NEW)
**Purpose:** Scripts you run once or for testing
- Test scripts
- Data extraction/validation
- Migration scripts (run once, then move here)

## 🗑️ Folders to Remove
- `unused/` - Delete (already marked for deletion)
- `tobedeleted/` - Delete (already marked for deletion)
- `experimental/` - Move useful scripts to appropriate folders, delete rest

## 🔄 Migration Commands

```bash
# 1. Create new folders
mkdir -p scripts/{batch,technical,portfolio,onetime}

# 2. Move batch scripts
mv scripts/*.sh scripts/batch/
mv scripts/batch/setup-venv.sh scripts/admin/
mv scripts/batch/deploy.sh scripts/admin/
mv scripts/batch/view-duckdb.sh scripts/admin/

# 3. Move technical scripts
mv scripts/fetch-eod-data.py scripts/technical/
mv scripts/analyze-symbols-duckdb.py scripts/technical/
mv scripts/generate-chart-data.py scripts/technical/
mv scripts/yahoo_fundamentals_fetcher.py scripts/technical/
mv scripts/fetch-nifty50-index.py scripts/technical/

# 4. Move fundamental scripts
mv scripts/xbrl_*.py scripts/fundamental/
mv scripts/fundamental_*.py scripts/fundamental/
mv scripts/organize_xbrl_files.py scripts/fundamental/
mv scripts/fetch_nse_financial_results.py scripts/fundamental/
mv scripts/yahoo_xbrl_enricher.py scripts/fundamental/
mv scripts/backfill_download_tracking.py scripts/fundamental/

# 5. Move analysis scripts
mv scripts/analyze-fundamentals.py scripts/analysis/
mv scripts/screeners.py scripts/analysis/
mv scripts/peg_calculator.py scripts/analysis/
mv scripts/find_bottomed_out_stocks.py scripts/analysis/

# 6. Move portfolio scripts
mv scripts/manage-portfolio-stoploss.py scripts/portfolio/
mv scripts/check-idea-triggers.py scripts/portfolio/
mv scripts/expire-ideas.py scripts/portfolio/
mv scripts/check-and-generate-alerts.py scripts/portfolio/

# 7. Move test scripts
mv scripts/test_*.py scripts/onetime/
mv scripts/extract_*.py scripts/onetime/

# 8. Delete unused folders
rm -rf scripts/unused scripts/tobedeleted

# 9. Clean up experimental
# (Review experimental/ folder and move useful scripts manually)

# 10. Update sys.path in scripts
# (Need to update import paths after reorganization)
```

## ⚠️ Important: Update Import Paths

After reorganization, update Python imports in scripts:

**Before:**
```python
sys.path.insert(0, current_dir)
from xbrl_parser_v3 import XBRLParser
```

**After:**
```python
sys.path.insert(0, os.path.join(current_dir, '..'))
from fundamental.xbrl_parser_v3 import XBRLParser
# OR
sys.path.insert(0, parent_dir)
from fundamental.xbrl_parser_v3 import XBRLParser
```

## 📝 Next Steps

1. **Review** this plan
2. **Test** one script move (e.g., move quarterly_financial_report.py and test it works)
3. **Backup** database before full migration
4. **Execute** migration commands in order
5. **Test** batch scripts after migration
6. **Update** cron jobs if paths changed
7. **Delete** unused folders

## 🎯 Benefits

✅ **Organized** - Easy to find scripts by purpose
✅ **Clear** - Batch scripts in one place (entry points)
✅ **Maintainable** - Related code together
✅ **Scalable** - Easy to add new scripts
✅ **Clean** - No clutter in root folder
