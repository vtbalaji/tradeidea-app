# NSE Batch Getting Stuck - Solutions

## Problem

The NSE batch script gets stuck when processing many symbols (2,165 symbols) because:
1. NSE rate limiting (too many requests)
2. Network timeouts
3. Some symbols taking too long to fetch

## Solutions Implemented

### 1. Added Retry Logic with Exponential Backoff

**File**: `scripts/fetch_nse_data.py`

- Retries failed fetches up to 3 times
- Exponential backoff: 2s, 4s, 6s between retries
- Adds 0.5s delay between all requests to avoid rate limiting

### 2. Added Timeout Protection

**File**: `scripts/analyze-symbols-duckdb.py`

- 60-second timeout per symbol
- Skips symbols that take too long
- Continues processing other symbols

### 3. Better Error Handling

- Catches and logs specific errors
- Doesn't crash entire batch on single symbol failure
- Provides clear error messages

## Recommended Solutions

### Option 1: Use Original Yahoo Finance (Fastest Right Now)

Since you have 2,165 symbols and it's the first run:

```bash
# Use the original version for now
./eod_batch_yahoo.sh
```

**Why this works better initially:**
- Yahoo Finance handles bulk requests better
- No need to download 2 years of data initially
- Can switch to DuckDB later for incremental updates

### Option 2: Gradual Migration (Best Long-term)

**Step 1**: Run Yahoo Finance batch now
```bash
./eod_batch_yahoo.sh
```

**Step 2**: Fetch NSE data in background (once)
```bash
# Run this overnight or in background
nohup npm run fetch-nse > logs/nse_initial_load.log 2>&1 &
```

**Step 3**: After initial load completes, switch to DuckDB
```bash
# Incremental updates will be fast
./eod_batch.sh
```

### Option 3: Hybrid Approach (Reliable)

Update `eod_batch.sh` to use Yahoo Finance when NSE is slow:

```bash
#!/bin/bash
set -e

echo "🚀 Starting EOD Technical Analysis Batch Job"
echo "============================================"

# Try DuckDB first (with 30 minute timeout)
timeout 1800 source venv/bin/activate && python3 scripts/analyze-symbols-duckdb.py || {
    echo "⚠️  DuckDB batch timed out or failed"
    echo "🔄 Falling back to Yahoo Finance..."
    source venv/bin/activate && python3 scripts/analyze-symbols.py
}

echo "✅ EOD Batch Job Completed!"
```

## Quick Fixes

### Fix 1: Process Symbols in Batches

Modify `analyze-symbols-duckdb.py` to process only N symbols at a time:

```python
# In analyze_symbols() function, add:
MAX_SYMBOLS_PER_RUN = 500  # Process 500 at a time

symbols = get_symbols()[:MAX_SYMBOLS_PER_RUN]  # First 500 only
```

Then run the batch script 5 times to process all 2,165 symbols.

### Fix 2: Skip Symbols with Existing Data

For incremental updates only:

```python
# In analyze_symbols() function:
for symbol in symbols:
    # Skip if already processed today
    last_date = nse_fetcher.get_last_date(symbol)
    if last_date == date.today():
        print(f'  ✅ {symbol} - Already updated today')
        continue
```

### Fix 3: Increase Delays

If NSE is rate-limiting, increase the delay:

```python
# In fetch_nse_data.py, line 124:
time.sleep(1.0)  # Increase from 0.5 to 1.0 seconds
```

## What I Recommend

### For Right Now (Immediate)

```bash
# Use Yahoo Finance to get everything updated
./eod_batch_yahoo.sh
```

This will complete in ~2-3 hours for 2,165 symbols.

### For Tomorrow Onwards (Long-term)

The DuckDB version will be much faster for incremental daily updates because:
- It only needs to fetch 1 day of data (not 2 years)
- DuckDB cache means no network calls for calculations
- With proper delays, should complete in ~1 hour

**Modified workflow:**

1. **Week 1**: Use `eod_batch_yahoo.sh` daily
2. **Weekend**: Run NSE initial load in background
3. **Week 2+**: Switch to `eod_batch.sh` (DuckDB + NSE)

## Performance Comparison

| Scenario | Yahoo Finance | DuckDB + NSE (First Run) | DuckDB + NSE (Daily) |
|----------|--------------|--------------------------|---------------------|
| 2,165 symbols | ~2-3 hours | ~8-12 hours* | ~1-2 hours |
| Network calls | 2,165 | 2,165 | 2,165 (but faster) |
| Data per call | ~500 rows | ~500 rows | ~1 row |
| Rate limiting | Rare | Common | Rare |

*With delays to avoid rate limiting

## Monitoring

To monitor the batch script:

```bash
# Run in background with logging
nohup ./eod_batch.sh > logs/eod_$(date +%Y%m%d).log 2>&1 &

# Watch progress
tail -f logs/eod_$(date +%Y%m%d).log

# Check how many symbols processed
grep "✅.*STRONG" logs/eod_$(date +%Y%m%d).log | wc -l
```

## Decision Tree

```
Is this your first run?
├─ YES → Use Yahoo Finance (./eod_batch_yahoo.sh)
│        Then load NSE data overnight
│
└─ NO → Is daily update? (only need today's data)
    ├─ YES → Use DuckDB (./eod_batch.sh) ✅ Fast!
    └─ NO → Use Yahoo Finance (./eod_batch_yahoo.sh)
```

## Summary

**Right now**: Use `./eod_batch_yahoo.sh` - it will complete successfully.

**Future**: Switch to `./eod_batch.sh` once the initial NSE data is loaded in DuckDB. Daily incremental updates will be much faster.

The NSE + DuckDB approach is best for **daily incremental updates**, not for **initial bulk loads** of 2+ years of data for 2,000+ symbols.
