# Report Generation Scripts

Scripts for generating formatted financial reports and comparisons.

## 📋 Scripts Overview

### 1. `quarterly_financial_report.py` ⭐
**Purpose:** Generate quarterly financial reports with sector-specific metrics

**What it does:**
- Displays last N quarters of financial data (default: 5)
- Shows key metrics: Revenue, Operating Profit, Net Profit, EPS, Margins
- Calculates YoY (Year-over-Year) growth
- Displays TTM (Trailing Twelve Months) metrics
- **Sector-specific metrics:**
  - **BANKING:** NII, NIM, Advances, Deposits, CD Ratio, Provisions
  - **IT/PHARMA/AUTO/FMCG:** Standard metrics with operating margins
- Comparison mode for multiple companies

**Usage:**
```bash
# Single company report (last 5 quarters)
python scripts/reports/quarterly_financial_report.py TCS

# Last 8 quarters
python scripts/reports/quarterly_financial_report.py TCS --quarters 8

# Standalone financials
python scripts/reports/quarterly_financial_report.py TCS --type standalone

# Compare multiple companies
python scripts/reports/quarterly_financial_report.py TCS INFY WIPRO --compare

# Banking sector report (with banking-specific metrics)
python scripts/reports/quarterly_financial_report.py HDFCBANK ICICIBANK --compare
```

**Sector Detection:**
- Auto-detects sector based on symbol
- Override with `--sector BANKING` parameter
- Supported sectors: BANKING, IT, PHARMA, AUTO, FMCG, GENERAL

**Example Output:**
```
========================================================================================================================
                                               QUARTERLY FINANCIAL REPORT
                                             TCS - CONSOLIDATED [IT SECTOR]
                                    All figures in ₹ Crores (except per share data)
========================================================================================================================

Indicator                                 FY2026 Q2       FY2026 Q1       FY2025 Q3       FY2025 Q2       FY2025 Q1
------------------------------------------------------------------------------------------------------------------------
Total Revenue                                65,799          63,437          53,883          53,990          52,844
Revenue Growth YoY                            24.5%            3.6%          -11.1%            7.6%          -11.0%

Operating Expenses                           49,463          48,118          40,492          40,586          39,383
Operating Profit                             16,336          15,319          13,391          13,404          13,461
Operating Profit Margin %                    24.83%          24.15%          24.85%          24.83%          25.47%

Net Profit                                   12,131          12,819          11,832          12,994          12,115
Net Profit Margin %                          18.44%          20.21%          21.96%          24.07%          22.93%

EPS (₹)                                       33.37           38.78           70.97           78.85           75.89

------------------------------------------------------------------------------------------------------------------------
TRAILING TWELVE MONTHS (TTM) METRICS
------------------------------------------------------------------------------------------------------------------------
Net Profit TTM                               49,776
EPS TTM (₹)                                  502.96
========================================================================================================================
```

**Banking Report Example:**
Shows additional section with:
- Interest Income (breakdown)
- Net Interest Income (NII)
- Net Interest Margin (NIM)
- Non-Interest Income
- Provisions
- Advances & Deposits
- Credit-Deposit Ratio

**Data Source:** `data/fundamentals.duckdb` (xbrl_data table)

## 📊 Output Options

- **Console:** Default, formatted table output
- **Comparison:** Side-by-side comparison of multiple companies
- **Sector-specific:** Automatic detection and display of relevant metrics

## ⚙️ Configuration

Modify script for:
- Additional metrics
- Custom formatting
- Different timeframes
- Export to CSV/JSON

## 🔗 Related Folders

- `scripts/fundamental/` - Source data
- `scripts/analysis/` - Advanced analysis using same data

**Last Updated:** October 28, 2025
