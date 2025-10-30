# Data Sources for Sector-Specific Metrics

## Problem Statement

XBRL (financial statements) only contains:
- Balance Sheet
- P&L Statement
- Cash Flow Statement

But sector analysis needs **operational metrics** that aren't in financial statements:

---

## Missing Metrics by Sector

### IT Sector (TCS, INFY, WIPRO)

| Metric | Current Status | Data Source | Where to Find |
|--------|---------------|-------------|---------------|
| **Attrition Rate** | ❌ Missing (shows N/A) | Earnings Calls, Investor Presentations | Page 3-5 of quarterly presentations |
| **Utilization Rate** | ❌ Missing (shows N/A) | Earnings Calls | Mentioned in management commentary |
| **Digital Revenue %** | ❌ Missing (shows N/A) | Annual Report, Investor Presentations | "Business Overview" section |
| **Headcount** | ✅ Estimated from employee costs | Can be scraped from LinkedIn/company website | About Us page |
| **Revenue/Employee** | ✅ Calculated (31.8L for TCS) | Calculated from revenue & employee benefits | - |
| **Margins** | ✅ Available (26.9% for TCS) | XBRL | Already working |
| **Top Client %** | ❌ Missing | Annual Report MD&A | "Customer Concentration" disclosure |

### Capital Goods (BHEL, L&T, ABB)

| Metric | Current Status | Data Source | Where to Find |
|--------|---------------|-------------|---------------|
| **Order Book** | ❌ Missing (shows N/A) | Quarterly Results Press Release | First paragraph of press release |
| **Order Inflow** | ❌ Missing | Quarterly Results, Investor Presentation | "Order Book Movement" table |
| **Capacity Utilization** | ❌ Missing | Annual Report MD&A | "Operations Review" section |
| **Export Revenue %** | ❌ Missing | Annual Report | Revenue segmentation notes |
| **Margins** | ✅ Available (10.1% EBITDA for BHEL) | XBRL | Already working |
| **Asset Turnover** | ✅ Calculated (0.1x for BHEL) | XBRL balance sheet + P&L | Already working |

### Banking Sector (HDFCBANK, ICICIBANK)

| Metric | Current Status | Data Source | Where to Find |
|--------|---------------|-------------|---------------|
| **GNPA, NNPA** | ✅ Working | XBRL (raw_gross_npa, raw_net_npa) | Already in database |
| **CASA Ratio** | ✅ Working | XBRL (raw_casa_ratio) | Already in database |
| **NIM** | ✅ Working | Calculated from interest income/expense | Already working |
| **CAR, Tier 1** | ✅ Working | XBRL (raw_cet1_ratio, raw_tier1_ratio) | Already in database |

---

## Data Sources - Priority Order

### 1. **Quarterly Results Press Release** (Easiest)
**Example**: BHEL Q2 FY2026 Results Press Release
```
URL Pattern: https://www.bhel.com/investor-relations/financial-results
Content:
- Order book: ₹1.2 lakh crore
- Order inflow: ₹8,500 crore (Q2)
- Revenue: ₹7,512 crore
```

**Availability**:
- Published on company website
- Available on BSE/NSE announcements
- Published same day as results

**Extraction**:
- PDF parsing (PyPDF2, pdfplumber)
- Look for keywords: "order book", "order inflow", "attrition"

---

### 2. **Investor Presentations** (Good Coverage)
**Example**: TCS Q2 FY2026 Investor Presentation (Usually 30-50 slides)

**Key Slides**:
- Slide 3-5: Key metrics summary (attrition, headcount, utilization)
- Slide 10-15: Segment breakup (digital %, geography %)
- Slide 20-25: Client metrics (top 10 clients %)

**Availability**:
- Published within 1-2 days of results
- Available on company IR website
- BSE/NSE filing section

**Extraction**:
- PDF parsing
- Often have tables - easier to extract

---

### 3. **Earnings Call Transcripts** (Rich but Unstructured)
**Example**: TCS Q2 FY2026 Earnings Call

