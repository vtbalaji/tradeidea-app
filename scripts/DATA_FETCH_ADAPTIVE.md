# Adaptive Data Fetch Configuration

## Overview
Script now uses **adaptive data fetching** - tries to fetch 200 days but works with whatever is available (minimum 50 days).

## What Changed
- **File**: `scripts/analyze-symbols-duckdb.py`
- **Behavior**: Fetch up to 200 days, use whatever is available, minimum cutoff 50 days

## How It Works

### Data Fetching Strategy
1. **Try to fetch 200 days** for full analysis
2. **DuckDB returns whatever is available** (e.g., new symbols might have only 60 days)
3. **Minimum cutoff: 50 days** - skip symbols with less than 50 days

### Adaptive Indicator Calculation
Indicators are calculated **only if enough data exists**:

```python
# SMA20 needs 20 days
sma20 = calculate() if data_points >= 20 else None

# SMA200 needs 200 days
sma200 = calculate() if data_points >= 200 else None
```

## Impact by Data Availability

### Symbol with 200+ days (Established stocks)
| Indicator | Status |
|-----------|--------|
| SMA20, SMA50 | ✅ Available |
| SMA100, SMA200 | ✅ Available |
| EMA9, EMA21, EMA50 | ✅ Available |
| RSI14, MACD, BB | ✅ Available |
| Quarterly change | ✅ Available |

### Symbol with 100-199 days (Moderately new)
| Indicator | Status |
|-----------|--------|
| SMA20, SMA50 | ✅ Available |
| SMA100 | ✅ Available |
| SMA200 | ❌ Set to 0 |
| EMA9, EMA21, EMA50 | ✅ Available |
| RSI14, MACD, BB | ✅ Available |
| Quarterly change | ✅ Available |

### Symbol with 50-99 days (New listings)
| Indicator | Status |
|-----------|--------|
| SMA20, SMA50 | ✅ Available |
| SMA100, SMA200 | ❌ Set to 0 |
| EMA9, EMA21, EMA50 | ✅ Available |
| RSI14, MACD, BB | ✅ Available |
| Quarterly change | Depends on days |

### Symbol with <50 days
| Status | Action |
|--------|--------|
| ⏭️ Skipped | Not enough data for meaningful analysis |

## Benefits

1. **Maximum Coverage**: Analyzes as many symbols as possible
2. **Full Analysis When Possible**: Established stocks get all 200+ day indicators
3. **Partial Analysis for New Stocks**: Recent IPOs still get useful analysis
4. **Graceful Degradation**: UI handles missing indicators without errors

## UI Behavior

The TechnicalLevelsCard component handles this automatically:

```tsx
{/* Only shows if sma200 exists and is not 0 */}
{technicals.sma200 && priceToCompare && (
  <div>200 MA: ₹{technicals.sma200}</div>
)}
```

**Result**: Missing indicators simply don't appear - no errors!

## Examples

### Example 1: RELIANCE (listed for years)
```
📊 Calculating indicators with 200 days of data...
✅ SMA20, SMA50, SMA100, SMA200 - all available
✅ Quarterly change - available
```

### Example 2: Recent IPO (70 days since listing)
```
📊 Calculating indicators with 70 days of data...
✅ SMA20, SMA50 - available
❌ SMA100, SMA200 - set to 0 (need 100/200 days)
✅ Quarterly change - available (70 > 63)
```

### Example 3: Very Recent IPO (40 days since listing)
```
⏭️ Skipping - insufficient data (40 < 50 days)
```

## Testing

Test with different scenarios:

```bash
# Established stock (should get 200 days)
echo "no" | ./venv/bin/python3 scripts/analyze-symbols-duckdb.py RELIANCE

# Check output for:
# - "Calculating indicators with XXX days of data..."
# - SMA100, SMA200 values (should be non-zero)
```

## Performance

| Scenario | Data Fetched | Processing Time |
|----------|--------------|-----------------|
| Established stock (200+ days) | 200 days | ~1-2 sec |
| New stock (50-199 days) | Actual days available | ~0.5-1.5 sec |
| Very new (<50 days) | Skipped | ~0.1 sec |

**Average**: Still much faster than fetching 730 days for all symbols!

---
**Last Updated**: 2025-10-21
**Strategy**: Adaptive - fetch 200, use what's available, minimum 50
