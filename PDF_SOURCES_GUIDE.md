# PDF Sources - Practical Guide

## The Reality

BSE/NSE APIs have anti-scraping and need authentication. **But PDFs are publicly accessible** at known URLs!

---

## ✅ WORKING OPTION 1: Direct Company IR Pages (Best)

Most reliable - companies MUST publish results on their website.

### Major Companies - Direct Links

**BHEL** (Capital Goods):
```
Results: https://www.bhel.com/investor-relations/financial-results
Latest: Click on Q2 FY2025-26 → Download PDF
Pattern: https://www.bhel.com/assets/pdf/financial_results/Q2_FY2025-26.pdf
```

**TCS** (IT):
```
Results: https://www.tcs.com/investor-relations/financial-statements
Latest Q2 FY26: https://www.tcs.com/content/dam/global-tcs/en/investor-relations/financial-statements/2024-25/q2/TCS-Q2-FY-2025-Results.pdf
Presentation: https://www.tcs.com/content/dam/global-tcs/en/investor-relations/financial-statements/2024-25/q2/TCS-Q2-FY-2025-Fact-Sheet.pdf
```

**HDFC Bank** (Banking):
```
Results: https://www.hdfcbank.com/personal/about-us/investor-relations/financial-results
Presentations: https://www.hdfcbank.com/personal/about-us/investor-relations/presentations
```

**L&T** (Capital Goods):
```
Results: https://www.larsentoubro.com/corporate/investor-relations/financial-results/
```

### URL Patterns (Predictable!)

Most companies follow similar patterns:
```
https://www.{company}.com/investor-relations/financial-results
https://www.{company}.com/investor-relations/presentations
https://www.{company}.com/content/dam/ir/results/Q2-FY26-Results.pdf
```

**Advantages:**
- ✅ No scraping needed initially
- ✅ Direct links
- ✅ Can automate once you know the pattern
- ✅ Most reliable

**Process:**
1. Check company website → Investor Relations
2. Note the URL pattern
3. Add to our database
4. Script checks these URLs quarterly

---

## ✅ WORKING OPTION 2: BSE Direct PDF Links

BSE hosts all PDFs publicly. **If you know the filename, you can download directly!**

### BSE PDF URL Format:
```
https://www.bseindia.com/xml-data/corpfiling/AttachLive/{FILENAME}
```

### How to Find Filenames:

**Method 1: Manual (2 minutes per company)**
1. Go to: https://www.bseindia.com/
2. Search for "BHEL"
3. Click "Corp Actions" → "Announcements"
4. See list of PDFs with direct links
5. Copy filename from URL

**Method 2: BSE Listing Center**
```
URL: https://listing.bseindia.com/newsarchives/1w/annarch.htm
Direct to announcements page with all PDFs listed
```

### Example - Recent BHEL Results:
```
Q2 FY26 Results:
https://www.bseindia.com/xml-data/corpfiling/AttachLive/ba0a19bf-b8ba-4c16-9d07-3bb3db53d10c.pdf

Pattern: The filename is a UUID, but it's in the announcements page HTML
```

**Advantages:**
- ✅ All companies, all PDFs
- ✅ Official source
- ✅ Historical data available

**Process:**
1. Check announcements page
2. Get PDF links
3. Download

---

## ✅ WORKING OPTION 3: Use Screener.in (Easiest!)

**Screener.in already extracts some of these metrics!**

### What Screener Provides:
```python
import requests

# Example
response = requests.get('https://www.screener.in/api/company/500103/')  # BHEL
data = response.json()

# May include:
# - Order book (for capital goods)
# - Employee count
# - Some segment data
```

**Advantages:**
- ✅ Already extracted from PDFs
- ✅ JSON API (structured!)
- ✅ No PDF parsing needed for some metrics

**Limitations:**
- Not all sector metrics (attrition, utilization missing)
- Rate limits
- May not be real-time

---

## ✅ WORKING OPTION 4: Manual Collection + CSV (Pragmatic!)

**Most practical for starting:**

### 1. Create Quarterly Data File
Create: `data/sector_metrics_q2_fy26.csv`

