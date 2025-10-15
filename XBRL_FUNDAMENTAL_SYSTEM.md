# XBRL Fundamental Data System

Complete system for processing XBRL financial statements and calculating fundamental ratios.

## 📋 Overview

This system parses XBRL files (Indian company financial statements from MCA/NSE), calculates 25+ fundamental ratios, and stores them in Firestore with `source="xbrl"` to mark them as authentic data.

---

## 🗂️ System Components

### 1. **xbrl_parser.py** - XBRL Parser
Parses XBRL XML files and extracts financial data.

**Features:**
- Extracts Balance Sheet data (Assets, Liabilities, Equity)
- Extracts P&L data (Revenue, Profit, Expenses)
- Extracts Cash Flow data
- Handles Indian XBRL taxonomy
- Auto-detects reporting period

**Usage:**
```bash
# Test parser standalone
python3 scripts/xbrl_parser.py company_financials.xml
```

### 2. **fundamental_calculator.py** - Ratio Calculator
Combines XBRL data with current market price to calculate ratios.

**Ratios Calculated (25+):**
- **Valuation**: P/E, P/B, P/S, EV/EBITDA
- **Profitability**: ROE, ROA, ROCE, Net Margin, EBITDA Margin
- **Liquidity**: Current Ratio, Quick Ratio
- **Leverage**: Debt/Equity, Debt/Assets
- **Per Share**: EPS, Book Value, Revenue/Share, Cash/Share
- **Dividend**: Yield, Payout Ratio

**Usage:**
```python
from fundamental_calculator import FundamentalCalculator

calculator = FundamentalCalculator()
fundamentals = calculator.calculate(xbrl_data, 'RELIANCE')
calculator.display(fundamentals)
calculator.close()
```

### 3. **xbrl_eod.py** - Main Batch Processor
End-of-day processor for XBRL files (like `analyze-symbols-duckdb.py` for technical data).

**Features:**
- Process single or multiple XBRL files
- Auto-extract symbol from filename
- Fetch current price from DuckDB
- Calculate all ratios
- Save to Firestore with `source="xbrl"`

**Usage:**
```bash
# Single company
python3 scripts/xbrl_eod.py RELIANCE /path/to/reliance.xml

# Auto-detect symbol from filename
python3 scripts/xbrl_eod.py /path/to/RELIANCE_2024.xml

# Batch process directory
python3 scripts/xbrl_eod.py --dir /path/to/xbrl_files/
```

---

## 🔥 Firestore Schema

### Collection: `symbols`
Each symbol document now contains both technical and fundamental data:

```typescript
{
  symbol: "NS_RELIANCE",
  originalSymbol: "RELIANCE",

  // Technical Analysis (from analyze-symbols-duckdb.py)
  technical: {
    lastPrice: 2500.00,
    sma50: 2450.00,
    rsi14: 65.5,
    // ... other technical indicators
  },

  // Fundamental Analysis (from xbrl_eod.py) ⭐ NEW
  fundamentals: {
    source: "xbrl",  // ⭐ Marks as authentic XBRL data
    currentPrice: 2500.00,
    marketCap: 16890000000000,
    marketCapCr: 1689000.00,

    // Valuation Ratios
    PE: 25.50,
    PB: 3.20,
    PS: 2.10,
    EVEBITDA: 15.20,

    // Profitability (%)
    ROE: 15.80,
    ROA: 8.50,
    ROCE: 12.30,
    netProfitMargin: 10.50,
    EBITDAMargin: 18.20,

    // Liquidity & Leverage
    currentRatio: 1.35,
    quickRatio: 0.90,
    debtToEquity: 0.65,
    debtToAssets: 0.28,

    // Per Share (₹)
    EPS: 98.00,
    bookValuePerShare: 781.25,
    revenuePerShare: 1190.50,
    cashPerShare: 145.00,
    dividendPerShare: 18.00,

    // Dividend
    dividendYield: 0.72,
    dividendPayoutRatio: 18.37,

    // Absolute (₹ Cr)
    revenueCr: 804100.00,
    netProfitCr: 84400.00,
    ebitdaCr: 146300.00,
    totalAssetsCr: 992500.00,
    totalEquityCr: 527500.00,
    totalDebtCr: 343200.00,
    cashCr: 97900.00,

    // Metadata
    reportingPeriod: "2024-03-31",
    lastUpdated: Timestamp,
  },

  // XBRL Raw Snapshot (for reference)
  xbrlSnapshot: {
    revenue: 8041000000000,
    netProfit: 844000000000,
    totalAssets: 9925000000000,
    totalEquity: 5275000000000,
    totalDebt: 3432000000000,
    eps: 98.00,
    reportingPeriod: "2024-03-31",
  },

  // Timestamps
  lastFetched: Timestamp,           // Technical data update time
  lastFetchedFundamentals: Timestamp, // Fundamental data update time
}
```

---

## 🎯 Why `source="xbrl"` Matters

XBRL data is **audited financial statement data** filed with regulators (MCA/NSE). It's the most authentic source for fundamental data.

**Comparison:**

| Data Source | Authentic? | Frequency | Coverage |
|-------------|-----------|-----------|----------|
| **XBRL (MCA/NSE)** | ✅ Official audited data | Quarterly/Annual | All listed companies |
| NSE Screener | ⚠️ May have delays | Daily | Limited metrics |
| Third-party APIs | ⚠️ Depends on provider | Varies | Varies |
| Web Scraping | ❌ Unofficial | Varies | Unreliable |

---

## 🚀 Workflow

### Step 1: Download XBRL Files
Download XBRL files from:
- **MCA Portal**: `mca.gov.in` (₹100/company/year)
- **NSE NEAPS**: `nseindia.com/companies-listing/xbrl-information`

