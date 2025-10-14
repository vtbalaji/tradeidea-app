# Smart Date Logic for EOD Data Fetching

## Overview
Implemented intelligent date logic for fetching End-of-Day (EOD) data from NSE that accounts for market hours and weekends.

## Rules

### Time-Based Logic (IST - Indian Standard Time)
- **Before 4:00 PM**: Fetch yesterday's data (current day's data not available yet)
- **After 4:00 PM**: Fetch today's data (EOD data should be published)

### Weekend Logic
- **Saturday**: Fetch Friday's data
- **Sunday**: Fetch Friday's data
- **Monday before 4 PM**: Fetch Friday's data (since yesterday was Sunday)

## Files Updated

### 1. `scripts/experimental/fetch_nse_data.py`
Added new method `get_last_trading_day()` to NSEDataFetcher class:
```python
def get_last_trading_day(self):
    """
    Get the last trading day based on current time and day of week

    Rules:
    - If time < 16:00 (4 PM IST): fetch yesterday's data
    - If time >= 16:00: fetch today's data
    - If Saturday: fetch Friday's data
    - If Sunday: fetch Friday's data

    Returns:
        date: Last trading day
    """
```

Updated `fetch_and_store()` to use smart date logic:
```python
if to_date is None:
    to_date = self.get_last_trading_day()  # Instead of date.today()
```

### 2. `scripts/screeners.py`
Updated `get_last_trading_day()` function with same smart logic:
```python
def get_last_trading_day():
    """
    Get the last trading day based on current time and day of week

    Returns:
        str: Last trading day in YYYY-MM-DD format
    """
```

## Test Results

### Current Behavior (Tuesday 7:02 AM IST)
```
Current IST time: 2025-10-14 Tuesday 07:02 AM
Target trading day: 2025-10-13 (Monday)
Logic: Before 4 PM - using yesterday
```

### Test Scenarios Verified
✅ Monday 10 AM → Friday (yesterday was Sunday, adjusted to Friday)
✅ Monday 5 PM → Monday (after 4 PM, using today)
✅ Friday 3 PM → Thursday (before 4 PM, using yesterday)
✅ Friday 4:30 PM → Friday (after 4 PM, using today)
✅ Saturday 10 AM → Friday
✅ Saturday 5 PM → Friday
✅ Sunday 10 AM → Friday
✅ Sunday 5 PM → Friday

## Dependencies
- `pytz` library for timezone handling (Asia/Kolkata for IST)

## Benefits
1. **Avoids API errors**: Won't try to fetch today's data before it's published
2. **Weekend handling**: Automatically fetches last Friday's data on weekends
3. **Market hours aware**: Uses 4 PM as cutoff when EOD data is typically available
4. **Automatic**: No manual intervention needed for daily batch jobs

## Usage

### For EOD Data Fetcher
```python
from fetch_nse_data import NSEDataFetcher

fetcher = NSEDataFetcher()
# Automatically uses smart date logic
fetcher.fetch_and_store('RELIANCE')
```

### For Screeners
```python
from screeners import get_last_trading_day

# Get the appropriate trading day
trading_day = get_last_trading_day()  # Returns YYYY-MM-DD string
```

## Cron Job Recommendation
Run the daily EOD batch job **after 4:30 PM IST** to ensure data is available:
```bash
# Run at 4:30 PM IST daily
30 16 * * * cd /path/to/scripts && ./daily-eod-batch.sh
```

## Testing
Run the test script to verify date logic:
```bash
cd scripts/experimental
python3 test_date_logic.py
```