**Contains**:
- Management commentary on attrition ("improved to 12.5% from 13.2%")
- Utilization rates ("offshore utilization at 84%")
- Order book discussion
- Forward guidance

**Availability**:
- Company website (IR section)
- Third-party aggregators: SeekingAlpha, Motilal Oswal, etc.
- 1-2 days after results

**Extraction**:
- Text parsing
- NLP to extract metrics
- Search for patterns: "X% attrition", "order book of ₹X"

---

### 4. **Annual Report MD&A** (Comprehensive but Annual)
**Management Discussion & Analysis section**

**Contains**:
- Detailed segment breakup
- Customer concentration
- Capacity utilization
- Export revenue details
- Industry trends

**Availability**:
- Annual (once a year)
- Published 2-3 months after FY end
- Available on BSE/NSE, company website

**Extraction**:
- PDF parsing
- Text in narrative form - needs NLP

---

### 5. **Screener.in / Tijori Finance APIs** (Pre-aggregated)
**Commercial data providers**

**Screener.in**:
```
GET https://www.screener.in/api/company/TCS/
Returns: JSON with some operational metrics
```

**Coverage**:
- Order book (for capital goods)
- Headcount (sometimes)
- Not always updated quarterly

**Limitation**:
- May not have all sector metrics
- Rate limits on free tier

---

### 6. **Company Website - Investor Relations**
**Direct scraping**

**Examples**:
- BHEL: https://www.bhel.com/investor-relations
- TCS: https://www.tcs.com/investor-relations

**Contains**:
- Press releases
- Quarterly results
- Annual reports
- Presentations

**Extraction**:
- Web scraping (BeautifulSoup, Scrapy)
- Download PDFs and parse

---

## Implementation Options

### Option 1: Manual CSV Entry (Quick Start)
**Create**: `data/sector_metrics.csv`
```csv
symbol,fy,quarter,attrition_rate,utilization_rate,digital_revenue_pct,order_book,order_inflow
TCS,FY2026,Q2,12.5,84.0,62.5,NULL,NULL
INFY,FY2026,Q2,13.1,85.2,65.0,NULL,NULL
BHEL,FY2026,Q2,NULL,NULL,NULL,120000,8500
```

**Integration**:
- Load this CSV when generating sector reports
- Join with XBRL data by symbol + FY + quarter
- Show N/A if not available

**Pros**:
- Quick to implement (2 hours)
- Full control over data quality
- Can add data as you collect it

**Cons**:
- Manual effort every quarter
- Not scalable

---

### Option 2: PDF Parsing (Semi-Automated)
**Tools**:
- `pdfplumber` - Extract tables and text
- `camelot-py` - Specialized for tables in PDFs
- `PyPDF2` - Basic PDF text extraction

**Example Code**:
```python
import pdfplumber
import re

def extract_order_book(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text()

        # Look for patterns
        ob_match = re.search(r'order book.*?₹\s*([\d,\.]+)', text, re.I)
        if ob_match:
            return float(ob_match.group(1).replace(',', ''))
    return None

# Usage
order_book = extract_order_book('BHEL_Q2FY26_Results.pdf')
```

**Implementation Steps**:
1. Download PDFs from BSE/NSE announcements
2. Parse with pdfplumber
3. Extract metrics using regex patterns
4. Store in database table `sector_metrics_manual`
5. Use in sector analyzer

**Effort**: 1-2 weeks
**Maintenance**: 2-3 hours per quarter

---

### Option 3: Web Scraping + Screener API (Automated)
**Approach**:
1. Use Screener.in API for what's available
2. Scrape company IR pages for press releases
3. Parse PDFs automatically
4. Store in database

**Example**:
```python
import requests
from bs4 import BeautifulSoup

# Get latest results from BSE
def get_latest_results(symbol, bse_code):
    url = f"https://www.bseindia.com/stock-share-price/bharat-heavy-electricals-ltd/{symbol}/{bse_code}/"
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find announcements section
    announcements = soup.find_all('a', text=re.compile('Results'))

    # Download PDF and parse
    for ann in announcements:
        pdf_url = ann['href']
        # Download and parse...
```

