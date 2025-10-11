# EOD Batch Job Updates - Supertrend & Period Changes

## Summary of Changes

Updated `/scripts/analyze-symbols.ts` to include:

### 1. **Daily Supertrend** (UPDATED)
- **Fields**: `supertrend`, `supertrendDirection`
- **Period**: 10
- **Multiplier**: 3
- **Calculation**: Daily timeframe (CHANGED from weekly to daily)
- **Direction**: 1 = Bullish (🟢), -1 = Bearish (🔴)
- **Note**: Same attribute name, now uses daily data instead of weekly

### 2. **Weekly Supertrend** (NEW)
- **Fields**: `weeklySupertrend`, `weeklySupertrendDirection`
- **Period**: 10
- **Multiplier**: 3
- **Calculation**: Weekly timeframe (5-day candles)
- **Direction**: 1 = Bullish (🟢), -1 = Bearish (🔴)
- **Note**: New field to preserve weekly supertrend for exit criteria

### 3. **Period Changes** (NEW)
Added percentage changes for different timeframes:

| Field | Description | Trading Days |
|-------|-------------|--------------|
| `weeklyChange` | Price change from 1 week ago | 5 days |
| `weeklyChangePercent` | % change from 1 week ago | 5 days |
| `monthlyChange` | Price change from 1 month ago | 21 days |
| `monthlyChangePercent` | % change from 1 month ago | 21 days |
| `quarterlyChange` | Price change from 1 quarter ago | 63 days |
| `quarterlyChangePercent` | % change from 1 quarter ago | 63 days |

## Technical Implementation

### New Functions Added:

1. **`calculateSupertrend(data, period, multiplier)`**
   - Calculates Supertrend indicator using ATR (Average True Range)
   - Returns both supertrend value and direction array
   - Uses standard Supertrend formula with final bands

2. **`convertToWeeklyData(data)`**
   - Converts daily OHLCV data to weekly candles
   - Groups by week (ending on Friday)
   - Returns weekly OHLCV array for weekly supertrend calculation

### Updated Interface:

```typescript
interface TechnicalAnalysis {
  // ... existing fields

  // Period Changes
  weeklyChange: number;
  weeklyChangePercent: number;
  monthlyChange: number;
  monthlyChangePercent: number;
  quarterlyChange: number;
  quarterlyChangePercent: number;

  // Supertrend (Daily)
  supertrend: number;
  supertrendDirection: number;  // 1 = bullish, -1 = bearish

  // Weekly Supertrend
  weeklySupertrend: number;
  weeklySupertrendDirection: number;  // 1 = bullish, -1 = bearish

  // Updated Signals
  signals: {
    // ... existing signals
    supertrendBullish: boolean;
    supertrendBearish: boolean;
  };
}
```

## Console Output Example

```
[1/10] Processing RELIANCE...
  📥 Incremental update from 2025-01-10 (250 existing rows)
  💾 Stored 3 new rows
  📈 Calculating indicators...
  💾 Saving to Firestore...
  📁 Saving to local file...
  ✅ RELIANCE - BUY
     Price: ₹2,856.50 (+1.25%)
     Weekly: +3.45% | Monthly: +8.75% | Quarterly: +15.30%
     RSI: 58.5 | SMA200: ₹2,650.20 | EMA50: ₹2,780.40
     Supertrend: ₹2,820.30 🟢 Bullish
     Weekly Supertrend: ₹2,750.60 🟢 Bullish
     🟢 Price ABOVE SMA200
     🟢 Price ABOVE EMA50
```

## Migration Notes

### For Frontend Code:

#### ✅ NO CHANGES NEEDED for Daily Supertrend
- `technicals.supertrend` now refers to **DAILY** supertrend (previously was weekly)
- `technicals.supertrendDirection` now refers to **DAILY** supertrend direction
- Existing display code will automatically show daily supertrend

#### ⚠️ UPDATES NEEDED for Weekly Supertrend Exit Criteria:
1. **Portfolio Page** (`app/portfolio/page.tsx`):
   - Exit criteria logic should use `weeklySupertrend` instead of `supertrend`
   - Lines checking `exitOnWeeklySupertrend` should reference `weeklySupertrend`

2. **Symbol Data Service** (`lib/symbolDataService.ts`):
   - Update `calculateTechnicalRecommendation` function
   - Change `exitOnWeeklySupertrend` check to use `weeklySupertrend` field

3. **Investment Rules** (`lib/investment-rules/`):
   - Momentum/Growth rules using supertrend for entries can keep using `supertrend` (daily)
   - If any rules specifically need weekly supertrend, update to use `weeklySupertrend`

### What This Means:
- **Display**: Shows daily supertrend (more responsive, better for intraday/swing traders)
- **Exit Criteria**: Uses weekly supertrend (more stable, reduces whipsaws)

## Running the Updated Batch Job

```bash
npm run analyze
# or
tsx scripts/analyze-symbols.ts
```

## Data Stored in Firestore

Location: `symbols/{symbolId}/technical`

All new fields will be automatically stored in the `technical` object of each symbol document.

---

**Created**: January 2025
**Version**: 2.0
