# Price Action & Enhanced Recommendation System

## Overview
Added comprehensive price action analysis to the technical analysis system, enabling detection of trend structures (higher highs/lows, lower highs/lows) and improving portfolio recommendations.

## What Was Added

### 1. Python Analysis (analyze-symbols-duckdb.py)

#### New Functions:
- **`calculate_trend_structure(df, lookback=10)`**
  - Analyzes last 10 days of price data
  - Detects if price is making higher highs + higher lows (UPTREND)
  - Detects if price is making lower highs + lower lows (DOWNTREND)
  - Otherwise classifies as SIDEWAYS
  - Returns: `('UPTREND'|'DOWNTREND'|'SIDEWAYS', pricePattern)`

- **`calculate_bb_position_history(df, bb_middle, days=5)`**
  - Tracks Bollinger Band position for last 5 days
  - Returns array: `['ABOVE', 'ABOVE', 'MIDDLE', 'BELOW', 'ABOVE']`
  - Used to confirm "closing above/below BB middle for 3+ days"

#### New Data Fields Stored in Firestore:
```python
'trendStructure': 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' | 'UNKNOWN'
'pricePattern': {
    'higherHighs': bool,
    'higherLows': bool,
    'lowerHighs': bool,
    'lowerLows': bool
}
'bbPositionHistory': ['ABOVE', 'BELOW', ...]  # Last 5 days
```

### 2. TypeScript Types (lib/investment-rules/types.ts)

Added to `TechnicalData` interface:
```typescript
trendStructure?: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' | 'UNKNOWN';
pricePattern?: {
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
};
bbPositionHistory?: ('ABOVE' | 'MIDDLE' | 'BELOW')[];
```

### 3. Enhanced Recommendation Engine (lib/exitCriteriaAnalysis.ts)

Upgraded from 3 levels to **5 levels** of recommendations:

#### STRONG SELL (🚨 Red)
- Downtrend structure (lower lows + lower highs)
- RSI < 30 (oversold panic) OR RSI > 70 with price below 50MA
- Below 50MA
- Below BB middle for last 3 days

#### SELL (⚠️ Orange)
- Downtrend OR below 50MA
- RSI < 50
- Below Bollinger Middle

#### STRONG BUY (🚀 Dark Green)
**All conditions must be met:**
- Uptrend structure (higher highs + higher lows)
- RSI 50-70 (healthy momentum)
- Above 50MA AND 200MA
- Supertrend bullish
- Above BB middle for last 3 days
- MACD bullish (macd > signal)
- Volume > average

#### BUY (📈 Light Green)
- Uptrend or Sideways
- RSI > 50
- Above 50MA
- Above BB middle for 3 days OR MACD bullish

#### HOLD (⏸️ Blue)
- Sideways/consolidation
- RSI 40-60 (neutral)
- Above 50MA
- Mixed signals

## How It Works

### Data Flow:
```
DuckDB (730 days OHLC)
    ↓
Python Script (analyze-symbols-duckdb.py)
    ↓
Calculate trend structure + BB history
    ↓
Firestore (symbols collection)
    ↓
Portfolio Card (SummaryPositionCard.tsx)
    ↓
Display recommendation badge
```

### Example Calculation:

**Stock: RELIANCE**
- Last 10 days: High₁=2500, High₂=2550 (higher high ✓)
- Last 10 days: Low₁=2450, Low₂=2480 (higher low ✓)
- Trend Structure: **UPTREND**
- RSI: 62 (healthy ✓)
- Price: Above 50MA ✓, Above 200MA ✓
- Supertrend: Bullish ✓
- BB Position (last 3 days): ['ABOVE', 'ABOVE', 'ABOVE'] ✓
- MACD: Positive ✓
- Volume: 1.5x average ✓

**Result: STRONG BUY 🚀**

## Running the Analysis

### Update Technical Data:
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web
./venv/bin/python3 scripts/analyze-symbols-duckdb.py
```

This will:
1. Fetch OHLC data from DuckDB
2. Calculate all indicators including trend structure
3. Save to Firestore symbols collection
4. Portfolio cards will automatically show new recommendations

## Testing

After running the Python script, check:
1. Portfolio page should show new recommendation badges
2. Inspect Firestore `symbols/{symbol}/technical` - should see:
   - `trendStructure`
   - `pricePattern`
   - `bbPositionHistory`

## Future Enhancements

Optional additions (not implemented yet):
- Price divergence detection (RSI divergence)
- Support/Resistance level detection
- Chart pattern recognition (head & shoulders, triangles)
- Candlestick pattern analysis