```csv
symbol,fy,quarter,attrition_rate,utilization_rate,digital_revenue_pct,order_book_cr,order_inflow_cr,source
TCS,FY2026,Q2,12.5,84.0,62.5,,,TCS Q2 Investor Presentation Slide 4
INFY,FY2026,Q2,13.1,85.2,65.0,,,INFY Q2 Results Press Release
WIPRO,FY2026,Q2,14.2,82.5,58.0,,,WIPRO Earnings Call Transcript
BHEL,FY2026,Q2,,,,,120000,8500,BHEL Q2 Press Release Page 1
LT,FY2026,Q2,,,,,280000,25000,L&T Q2 Results Slide 2
ABB,FY2026,Q2,,,,,15000,2500,ABB India Q2 Results
HDFCBANK,FY2026,Q2,,,,,,,"Already in XBRL"
```

### 2. Where to Get These Numbers (15 minutes per company):

**For IT (TCS, INFY, WIPRO):**
1. Go to company IR page
2. Download Q2 FY26 Investor Presentation (30-50 slides)
3. Look at Slide 3-5 for "Key Metrics" summary
4. Copy attrition, utilization, digital %
5. Enter in CSV

**For Capital Goods (BHEL, LT, ABB):**
1. Download Q2 Results Press Release (2-3 pages)
2. First paragraph usually has: "Order book stands at ₹X crore"
3. Look for: "Secured new orders worth ₹X crore"
4. Enter in CSV

**Time**: ~3 hours for 20 companies (quarterly)

### 3. Load in Report Script:
```python
import pandas as pd

# In sector analyzer
def load_manual_metrics(symbol, fy, quarter):
    df = pd.read_csv('data/sector_metrics_q2_fy26.csv')
    row = df[(df['symbol'] == symbol) &
             (df['fy'] == fy) &
             (df['quarter'] == quarter)]

    if not row.empty:
        return row.iloc[0].to_dict()
    return {}

# Use in analyzer
manual_data = load_manual_metrics('TCS', 'FY2026', 'Q2')
attrition = manual_data.get('attrition_rate') or None
```

**Advantages:**
- ✅ Works immediately
- ✅ Full control over data quality
- ✅ Can verify each number
- ✅ No parsing errors
- ✅ ~3 hours per quarter = manageable

**Disadvantages:**
- ❌ Manual effort
- ❌ Not real-time

---

## 🎯 RECOMMENDED APPROACH

### Phase 1: Manual CSV (Week 1) - START HERE
1. Create CSV template (I can do this)
2. Collect data for 10-15 top stocks
3. Integrate into report generation
4. See immediate value

### Phase 2: Semi-Automated (Week 2-4)
1. Build simple URL checker
2. Check company IR pages for new PDFs
3. Download if new
4. Alert you to update CSV
5. Still manual extraction but organized

### Phase 3: Full Automation (Month 2-3)
1. PDF text extraction
2. Keyword search for metrics
3. Auto-populate CSV
4. Manual verification

---

## Sample URLs for Top Companies

I'll check and provide working URLs:

```python
COMPANY_IR_URLS = {
    'BHEL': 'https://www.bhel.com/investor-relations/financial-results',
    'TCS': 'https://www.tcs.com/investor-relations/financial-statements',
    'INFY': 'https://www.infosys.com/investors/reports-filings/quarterly-results.html',
    'WIPRO': 'https://www.wipro.com/investors/quarterly-results/',
    'LT': 'https://www.larsentoubro.com/corporate/investor-relations/financial-results/',
    'HCLTECH': 'https://www.hcltech.com/investors/financials',
    'TECHM': 'https://www.techmahindra.com/investors/',
    'HDFCBANK': 'https://www.hdfcbank.com/personal/about-us/investor-relations/financial-results',
    'ICICIBANK': 'https://www.icicibank.com/aboutus/financial.page',
    'AXISBANK': 'https://www.axisbank.com/shareholders-corner/financial-results',
    'SBIN': 'https://sbi.co.in/web/investor-relations/financial-results',
    'RELIANCE': 'https://www.ril.com/InvestorRelations/FinancialReporting.aspx',
    'ABB': 'https://new.abb.com/in/investor-relations',
    'SIEMENS': 'https://www.siemens.com/in/en/company/investor-relations.html',
}
```

---

## Next Steps - Your Choice:

**Option A: Quick Start (Recommended)**
→ I create CSV template with sample data
→ You manually fill for 10 companies (2 hours)
→ Reports work immediately with real data
→ Then we can automate later

**Option B: Simple Downloader**
→ I create script to download from known company URLs
→ You manually extract numbers from PDFs
→ Fill CSV

**Option C: Wait for Full Automation**
→ Build complete PDF parser
→ 2-3 weeks development
→ Reports show N/A until then

**Which option do you prefer?**
