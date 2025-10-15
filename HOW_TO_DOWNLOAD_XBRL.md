# How to Download XBRL Financial Data

Complete guide to downloading XBRL files for Indian companies from official sources.

---

## 📍 Where to Get XBRL Files

There are **3 official sources** for XBRL financial data:

1. **NSE (National Stock Exchange)** - Free, for listed companies
2. **BSE (Bombay Stock Exchange)** - Free, for listed companies
3. **MCA (Ministry of Corporate Affairs)** - ₹100/company/year, for all companies

---

## 🏢 Method 1: NSE India (FREE)

### Website:
**https://www.nseindia.com/companies-listing/corporate-filings-announcements-xbrl**

### Steps:

1. **Go to NSE Corporate Filings (XBRL)**
   ```
   https://www.nseindia.com/companies-listing/corporate-filings-announcements-xbrl
   ```

2. **Search for Company**
   - Use the search bar to find your company (e.g., "RELIANCE", "TCS")
   - Or browse by sector

3. **Select Financial Results**
   - Look for "Financial Results" announcements
   - Click on the announcement date

4. **Download XBRL File**
   - Look for "Download XBRL" or "View XBRL" link
   - The file will be in `.xml` format
   - Save as: `SYMBOL_FY_QUARTER.xml` (e.g., `RELIANCE_FY2024_Q4.xml`)

### Available Data:
- ✅ Quarterly Financial Results (Q1, Q2, Q3, Q4)
- ✅ Annual Reports
- ✅ Shareholding Patterns
- ✅ Related Party Transactions

### Pros:
- ✅ Free
- ✅ Latest quarterly results
- ✅ Fast download
- ✅ Official source

### Cons:
- ❌ Only listed companies
- ❌ May not have very old data
- ❌ Need to download one by one

---

## 🏢 Method 2: BSE India (FREE)

### Website:
**https://www.bseindia.com/corporates/xbrldetails.aspx**

### Steps:

1. **Go to BSE XBRL Filings Page**
   ```
   https://www.bseindia.com/corporates/xbrldetails.aspx
   ```

2. **Enter Company Details**
   - Enter Company Code or Name
   - Select Filing Type (Financial Results)

3. **Select Period**
   - Choose Financial Year
   - Choose Quarter

4. **Download XBRL File**
   - Click on download icon
   - File format: `.xml`

### Pros:
- ✅ Free
- ✅ Good historical data
- ✅ Official source
- ✅ Searchable by date range

### Cons:
- ❌ Only listed companies
- ❌ Interface can be slow

---

## 🏛️ Method 3: MCA Portal (PAID - ₹100/year)

### Website:
**https://www.mca.gov.in/mcafoportal**

### Steps:

1. **Go to MCA Services Portal**
   ```
   https://www.mca.gov.in/mcafoportal/viewPublicDocumentsFilter.do
   ```

2. **Search for Company**
   - Click "View Company Master Data"
   - Enter CIN (Corporate Identification Number) or Company Name
   - Search

3. **Access Documents**
   - Navigate: MCA Services → Document Related Services → View Public Documents
   - Select company
   - Pay ₹100 for 1 year access to that company's documents

4. **Download Financial Statements**
   - Look for Form **AOC-4** (Annual Financial Statements)
   - Download the form
   - Forms contain attached XML files

5. **Extract XBRL Files**
   - Open AOC-4 PDF in Adobe Reader
   - Click on attachment icon (📎)
   - Extract `.xml` files from attachments

### Alternative: Direct XML Download

Some companies' AOC-4 filings have direct XML downloads available.

### Pros:
- ✅ **ALL companies** (listed + unlisted)
- ✅ Complete historical data
- ✅ Most comprehensive
- ✅ Official government source
- ✅ Audited data

### Cons:
- ❌ Costs ₹100 per company per year
- ❌ Need to extract from PDF attachments
- ❌ More steps involved

---

## 🔧 Tools Needed

### 1. MCA XBRL Validation Tool (Optional)

**Download:** https://www.mca.gov.in/XBRL

**Purpose:**
- View XBRL XML files in readable format
- Convert XML → PDF or Excel
- Validate XBRL files

**Usage:**
```bash
# Install MCA XBRL Tool
# Then open XML file in the tool
# Export as PDF or Excel for viewing
```

### 2. Your XBRL Parser (Already Built!)

You already have `scripts/xbrl_parser.py` that can parse XML files directly!

---

## 📁 Recommended Download Strategy

### For Your Portfolio:

**Step 1: Identify Companies**
```
Get list of symbols from your portfolio:
- RELIANCE, TCS, INFY, BAJFINANCE, etc.
```

**Step 2: Download Latest Quarter (NSE/BSE)**
```
For each symbol:
1. Go to NSE XBRL page
2. Search company
3. Download latest Q4/Q1/Q2/Q3 results
4. Save as: SYMBOL_FY2024_Q4.xml
```

