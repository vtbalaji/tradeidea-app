# EOD Analysis - Quick Reference

## Current Setup (Yahoo Finance)

### Run Daily EOD Analysis

```bash
./eod_batch.sh
```

That's it! This will:
- Fetch EOD data from Yahoo Finance
- Calculate technical indicators
- Update Firestore with results
- Complete in ~2-3 hours for 2,165 symbols

### Alternative Commands

```bash
# Using npm
npm run analyze

# Direct python
source venv/bin/activate && python3 scripts/analyze-symbols.py
```

## What It Does

For each symbol, the script:
1. ✅ Fetches 2 years of OHLCV data
2. ✅ Calculates technical indicators:
   - Moving Averages (SMA 20/50/100/200, EMA 9/21/50)
   - Supertrend (Daily & Weekly)
   - RSI (14-period)
   - MACD (12/26/9)
   - Bollinger Bands (20/2)
3. ✅ Calculates period changes (Weekly, Monthly, Quarterly)
4. ✅ Generates trading signals and overall score
5. ✅ Saves to Firestore (`symbols` collection)

## Monitoring

```bash
# Run in background with logging
nohup ./eod_batch.sh > logs/eod_$(date +%Y%m%d).log 2>&1 &

# Watch progress
tail -f logs/eod_*.log

# Check completion
grep "EOD Batch Job Completed" logs/eod_*.log
```

## Troubleshooting

### Script getting stuck?
- Check if process is running: `ps aux | grep analyze-symbols`
- Kill if needed: `pkill -f analyze-symbols.py`
- Restart: `./eod_batch.sh`

### Yahoo Finance rate limiting?
- It's rare, but if it happens:
- Add delay in script (edit `scripts/analyze-symbols.py`)
- Or run in smaller batches

### Firebase connection issues?
- Check `serviceAccountKey.json` exists
- Verify Firebase credentials are valid

## Files

### Active Files
- `eod_batch.sh` - Main batch script
- `scripts/analyze-symbols.py` - Analysis script (Yahoo Finance)
- `fundamentals_batch.sh` - Separate fundamentals analysis

### Experimental (Not Active)
- `scripts/experimental/` - DuckDB + NSE experimental code

### Documentation
- `README_EOD.md` - This file (quick reference)
- `REVERT_SUMMARY.md` - Why we use Yahoo Finance
- `NSE_DUCKDB_SETUP.md` - DuckDB documentation (experimental)

## Cron Job Setup

To run automatically every weekday at 6 PM:

```bash
crontab -e

# Add this line:
0 18 * * 1-5 cd /path/to/myportfolio-web && ./eod_batch.sh >> logs/eod.log 2>&1
```

## Status

✅ **Working** - Yahoo Finance version is stable and reliable
📊 **Processing** - 2,165 NSE symbols
⏱️ **Duration** - ~2-3 hours per run
📈 **Success Rate** - ~95%+

---

**Last Updated**: October 11, 2025
**Version**: Yahoo Finance (Stable)