**Effort**: 3-4 weeks
**Maintenance**: Mostly automated

---

### Option 4: Commercial Data Provider (Paid)
**Providers**:
1. **Capital IQ (S&P)** - $$$$
2. **Bloomberg Terminal** - $$$$
3. **FactSet** - $$$$
4. **Ace Equity** (India) - $$
5. **Capitaline** (India) - $$

**Coverage**: All metrics, pre-cleaned
**Cost**: ₹50,000 - ₹5,00,000 per year

---

## Recommended Implementation Plan

### Phase 1: Manual CSV (Week 1)
- Create `sector_metrics_manual` table in database
- Add CSV upload interface
- Manually enter data for top 20 stocks
- Show in reports

### Phase 2: PDF Parser (Week 2-3)
- Build PDF parsing module
- Extract order book, attrition from press releases
- Store in database
- Run quarterly after results

### Phase 3: Web Scraper (Week 4-6)
- Scrape BSE/NSE for latest filings
- Download PDFs automatically
- Parse and store
- Schedule daily runs

### Phase 4: Data Quality (Ongoing)
- Add validation rules
- Flag anomalies
- Manual review interface
- Historical backfill

---

## Database Schema

```sql
CREATE TABLE sector_metrics_manual (
    symbol VARCHAR(20),
    fy VARCHAR(10),          -- 'FY2026'
    quarter VARCHAR(5),      -- 'Q2'
    date DATE,

    -- IT Metrics
    attrition_rate DECIMAL(5,2),
    utilization_rate DECIMAL(5,2),
    digital_revenue_pct DECIMAL(5,2),
    headcount INTEGER,
    top_client_pct DECIMAL(5,2),

    -- Capital Goods Metrics
    order_book DECIMAL(15,2),  -- in crores
    order_inflow DECIMAL(15,2),
    capacity_utilization DECIMAL(5,2),
    export_revenue_pct DECIMAL(5,2),

    -- Meta
    data_source VARCHAR(100),  -- 'Investor Presentation', 'Press Release', etc.
    data_quality VARCHAR(20),  -- 'verified', 'estimated', 'needs_review'
    entered_by VARCHAR(50),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (symbol, fy, quarter)
);
```

---

## Quick Start: Manual Data Entry

1. **Download latest results**:
   - Go to BSE: https://www.bseindia.com/
   - Search for BHEL
   - Click "Corporate Announcements"
   - Download "Financial Results" PDF

2. **Extract metrics** (manually):
   - Open PDF
   - Look for "Order Book: ₹1.2 lakh crore"
   - Note down in spreadsheet

3. **Add to database**:
```sql
INSERT INTO sector_metrics_manual VALUES
('BHEL', 'FY2026', 'Q2', '2024-10-30',
 NULL, NULL, NULL, NULL, NULL,  -- IT metrics (not applicable)
 120000, 8500, NULL, NULL,        -- Capital goods metrics
 'Press Release Q2 FY26', 'verified', 'manual', NOW());
```

4. **Update sector analyzer** to read from this table:
```python
# In capital_goods_sector.py
def _analyze_order_book(self):
    # Try to get from manual table first
    manual_data = self._get_manual_metrics()
    if manual_data and manual_data.get('order_book'):
        order_book = manual_data['order_book']
    else:
        order_book = self._safe_float(latest.get('order_book', 0))
```

---

## Next Steps

**For immediate use** (1-2 hours):
1. Create CSV with 20-30 key data points for top stocks
2. Load into database
3. Show in reports
4. Continue showing N/A for missing data

**For automation** (2-4 weeks):
1. Build PDF parser
2. Scrape BSE/NSE for filings
3. Extract metrics using regex/NLP
4. Validate and store

**Would you like me to**:
1. Create the manual CSV structure and sample data?
2. Build a PDF parser for press releases?
3. Create database table and integration code?

Let me know which approach you want to start with!
