# How to Run EOD Data Fetching & Screeners

## Prerequisites

### 1. Virtual Environment Setup (Recommended)
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web

# Option A: Automated setup (recommended)
./scripts/setup-venv.sh

# Option B: Manual setup
python3 -m venv venv
source venv/bin/activate
pip install jugaad-data duckdb pandas ta pytz firebase-admin
deactivate
```

**IMPORTANT**: All Python scripts MUST use the virtual environment. NEVER use system `python3` directly.

The `daily-eod-batch.sh` script uses `./venv/bin/python3` explicitly to ensure venv is always used.

### 2. Firebase Service Account Key
Ensure `serviceAccountKey.json` is in the project root:
```bash
ls serviceAccountKey.json  # Should exist
```

## Manual Execution

### Option 1: Fetch EOD Data Only
Fetch End-of-Day data for specific symbols:

```bash
cd scripts/experimental

# Test with a few symbols
python3 fetch_nse_data.py
```

This will:
- Fetch 2 years of historical data for: RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK
- Store data in `data/eod.duckdb`
- Use smart date logic (before 4 PM = yesterday, after 4 PM = today)

### Option 2: Fetch Data for All Symbols
If you have a list of symbols to fetch:

```python
# Create a custom script or modify fetch_nse_data.py
from fetch_nse_data import NSEDataFetcher

fetcher = NSEDataFetcher()

symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'SBIN']

for symbol in symbols:
    print(f'Fetching {symbol}...')
    fetcher.fetch_and_store(symbol)

fetcher.close()
```

### Option 3: Run Screeners (MA & Supertrend Crossovers)
Run the screener to find crossover signals and save to Firebase:

```bash
cd scripts

# Run screeners
python3 screeners.py
```

This will:
1. Read symbols from DuckDB
2. Calculate crossovers:
   - 50 MA crossovers
   - 200 MA crossovers
   - Supertrend crossovers
   - Volume spikes
3. Save results to Firebase collections:
   - `macrossover50`
   - `macrossover200`
   - `supertrendcrossover`
   - `volumespike`

### Option 4: Complete Daily Batch (Recommended)
Run the complete EOD workflow using the batch script:

```bash
cd scripts

# Make executable
chmod +x daily-eod-batch.sh

# Run the batch
./daily-eod-batch.sh
```

This will:
1. Fetch EOD data from NSE
2. Run all screeners
3. Update Firebase with results

## Automated Execution (Cron Jobs)

### Setup Daily Cron Job
Run the EOD batch automatically every day after market close:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 4:30 PM IST daily)
30 16 * * * cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1

# Or run at 5:00 PM to be safe
0 17 * * * cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1
```

### Verify Cron Job
```bash
# List active cron jobs
crontab -l

# Check logs
tail -f /tmp/eod-batch.log
```

## Manual Testing

### Test Date Logic
```bash
cd scripts/experimental
python3 test_date_logic.py
```

### Test Single Symbol Fetch
```bash
cd scripts/experimental
python3 -c "
from fetch_nse_data import NSEDataFetcher

fetcher = NSEDataFetcher()
success = fetcher.fetch_and_store('RELIANCE')

if success:
    print('✅ Success!')
    data = fetcher.get_data('RELIANCE', days=5)
    print(data)

fetcher.close()
"
```

### Test Screener for One Symbol
```bash
cd scripts
python3 -c "
import sys
sys.path.insert(0, 'experimental')
from fetch_nse_data import NSEDataFetcher
from screeners import detect_ma_crossover

nse_fetcher = NSEDataFetcher()
result = detect_ma_crossover('RELIANCE', ma_period=50)

if result and result['type'] != 'no_cross':
    print(f'✅ Crossover detected: {result}')
else:
    print('⚠️  No crossover')

nse_fetcher.close()
"
```

## Check Results

### View DuckDB Data
```bash
cd scripts/experimental
python3 -c "
from fetch_nse_data import NSEDataFetcher

fetcher = NSEDataFetcher()
stats = fetcher.get_stats()

print('📊 Database Statistics:')
print(f'  Total Rows: {stats[\"total_rows\"]:,}')
print(f'  Total Symbols: {stats[\"total_symbols\"]}')
print(f'  Date Range: {stats[\"min_date\"]} to {stats[\"max_date\"]}')

fetcher.close()
"
```

### Check Firebase Collections
Use Firebase Console or:
```bash
# Check if data was saved
cd scripts
python3 -c "
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('../serviceAccountKey.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

# Count documents in each collection
collections = ['macrossover50', 'macrossover200', 'supertrendcrossover', 'volumespike']

for col in collections:
    docs = db.collection(col).limit(10).stream()
    count = sum(1 for _ in docs)
    print(f'{col}: {count}+ documents')
"
```

## Troubleshooting

### Issue: "serviceAccountKey.json not found"
**Solution**: Ensure Firebase service account key is in project root:
```bash
cp /path/to/serviceAccountKey.json /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/
```

### Issue: "No data available for symbol"
**Possible causes**:
1. Running before 4 PM IST (today's data not published yet)
2. Market holiday
3. Symbol delisted or suspended

**Solution**: Check date logic output:
```bash
cd scripts/experimental
python3 test_date_logic.py
```

### Issue: "Column names mismatch"
**Solution**: The smart date logic should handle this. If it still fails, check if:
- Running for today's date before 4 PM
- Network issues preventing data fetch

### Issue: DuckDB database locked
**Solution**: Close any other processes using the database:
```bash
# Find processes
lsof data/eod.duckdb

# Or delete and recreate
rm data/eod.duckdb
```

## Best Practices

1. **Run after 4:30 PM IST**: Ensures EOD data is available
2. **Check logs**: Monitor `/tmp/eod-batch.log` for errors
3. **Incremental updates**: The system automatically fetches only missing dates
4. **Backup DuckDB**: Periodically backup `data/eod.duckdb`

```bash
# Backup DuckDB
cp data/eod.duckdb data/eod.duckdb.backup
```

## Quick Commands Reference

```bash
# Fetch EOD data (test)
cd scripts/experimental && python3 fetch_nse_data.py

# Run screeners
cd scripts && python3 screeners.py

# Run complete batch
cd scripts && ./daily-eod-batch.sh

# Test date logic
cd scripts/experimental && python3 test_date_logic.py

# View logs
tail -f /tmp/eod-batch.log

# Setup cron
crontab -e
# Add: 30 16 * * * cd /path/to/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1
```

## Next Steps

After successfully running:
1. ✅ EOD data is stored in `data/eod.duckdb`
2. ✅ Crossover signals are in Firebase collections
3. ✅ Web app can display screener results
4. ✅ Users can convert screeners to trading ideas

Check the web app at:
- Screeners: http://localhost:3000/cross50200
- Ideas: http://localhost:3000/ideas
