# Yahoo Finance XBRL Data Enrichment

## Overview

This implementation enriches XBRL data in DuckDB with missing fields from Yahoo Finance that are required for forensic calculations. The enrichment happens automatically when running `analyze-fundamentals.py`.

## What Was Missing

The XBRL data from NSE financial results lacked certain fields needed for forensic analysis:

1. **Market Capitalization** - Required for Altman Z-Score X4 component
2. **Current Price** - For valuation calculations
3. **Shares Outstanding** - For per-share calculations when missing from XBRL

## Solution Architecture

### New Module: `yahoo_xbrl_enricher.py`

This module enriches XBRL data in DuckDB with Yahoo Finance data:

```python
from yahoo_xbrl_enricher import YahooXBRLEnricher

enricher = YahooXBRLEnricher()
enricher.enrich_symbol('TCS')
enricher.close()
```

#### How It Works

1. **Fetches Current Market Data** from Yahoo Finance:
   - Current price
   - Market capitalization
   - Shares outstanding

2. **Enriches Historical XBRL Records**:
   - For the most recent quarter: Uses Yahoo's actual market cap
   - For older quarters: Calculates market cap using historical data
   - Matches Yahoo quarterly balance sheet data with XBRL periods (±45 days)
   - Estimates historical prices using P/B ratio when available

3. **Updates DuckDB**:
   - Adds `market_cap`, `current_price`, `yahoo_enriched_at` columns to `xbrl_data` table
   - Preserves all existing XBRL data
   - Does NOT touch Firebase

### Integration with `analyze-fundamentals.py`

The enrichment is now automatically triggered when running:

```bash
# Single stock
python3 scripts/analyze-fundamentals.py TCS

# All stocks
python3 scripts/analyze-fundamentals.py
```

The `save_to_duckdb()` function now:
1. Saves Yahoo quarterly fundamentals
2. Enriches XBRL data with market cap and price
3. Reports enrichment status

## Database Schema Changes

New columns added to `xbrl_data` table:

```sql
ALTER TABLE xbrl_data ADD COLUMN market_cap DOUBLE;
ALTER TABLE xbrl_data ADD COLUMN current_price DOUBLE;
ALTER TABLE xbrl_data ADD COLUMN yahoo_enriched_at TIMESTAMP;
```

## Usage Examples

### Enrich a Single Symbol

```bash
python3 scripts/yahoo_xbrl_enricher.py TCS
```

### Enrich All Symbols

```bash
python3 scripts/yahoo_xbrl_enricher.py
```

### Run Forensic Analysis (Now Works!)

```bash
# With standalone data
python3 scripts/forensics/forensic_analyzer.py TCS

# With consolidated data (usually more historical data available)
python3 scripts/forensics/forensic_analyzer.py TCS --statement-type consolidated
```

## Forensic Calculations Now Supported

With the enriched data, all forensic models work properly:

1. **Beneish M-Score** - Earnings manipulation detection
2. **Altman Z-Score** - Bankruptcy prediction (X4 component now works!)
3. **Piotroski F-Score** - Fundamental strength
4. **J-Score** - Cash flow quality
5. **Red Flags Detection** - Comprehensive financial anomaly detection

## Example Output

```
📊 Enriching XBRL data for TCS with Yahoo Finance...
  ✅ Enriched 31 XBRL records with Yahoo data
     Market Cap: ₹1108293 Cr
     Price: ₹3063.20
```

## Verification

Check enrichment status:

```bash
duckdb data/fundamentals.duckdb "
SELECT symbol, fy, quarter, market_cap, current_price, yahoo_enriched_at
FROM xbrl_data
WHERE symbol = 'TCS'
ORDER BY end_date DESC
LIMIT 5
"
```

## Important Notes

1. **No Firebase Changes**: This implementation ONLY updates DuckDB, as requested
2. **Automatic Enrichment**: Runs automatically with `analyze-fundamentals.py`
3. **Historical Approximation**: Historical prices are estimated using P/B ratios
4. **Data Matching**: Yahoo quarters matched to XBRL periods within 45 days
5. **Shares Outstanding**: Falls back to Yahoo data if XBRL missing

## Files Modified/Created

### Created
- `scripts/yahoo_xbrl_enricher.py` - Main enrichment module

### Modified
- `scripts/analyze-fundamentals.py` - Integrated enrichment into save_to_duckdb()

### Database
- `data/fundamentals.duckdb` - Schema updated with new columns

## Future Enhancements

Potential improvements:

1. Store historical Yahoo prices instead of estimating
2. Add more Yahoo balance sheet fields
3. Enrich with industry benchmarks
4. Add data quality scores
5. Cache Yahoo API calls to reduce API usage

## Testing

Tested with:
- TCS (consolidated): 5 years of data, all forensic models working
- RELIANCE: Market cap enrichment successful
- Multiple forensic calculations: All passing
