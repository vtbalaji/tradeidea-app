# XBRL Financial Results - Quick Start Guide

## Overview

This guide helps you download and process financial results from NSE India for your portfolio companies.

## 📋 Workflow Summary

```
1. Manual Download from NSE → 2. Organize Files → 3. Process with XBRL Parser → 4. View in App
```

---

## Step 1: Download Files from NSE India

### Manual Download (Recommended)

NSE India has strong anti-scraping protections, so manual download is the most reliable approach.

**For each symbol (e.g., TCS):**

1. **Visit NSE Quote Page**
   ```
   https://www.nseindia.com/get-quotes/equity?symbol=TCS
   ```

2. **Click "Financial Results"** in the left sidebar menu

3. **Download Recent Results**
   - Look for "Standalone" and "Consolidated" results
   - Download for recent quarters (Q1, Q2, Q3, Q4)
   - Prefer **XML/XBRL** format if available (best for parsing)
   - PDF format also works

4. **Save to `xbrl/` folder**
   - All downloads go to: `xbrl/` directory
   - Don't worry about file names yet

### Automated Download (Experimental)

If you want to try automated scraping:

```bash
# Requires Chrome and webdriver-manager (already installed)
./scripts/fetch_nse_financial_results.py TCS --limit 2
```

**Note**: This may not work reliably due to NSE's anti-scraping measures.

---

## Step 2: Organize Downloaded Files

Use the organizer script to rename files to standard format:

### Interactive Mode (Easy)
```bash
# Script will prompt you for details
./scripts/organize_xbrl_files.py xbrl/downloaded_file.pdf
```

The script will ask:
- Symbol (e.g., TCS)
- Type (standalone or consolidated)
- Quarter month (jun/sep/dec/mar)
- Year (e.g., 2024)

### With Metadata (Fast)
```bash
./scripts/organize_xbrl_files.py xbrl/file.pdf \
    --symbol TCS \
    --type standalone \
    --month sep \
    --year 2024
```

### Batch Mode (for multiple files)
```bash
# Preview what would be done
./scripts/organize_xbrl_files.py --dir xbrl/ --dry-run

# Process all files interactively
./scripts/organize_xbrl_files.py --dir xbrl/
```

### Standard Naming Convention

Files are renamed to:
```
SYMBOL_type_month_year.ext
```

Examples:
- `TCS_standalone_sep_2024.pdf`
- `TCS_consolidated_sep_2024.xml`
- `RELIANCE_standalone_mar_2025.xml`

---

## Step 3: Process XBRL Files

Process the organized files with your XBRL parser:

### Single File
```bash
./scripts/xbrl_eod.py TCS xbrl/TCS_standalone_sep_2024.xml
```

This will:
- Parse XBRL/PDF file
- Extract financial metrics
- Calculate ratios (P/E, ROE, ROA, etc.)
- Store in DuckDB (historical)
- Update Firebase (latest quarter only)

### Batch Processing
```bash
# Process all XBRL files in directory
./scripts/xbrl_eod.py --dir xbrl/
```

---

## Step 4: View Results

Your app will now show the latest fundamentals for the symbol.

Check Firebase Console or your app to verify the data was loaded.

---

## 📁 Directory Structure

```
myportfolio-web/
├── xbrl/                          # Downloaded files (git-ignored)
│   ├── TCS_standalone_sep_2024.pdf
│   ├── TCS_consolidated_sep_2024.xml
│   └── RELIANCE_standalone_mar_2025.xml
├── scripts/
│   ├── fetch_nse_financial_results.py    # Automated fetcher (experimental)
│   ├── organize_xbrl_files.py            # File organizer
│   ├── xbrl_eod.py                       # XBRL processor
│   └── xbrl_parser.py                    # XBRL parser library
└── data/
    └── fundamentals.duckdb        # Historical fundamental data
```

---

## 🎯 Example: Complete Workflow for TCS

```bash
# 1. Download from NSE (manual)
# Visit: https://www.nseindia.com/get-quotes/equity?symbol=TCS
# Click "Financial Results" → Download → Save to xbrl/

# 2. Organize the downloaded file
./scripts/organize_xbrl_files.py xbrl/tcs_results_q2_2024.pdf \
    --symbol TCS \
    --type standalone \
    --month sep \
    --year 2024

# 3. Process XBRL file
./scripts/xbrl_eod.py TCS xbrl/TCS_standalone_sep_2024.xml

# 4. Check results
# View in your app or Firebase Console
```

---

## 🔄 Batch Processing Multiple Symbols

Create a symbols list:

```bash
cat > xbrl_symbols.txt << EOF
TCS
RELIANCE
INFY
HDFCBANK
ICICIBANK
WIPRO
SBIN
EOF
```

Download and process:

```bash
# Manual download for each symbol, then:
./scripts/organize_xbrl_files.py --dir xbrl/
./scripts/xbrl_eod.py --dir xbrl/
```

---

## 📊 Understanding Quarters

Indian Financial Year runs **April to March**:

| Quarter | Months | Ends In | File Name Uses |
|---------|--------|---------|----------------|
| Q1 | Apr-May-Jun | June 30 | `jun` |
| Q2 | Jul-Aug-Sep | September 30 | `sep` |
| Q3 | Oct-Nov-Dec | December 31 | `dec` |
| Q4 | Jan-Feb-Mar | March 31 | `mar` |

**Example**: FY2025 Q2 ends on September 30, 2024
- File name: `TCS_standalone_sep_2024.xml`

---

## 🚨 Troubleshooting

### NSE website not loading
- Try different browser
- Clear cookies
- Wait a few minutes and retry

### No XBRL files available on NSE
- BSE (Bombay Stock Exchange) is an alternative:
  - Visit: https://www.bseindia.com/
  - Search for company
  - Go to "Corporate Announcements" → "Financial Results"

### File format not supported
- XBRL parser supports: XML, PDF (experimental)
- Prefer XML/XBRL format when available
- PDFs may require additional parsing libraries

### "Failed to parse XBRL file"
- Ensure file is actually XBRL/XML format
- Check file is not corrupted (not 0 bytes)
- Try opening in text editor to verify it's XML

---

## 💡 Tips

1. **Start Small**: Download 1-2 quarters for 2-3 symbols first to test the workflow

2. **Prefer Standalone**: Start with standalone results (simpler) before consolidated

3. **Latest First**: Focus on the most recent quarter first

4. **Check File Size**: XBRL files are typically 50KB-5MB. If much smaller, might be corrupted

5. **Quarterly Updates**: Run this process quarterly when companies announce results
   - Q1: Mid-July
   - Q2: Mid-October
   - Q3: Mid-January
   - Q4: Mid-April

---

## 🔗 Resources

- **NSE India**: https://www.nseindia.com/
- **BSE India**: https://www.bseindia.com/
- **XBRL Format**: https://www.xbrl.org/
- **MCA (Ministry of Corporate Affairs)**: https://www.mca.gov.in/

---

## 📞 Next Steps

1. Try downloading results for TCS manually
2. Organize the file using the script
3. Process with XBRL parser
4. Check if data appears in your app
5. Repeat for other symbols in your portfolio

Good luck! 🚀
