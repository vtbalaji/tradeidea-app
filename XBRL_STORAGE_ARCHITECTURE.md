# XBRL Fundamental Data Storage Architecture

## 📊 Storage Strategy

### Dual Storage Approach:
1. **DuckDB** - All historical fundamental data (all quarters)
2. **Firebase** - Latest quarter only (for fast UI access)

---

## 🗄️ Storage Details

### DuckDB Storage (`data/fundamentals.duckdb`)

**Purpose:** Historical time-series storage for fundamental data

**Tables:**

#### 1. `fundamentals` table
Stores all calculated fundamental ratios by symbol, FY, and quarter.

```sql
PRIMARY KEY: (symbol, fy, quarter)

Columns:
- symbol, fy, quarter, end_date, start_date, is_annual
- current_price, market_cap, market_cap_cr
- Valuation: pe, pb, ps, ev_ebitda
- Profitability: roe, roa, roce, margins
- Liquidity: current_ratio, quick_ratio
- Leverage: debt_to_equity, debt_to_assets
- Per Share: eps, book_value, revenue/share, etc.
- Absolute (Cr): revenue, profit, assets, equity, debt, cash
- Metadata: shares_outstanding, enterprise_value, source, created_at
```

#### 2. `xbrl_raw` table
Stores raw XBRL extracted values for reference.

```sql
PRIMARY KEY: (symbol, fy, quarter)

Columns:
- symbol, fy, quarter, end_date, start_date
- Balance Sheet: assets, equity, debt, cash, etc.
- P&L: revenue, operating_profit, ebitda, net_profit
- Other: number_of_shares, dividend_per_share, eps
```

**Example Queries:**

```python
# Get all quarters for a symbol
SELECT * FROM fundamentals WHERE symbol = 'RELIANCE' ORDER BY end_date DESC

# Get trend for ROE over last 8 quarters
SELECT fy, quarter, roe, end_date
FROM fundamentals
WHERE symbol = 'BAJFINANCE'
ORDER BY end_date DESC
LIMIT 8

# Compare PE ratios across companies
SELECT symbol, fy, quarter, pe, pb
FROM fundamentals
WHERE quarter = 'Q4' AND fy = 'FY2024'
ORDER BY pe
```

---

### Firebase Storage (`symbols` collection)

**Purpose:** Fast access to latest quarter data for UI

**Collection:** `symbols`
**Document ID:** `NS_RELIANCE`, `NS_TCS`, etc.

**Structure:**
```typescript
{
  symbol: "NS_RELIANCE",
  originalSymbol: "RELIANCE",

  // Technical data (from analyze-symbols-duckdb.py)
  technical: { /* daily technical indicators */ },

  // Latest quarter fundamental data (from xbrl_eod.py)
  fundamentals: {
    source: "xbrl",  // Marks as authentic
    fy: "FY2024",
    quarter: "Q4",
    isAnnual: true,
    endDate: "2024-03-31",
    startDate: "2023-04-01",

    // All 25+ ratios
    PE: 25.50,
    ROE: 15.80,
    // ... etc

    lastUpdated: Timestamp,
  },

  xbrlSnapshot: {
    fy: "FY2024",
    quarter: "Q4",
    revenue: 8041000000000,
    netProfit: 844000000000,
    // ... raw values
  },

  lastFetchedFundamentals: Timestamp,
}
```

**Only Latest Quarter Rule:**
- When processing XBRL data, the system checks DuckDB for the latest quarter
- Only updates Firebase if the current data is newer than what's already stored
- Old quarters are NOT stored in Firebase - they stay in DuckDB only

---

## 🔄 Data Flow

### Processing XBRL File:

```
1. Parse XBRL file → Extract financial data
   ↓
2. Detect FY and Quarter (e.g., FY2024 Q4)
   ↓
3. Fetch current market price from DuckDB (EOD data)
   ↓
4. Calculate 25+ fundamental ratios
   ↓
5. Save to DuckDB (ALL quarters, historical record)
   ↓
6. Check if this is the latest quarter
   ↓
7a. If latest → Update Firebase (for UI)
7b. If old → Skip Firebase (already have newer data)
```

### Example Scenario:

**Scenario 1: Processing Latest Quarter**
```
Input: RELIANCE FY2024 Q4 (2024-03-31)
Latest in DuckDB: FY2024 Q3 (2023-12-31)

Actions:
✅ Save to DuckDB: RELIANCE/FY2024/Q4
✅ Update Firebase: Latest quarter
```

**Scenario 2: Processing Old Quarter (Backfilling)**
```
Input: RELIANCE FY2023 Q2 (2022-09-30)
Latest in DuckDB: FY2024 Q4 (2024-03-31)

Actions:
✅ Save to DuckDB: RELIANCE/FY2023/Q2
⏭️ Skip Firebase: Not the latest quarter
```

---

## 📅 Financial Year & Quarter Detection

Indian companies follow April-March financial year:

| Quarter | Period | End Month |
|---------|--------|-----------|
| Q1 | Apr-Jun | June |
| Q2 | Jul-Sep | September |
| Q3 | Oct-Dec | December |
| Q4 | Jan-Mar | March (Annual) |

**Auto-Detection Logic:**
- Parses XBRL `startDate` and `endDate` from contexts
- Determines FY based on end date (if Mar → current year, else next year)
- Maps end month to quarter
- Detects annual reports (12-month period)