**Step 3: Organize Files**
```
Create directory structure:
data/xbrl/
  ├── RELIANCE_FY2024_Q4.xml
  ├── TCS_FY2024_Q4.xml
  ├── BAJFINANCE_FY2024_Q4.xml
  └── ... etc
```

**Step 4: Process All Files**
```bash
# Batch process
python3 scripts/xbrl_eod.py --dir data/xbrl/
```

---

## 🔍 Finding Specific Filings

### On NSE:

1. **Latest Quarter Results:**
   - Go to Company Page: `https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE`
   - Click "Corporate Actions" → "Financial Results"
   - Download XBRL

2. **Announcements Page:**
   - NSE → Companies → Corporate Filings
   - Filter by "Financial Results"
   - Select date range

### On BSE:

1. **Company Page:**
   - Go to: `https://www.bseindia.com/stock-share-price/`
   - Search company
   - Click "Corporate Information" → "Financial Results"
   - Download XBRL

### On MCA:

1. **Search by CIN:**
   ```
   Example: RELIANCE
   CIN: L17110MH1973PLC019786
   ```

2. **Download AOC-4:**
   - Latest filing will have most recent annual data
   - Form 23AC-XBRL for quarterly (if available)

---

## 📋 File Naming Convention

**Format:** `SYMBOL_FYYYYY_QX.xml`

**Examples:**
```
✅ RELIANCE_FY2024_Q4.xml
✅ TCS_FY2024_Q1.xml
✅ BAJFINANCE_FY2023_Q3.xml
✅ INFY_FY2024_Q4.xml
```

This naming helps your script auto-detect the symbol!

---

## 🎯 Quick Start Guide

### For 10 Portfolio Companies:

**Time Required:** ~30 minutes

1. **Create data directory:**
   ```bash
   mkdir -p data/xbrl
   ```

2. **Download XBRL files from NSE:**
   - Go to NSE XBRL page
   - Search each company
   - Download latest quarter
   - Save in `data/xbrl/`

3. **Process all files:**
   ```bash
   python3 scripts/xbrl_eod.py --dir data/xbrl/
   ```

4. **Check results:**
   - DuckDB: `data/fundamentals.duckdb`
   - Firebase: `symbols` collection

---

## 💡 Tips & Tricks

### 1. Bulk Download
Unfortunately, there's no official bulk download API. You'll need to:
- Download manually from NSE/BSE (free)
- Or pay for MCA access and download AOC-4 forms

### 2. Automation (Advanced)
You could scrape NSE/BSE using Python:
- Use `requests` + `BeautifulSoup`
- Navigate to announcement pages
- Download XBRL links automatically
- **Respect rate limits and ToS!**

### 3. Third-Party Services
Commercial providers offer bulk XBRL data:
- EODHD Financial APIs
- RapidAPI providers
- Costs money but saves time

### 4. Quarterly Updates
- Q1: July (results for Apr-Jun)
- Q2: October (results for Jul-Sep)
- Q3: January (results for Oct-Dec)
- Q4: April/May (results for Jan-Mar, full year)

Set reminders to download new quarters!

---

## 🚨 Important Notes

1. **File Format:** XBRL files are XML, not Excel or PDF
2. **Size:** Files can be 5-50 MB (large!)
3. **Validation:** Not all XBRL files are perfectly formatted
4. **Coverage:** NSE/BSE only have listed companies, MCA has all
5. **Historical:** For old data (>2 years), use MCA portal
6. **Free vs Paid:** NSE/BSE are free but limited, MCA is paid but comprehensive

---

## 📞 Support Contacts

**NSE:**
- Email: listingfr@nse.co.in
- For XBRL filing queries

**BSE:**
- Email: bse.xbrl@bseindia.com
- Helpline: 022-69158560

**MCA:**
- Portal: https://www.mca.gov.in
- Helpdesk available on portal

---

## ✅ Checklist

Before processing XBRL files:

- [ ] Downloaded XBRL files (.xml format)
- [ ] Saved in `data/xbrl/` directory
- [ ] Named files properly (SYMBOL_FY_Q.xml)
- [ ] Verified XML files are valid (not corrupted)
- [ ] Have virtual environment activated
- [ ] Firebase credentials configured

Then run:
```bash
python3 scripts/xbrl_eod.py --dir data/xbrl/
```

---

## 🎯 Summary

**Best Option for Most Users:**
👉 **NSE India** - Free, easy, latest data for listed companies

**Best for Complete Coverage:**
👉 **MCA Portal** - ₹100/company/year, all companies, complete history

**Start Here:**
1. Go to NSE XBRL page
2. Download latest quarter for your portfolio stocks
3. Save in `data/xbrl/`
4. Run `xbrl_eod.py`
5. Check Firebase for latest fundamentals!

Happy downloading! 📊
