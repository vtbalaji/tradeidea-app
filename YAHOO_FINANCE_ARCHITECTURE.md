# Yahoo Finance Data Architecture

## Overview

This document explains how Yahoo Finance data flows through the system and the relationship between different Yahoo-related modules.

## Components

### 1. `yahoo_fundamentals_fetcher.py`

**Purpose**: Fetch and store Yahoo Finance quarterly fundamentals in **separate DuckDB tables**

**Tables Created**:
- `yahoo_quarterly_fundamentals` - Historical quarterly income statement and balance sheet data
- `yahoo_current_fundamentals` - Latest snapshot of valuation ratios, profitability, growth metrics

**Usage**:
```python
from yahoo_fundamentals_fetcher import YahooFundamentalsFetcher

fetcher = YahooFundamentalsFetcher()
fetcher.fetch_and_store('TCS')
```

**Data Stored**:
- Quarterly revenue, EBITDA, net income
- EPS, diluted EPS
- Balance sheet items (assets, equity, debt, cash)
- YoY growth rates
- Current valuation ratios (PE, PB, PS, etc.)
- Profitability metrics (ROE, ROA, margins)

**Used By**:
- `analyze-fundamentals.py` - Called for every stock to store Yahoo data
- `update_PEG_fundamentals.py` - For PEG ratio calculations

**Limitation**: This data is stored in separate tables and is **NOT directly used by forensic calculations** which only read from `xbrl_data` table.

---

### 2. `yahoo_xbrl_enricher.py` (NEW)

**Purpose**: Enrich the `xbrl_data` table with missing fields needed for forensic calculations

**Tables Modified**:
- `xbrl_data` - Adds `market_cap`, `current_price`, `yahoo_enriched_at` columns

**Usage**:
```python
from yahoo_xbrl_enricher import YahooXBRLEnricher

enricher = YahooXBRLEnricher()
enricher.enrich_symbol('TCS')
```

**Data Added to XBRL**:
- `market_cap` - Required for Altman Z-Score X4 component
- `current_price` - For price-based calculations
- Shares outstanding (when missing from XBRL)

**Smart Optimization**:
1. **First tries** to use data from `yahoo_current_fundamentals` (faster, no API call)
2. **Falls back** to Yahoo Finance API if stored data not available
3. **Leverages** `yahoo_quarterly_fundamentals` for shares outstanding

**Used By**:
- `analyze-fundamentals.py` - Automatically called after storing Yahoo data
- Can be run standalone to enrich existing XBRL data

**Benefit**: Enables forensic calculations by enriching the `xbrl_data` table that forensic analyzer reads from.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  analyze-fundamentals.py                        │
│                                                                 │
│  For each stock:                                                │
│  1. Fetch Yahoo fundamentals → fetch_fundamentals()             │
│  2. Save to Firebase → save_to_firestore()                      │
│  3. Save to DuckDB → save_to_duckdb()                           │
│     ├─ YahooFundamentalsFetcher.fetch_and_store()              │
│     │  └─ Stores in yahoo_quarterly_fundamentals &              │
│     │     yahoo_current_fundamentals tables                     │
│     │                                                            │
│     └─ YahooXBRLEnricher.enrich_symbol()                        │
│        ├─ Reads from yahoo_current_fundamentals (if available)  │
│        └─ Enriches xbrl_data table with market_cap & price      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DuckDB Tables                             │
│                                                                 │
│  ┌───────────────────────────────────────┐                     │
│  │  yahoo_quarterly_fundamentals          │                     │
│  │  - Quarterly income statement          │                     │
│  │  - Quarterly balance sheet             │                     │
│  │  - YoY growth rates                    │                     │
│  └───────────────────────────────────────┘                     │
│                                                                 │
│  ┌───────────────────────────────────────┐                     │
│  │  yahoo_current_fundamentals            │                     │
│  │  - Latest PE, PB, PS ratios            │                     │
│  │  - ROE, ROA, margins                   │                     │
│  │  - Market cap, current price           │                     │
│  └───────────────────────────────────────┘                     │
│                      │                                          │
│                      │ (Used by enricher)                       │
│                      ▼                                          │
│  ┌───────────────────────────────────────┐                     │
│  │  xbrl_data (ENRICHED)                  │◄──── Forensic       │
│  │  - NSE XBRL financial data             │      Analyzer       │
│  │  - + market_cap (from Yahoo)           │      Reads This     │
│  │  - + current_price (from Yahoo)        │                     │
│  │  - + yahoo_enriched_at timestamp       │                     │
│  └───────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              forensics/forensic_analyzer.py                     │
│                                                                 │
│  Reads ONLY from xbrl_data table via data_loader.py            │
│  Now has access to:                                             │
│  - All XBRL financial data                                      │
│  - Market cap (enriched from Yahoo)                             │
│  - Current price (enriched from Yahoo)                          │
│                                                                 │
│  Runs all forensic models:                                      │
│  ✓ Beneish M-Score                                              │
│  ✓ Altman Z-Score (X4 component now works!)                     │
│  ✓ Piotroski F-Score                                            │
│  ✓ J-Score                                                      │
│  ✓ Red Flags Detection                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Why Two Modules?