Save files with naming pattern: `SYMBOL_YYYY.xml` (e.g., `RELIANCE_2024.xml`)

### Step 2: Process XBRL Files
```bash
# Process single company
python3 scripts/xbrl_eod.py RELIANCE data/xbrl/RELIANCE_2024.xml

# Process all companies
python3 scripts/xbrl_eod.py --dir data/xbrl/
```

### Step 3: Data is Stored in Firestore
The script automatically:
1. Parses XBRL → Extracts financial data
2. Fetches current price from DuckDB
3. Calculates 25+ ratios
4. Saves to Firestore with `source="xbrl"`

### Step 4: Use in Frontend
Access fundamental data alongside technical data:

```typescript
// In your Next.js app
const symbolDoc = await db.collection('symbols').doc('NS_RELIANCE').get();
const data = symbolDoc.data();

// Technical data
const technicalSignal = data.technical.overallSignal; // "BUY"
const rsi = data.technical.rsi14; // 65.5

// Fundamental data (authentic XBRL)
const pe = data.fundamentals.PE; // 25.50
const roe = data.fundamentals.ROE; // 15.80
const source = data.fundamentals.source; // "xbrl" ⭐

// Show badge: "Source: XBRL (Audited)" in UI
```

---

## 📊 Example Output

```
======================================================================
📊 Fundamental Analysis: RELIANCE (Source: XBRL)
======================================================================

💰 Market Valuation:
  Current Price:    ₹     2,500.00
  Market Cap:       ₹  1,689,000.00 Cr
  Enterprise Value: ₹  1,934,300.00 Cr

📈 Valuation Ratios:
  P/E Ratio:                  25.50
  P/B Ratio:                   3.20
  P/S Ratio:                   2.10
  EV/EBITDA:                  15.20

💹 Profitability Metrics:
  ROE:                        15.80%
  ROA:                         8.50%
  ROCE:                       12.30%
  Net Profit Margin:          10.50%
  EBITDA Margin:              18.20%

💧 Liquidity & Leverage:
  Current Ratio:               1.35
  Quick Ratio:                 0.90
  Debt to Equity:              0.65
  Debt to Assets:              0.28

💵 Per Share Metrics:
  EPS:              ₹        98.00
  Book Value/Share: ₹       781.25
  Revenue/Share:    ₹     1,190.50
  Cash/Share:       ₹       145.00

💰 Dividend:
  Dividend/Share:   ₹        18.00
  Dividend Yield:             0.72%
  Payout Ratio:              18.37%

📊 Financial Summary (₹ Crores):
  Revenue:          ₹   804,100.00 Cr
  Net Profit:       ₹    84,400.00 Cr
  EBITDA:           ₹   146,300.00 Cr
  Total Assets:     ₹   992,500.00 Cr
  Total Equity:     ₹   527,500.00 Cr
  Total Debt:       ₹   343,200.00 Cr
  Cash & Equiv.:    ₹    97,900.00 Cr
======================================================================
```

---

## 🔄 Integration with Existing System

### Before (Technical Only):
```
symbols collection:
  - technical: { sma50, rsi14, ... }
```

### After (Technical + Fundamental):
```
symbols collection:
  - technical: { sma50, rsi14, ... }
  - fundamentals: { PE, ROE, source: "xbrl", ... } ⭐ NEW
  - xbrlSnapshot: { revenue, netProfit, ... } ⭐ NEW
```

Both datasets coexist peacefully! The `merge=True` flag ensures we don't overwrite existing technical data.

---

## 📝 File Naming Convention

For auto-detection to work, name your XBRL files:

```
✅ RELIANCE_2024.xml
✅ TCS_FY2024.xml
✅ BAJFINANCE_Q4_2024.xml
✅ NSE_INFY_2024.xml

❌ company_123.xml (no symbol)
❌ financial_data.xml (no symbol)
```

The parser extracts the first uppercase word as the symbol.

---

## 🛠️ Dependencies

```bash
# Already installed (Python standard library)
- xml.etree.ElementTree
- datetime
- re
- glob

# From your existing system
- firebase_admin
- firestore
- scripts/experimental/fetch_nse_data (for DuckDB prices)
```

---

## 🎓 Next Steps

1. **Download XBRL files** from MCA/NSE for your portfolio symbols
2. **Save in organized directory**: `data/xbrl/SYMBOL_YYYY.xml`
3. **Run batch processor**: `python3 scripts/xbrl_eod.py --dir data/xbrl/`
4. **Update frontend** to display fundamental ratios with "XBRL Verified" badge
5. **Set up quarterly refresh** when companies file new results

---

## 🔐 Data Authenticity

All fundamental data stored with `source="xbrl"` is:
- ✅ **Audited** by chartered accountants
- ✅ **Regulatory compliant** (MCA/SEBI)
- ✅ **Legally binding** corporate disclosures
- ✅ **Traceable** to official filings

This is the same data institutional investors use!

---

## 🚨 Important Notes

1. **XBRL files are quarterly/annual** - Don't expect daily updates
2. **Current price needed for ratios** - Must have DuckDB EOD data
3. **Manual download required** - No automatic XBRL fetching (yet)
4. **Large files** - XBRL XML files can be 5-50 MB each
5. **Parsing time** - May take 5-30 seconds per file

---

## ✅ Summary

You now have a complete system to:
- ✅ Parse XBRL financial statements
- ✅ Calculate 25+ fundamental ratios
- ✅ Combine with market price data
- ✅ Store in Firestore with `source="xbrl"`
- ✅ Integrate with existing technical analysis

**The authentic fundamental data is marked with `source="xbrl"` so your users know it's official audited data!** 🎯