**Examples:**
- End Date: 2024-03-31, Period: 12 months → `FY2024 Q4` (Annual)
- End Date: 2023-06-30, Period: 3 months → `FY2024 Q1`
- End Date: 2023-12-31, Period: 3 months → `FY2024 Q3`

---

## 🎯 Benefits of This Architecture

### DuckDB for Historical:
✅ **Efficient storage** - Columnar format, compression
✅ **Fast analytics** - SQL queries for trends, comparisons
✅ **Complete history** - All quarters available
✅ **Offline access** - Local database
✅ **No API limits** - Query as much as you want

### Firebase for Latest:
✅ **Fast UI reads** - No need to query DuckDB
✅ **Real-time sync** - Updates immediately
✅ **Global CDN** - Fast worldwide access
✅ **Scalable** - Handles many concurrent users
✅ **Integrated** - Works with existing auth/security

### Best of Both Worlds:
- **UI shows latest quarter** (from Firebase) - instant load
- **Charts/trends use historical** (from DuckDB) - rich analytics
- **No duplicate latest data** - Single source of truth for current quarter

---

## 🚀 Usage Examples

### 1. Process XBRL Files

```bash
# Single company (latest quarter)
python3 scripts/xbrl_eod.py RELIANCE data/xbrl/RELIANCE_FY2024_Q4.xml

# Batch process (multiple quarters)
python3 scripts/xbrl_eod.py --dir data/xbrl/
```

### 2. Query Historical Data (Python)

```python
from scripts.fundamental_duckdb_storage import FundamentalStorage

storage = FundamentalStorage()

# Get latest quarter
latest = storage.get_latest_quarter('RELIANCE')
print(f"Latest: {latest['fy']} {latest['quarter']}, PE: {latest['pe']}")

# Get last 8 quarters
history = storage.get_historical_data('RELIANCE', limit=8)
for q in history:
    print(f"{q['fy']} {q['quarter']}: ROE={q['roe']}%, PE={q['pe']}")

# Get all symbols with data
symbols = storage.get_all_symbols()
print(f"Total symbols: {len(symbols)}")

storage.close()
```

### 3. Access from Frontend (Firebase)

```typescript
// Next.js component
const symbolDoc = await db.collection('symbols').doc('NS_RELIANCE').get();
const data = symbolDoc.data();

// Latest quarter fundamentals
const latest = data.fundamentals;
console.log(`${latest.fy} ${latest.quarter}`);
console.log(`P/E: ${latest.PE}, ROE: ${latest.ROE}%`);
console.log(`Source: ${latest.source}`); // "xbrl"

// Show badge: "Latest: FY2024 Q4 (Audited)"
```

### 4. Build Trend Charts (Next.js + DuckDB Query)

```typescript
// API route: /api/fundamentals/[symbol]/history
import { queryDuckDB } from '@/lib/duckdb';

export async function GET(req, { params }) {
  const { symbol } = params;

  const result = await queryDuckDB(`
    SELECT fy, quarter, end_date, pe, roe, revenue_cr, net_profit_cr
    FROM fundamentals
    WHERE symbol = ?
    ORDER BY end_date DESC
    LIMIT 8
  `, [symbol]);

  return Response.json(result);
}
```

---

## 📊 Data Locations

| Data Type | Storage | Location | Purpose |
|-----------|---------|----------|---------|
| **EOD Prices** | DuckDB | `data/eod.duckdb` | Daily price/volume |
| **Fundamentals (Historical)** | DuckDB | `data/fundamentals.duckdb` | All quarters |
| **Fundamentals (Latest)** | Firebase | `symbols/{symbol}/fundamentals` | UI display |
| **Technical Analysis** | Firebase | `symbols/{symbol}/technical` | UI display |

---

## 🔐 Data Authenticity

All fundamental data has:
- **`source: "xbrl"`** - Marks as audited data
- **`fy` and `quarter`** - Clear reporting period
- **`isAnnual`** - Identifies full year reports
- **`endDate` and `startDate`** - Exact periods

Users can trust this data because:
✅ Sourced from official XBRL filings (MCA/NSE)
✅ Same data used by institutional investors
✅ Audited by chartered accountants
✅ Legally binding corporate disclosures

---

## 📝 File Locations

| File | Purpose |
|------|---------|
| `scripts/xbrl_parser.py` | Parse XBRL XML, extract data, detect FY/Quarter |
| `scripts/fundamental_calculator.py` | Calculate ratios from XBRL + price |
| `scripts/fundamental_duckdb_storage.py` | DuckDB storage module |
| `scripts/xbrl_eod.py` | Main processor (DuckDB + Firebase) |
| `data/fundamentals.duckdb` | Historical fundamental data |

---

## ✅ Summary

**Storage Strategy:**
- 📊 **DuckDB** - Complete historical archive (all quarters)
- 🔥 **Firebase** - Latest quarter only (fast UI access)

**Why This Works:**
- Firebase reads are fast for UI
- DuckDB queries enable rich analytics
- No data duplication
- Clear separation of concerns
- Scalable architecture

**Perfect for:**
- Displaying latest ratios in stock cards
- Showing quarterly trends in charts
- Comparing companies across periods
- Building fundamental screeners
- Tracking metric changes over time

Your fundamental data is now professionally organized! 🎯