### YahooFundamentalsFetcher
- **Purpose**: Store comprehensive Yahoo data for general use
- **Audience**: Any analysis that needs Yahoo fundamentals
- **Storage**: Separate tables with full historical data
- **Used for**: PEG calculations, fundamental scores, Firebase updates

### YahooXBRLEnricher
- **Purpose**: Specifically enrich XBRL data for forensic calculations
- **Audience**: Forensic analyzer only
- **Storage**: Adds columns to existing `xbrl_data` table
- **Used for**: Enabling forensic models that need market cap

## Performance Optimization

The enricher is optimized to avoid redundant API calls:

1. **YahooFundamentalsFetcher** fetches fresh data from Yahoo API
2. Data stored in `yahoo_current_fundamentals` table
3. **YahooXBRLEnricher** reads from this table (fast, no API call)
4. Enricher only calls Yahoo API if stored data is missing

This means:
- Running `analyze-fundamentals.py TCS` makes **1 Yahoo API call** (not 2)
- The enricher reuses data from the fetcher
- Much faster when enriching multiple stocks

## Example: Full Workflow

```bash
# Run fundamentals analysis
python3 scripts/analyze-fundamentals.py TCS

# What happens:
# 1. Fetches Yahoo data → yahoo_quarterly_fundamentals + yahoo_current_fundamentals
# 2. Enriches XBRL → xbrl_data.market_cap, xbrl_data.current_price
# 3. Updates Firebase (not DuckDB changes)

# Now run forensic analysis
python3 scripts/forensics/forensic_analyzer.py TCS --statement-type consolidated

# What happens:
# 1. Reads from xbrl_data table (now enriched with market_cap)
# 2. All forensic models work correctly
# 3. Altman Z-Score X4 component uses market_cap
# 4. Complete forensic report generated
```

## Tables Summary

| Table | Purpose | Updated By | Read By |
|-------|---------|------------|---------|
| `yahoo_quarterly_fundamentals` | Yahoo quarterly data | YahooFundamentalsFetcher | PEG calculator, YahooXBRLEnricher (shares) |
| `yahoo_current_fundamentals` | Yahoo current snapshot | YahooFundamentalsFetcher | YahooXBRLEnricher (market cap, price) |
| `xbrl_data` | NSE XBRL financials + enrichment | XBRLStorage + YahooXBRLEnricher | Forensic analyzer, data_loader.py |

## Key Insight

The relationship is **complementary**:
- **YahooFundamentalsFetcher** provides comprehensive Yahoo data in separate tables
- **YahooXBRLEnricher** leverages this data to enrich XBRL records
- Together they enable both general fundamental analysis AND forensic calculations
- No redundant API calls thanks to smart caching

## Future Enhancements

1. **Consolidate tables**: Merge Yahoo data directly into xbrl_data
2. **Historical prices**: Store actual historical prices instead of estimates
3. **Cross-validation**: Compare Yahoo vs XBRL data for quality checks
4. **Data lineage**: Track which fields come from which source
