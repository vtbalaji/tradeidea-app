# Cron Job Setup for Daily EOD Batch Process

This guide will help you set up the daily EOD batch process to run automatically using cron.

## Prerequisites

1. Virtual environment set up (`./scripts/setup-venv.sh`)
2. `serviceAccountKey.json` in project root
3. DuckDB database initialized

## Cron Job Configuration

### Recommended Schedule

Run the batch process **after 4:15 PM IST** daily to ensure accurate EOD data:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 4:15 PM IST daily)
15 16 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1
```

### Alternative Schedules

```bash
# Run at 5:00 PM IST (safer - ensures all data is available)
0 17 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1

# Run at 6:00 PM IST (most conservative)
0 18 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1

# Run Monday-Friday only (skip weekends)
15 16 * * 1-5 /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1
```

## Setup Steps

### 1. Make Script Executable

```bash
chmod +x /path/to/myportfolio-web/scripts/daily-eod-batch.sh
```

### 2. Test the Script Manually

```bash
cd /path/to/myportfolio-web
./scripts/daily-eod-batch.sh
```

Check the logs:
```bash
ls -lh logs/
tail -f logs/eod-batch-*.log
```

### 3. Add to Crontab

```bash
# Open crontab editor
crontab -e

# Add the cron job (replace /path/to/myportfolio-web with actual path)
15 16 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1
```

### 4. Verify Crontab Entry

```bash
crontab -l
```

## Log Files

The script creates detailed logs in the `logs/` directory:

### Individual Job Logs
- **File Pattern**: `logs/eod-batch-YYYYMMDD_HHMMSS.log`
- **Contains**: Complete output of each batch run with timestamps
- **Retention**: Automatically cleaned up after 30 days

### Error Log
- **File**: `logs/eod-batch-error.log`
- **Contains**: All errors from all runs
- **Use**: Quick error diagnosis

### Cron Log
- **File**: `logs/cron.log`
- **Contains**: Cron execution output and overall status
- **Use**: Verify cron is running

## Monitoring

### Check if Cron is Running

```bash
# View cron log
tail -f logs/cron.log

# Check latest batch log
ls -t logs/eod-batch-*.log | head -1 | xargs tail -f

# Check for errors
tail -50 logs/eod-batch-error.log
```

### Log Output Example

```
[2025-10-14 16:15:00] 🚀 Starting Daily EOD Batch Process
[2025-10-14 16:15:00] ====================================
[2025-10-14 16:15:00] Project Root: /path/to/myportfolio-web
[2025-10-14 16:15:00] Log File: logs/eod-batch-20251014_161500.log
[2025-10-14 16:15:00]
[2025-10-14 16:15:00] 🐍 Using Python: ./venv/bin/python3
[2025-10-14 16:15:00] Python Version: Python 3.13.x
[2025-10-14 16:15:00]
[2025-10-14 16:15:00] 📥 Step 1/3: Fetching NSE EOD Data...
[2025-10-14 16:18:32] ✅ EOD fetch completed in 212s
[2025-10-14 16:18:32]
[2025-10-14 16:18:32] 📊 Step 2/3: Running Technical Analysis...
[2025-10-14 16:25:15] ✅ Technical analysis completed in 403s
[2025-10-14 16:25:15]
[2025-10-14 16:25:15] 🔍 Step 3/3: Running Screeners...
[2025-10-14 16:28:40] ✅ Screeners completed in 205s
[2025-10-14 16:28:40]
[2025-10-14 16:28:40] ✅ Daily EOD Batch Process Completed!
[2025-10-14 16:28:40] ====================================
[2025-10-14 16:28:40] 🧹 Cleaning up old log files...
[2025-10-14 16:28:40] Done cleaning up logs
```

## Troubleshooting

### Cron Not Running

1. **Check cron service**:
   ```bash
   # macOS
   sudo launchctl list | grep cron

   # Linux
   sudo systemctl status cron
   ```

2. **Check PATH issues**: Cron runs with limited PATH. The script uses absolute paths to avoid this.

3. **Check permissions**:
   ```bash
   ls -la /path/to/myportfolio-web/scripts/daily-eod-batch.sh
   # Should show: -rwxr-xr-x
   ```

### Script Fails

1. **Check error log**:
   ```bash
   tail -50 logs/eod-batch-error.log
   ```

2. **Run manually to debug**:
   ```bash
   cd /path/to/myportfolio-web
   ./scripts/daily-eod-batch.sh
   ```

3. **Check virtual environment**:
   ```bash
   ./venv/bin/python3 --version
   ./venv/bin/pip list | grep -E "duckdb|pandas|firebase"
   ```

4. **Check Firebase credentials**:
   ```bash
   ls -la serviceAccountKey.json
   ```

### No Data Fetched

- **NSE data may not be available yet**: Wait until after 4:30 PM IST
- **Weekend/Holiday**: NSE is closed on weekends and market holidays
- **Check DuckDB**:
  ```bash
  python3 -c "import duckdb; conn = duckdb.connect('data/eod.duckdb', read_only=True); print(conn.execute('SELECT COUNT(*) FROM ohlcv').fetchone())"
  ```

## Email Notifications (Optional)

To receive email notifications on failures, you can use:

```bash
# Install mailutils (Linux) or configure macOS mail
# Add MAILTO to crontab
MAILTO=your-email@example.com
15 16 * * * /path/to/myportfolio-web/scripts/daily-eod-batch.sh >> /path/to/myportfolio-web/logs/cron.log 2>&1 || echo "EOD Batch Failed: $(date)" | mail -s "EOD Batch Error" your-email@example.com
```

## Log Rotation

The script automatically:
- ✅ Creates timestamped log files for each run
- ✅ Keeps error logs in a separate file
- ✅ Cleans up logs older than 30 days

To manually clean up logs:
```bash
# Remove logs older than 7 days
find logs/ -name "eod-batch-*.log" -type f -mtime +7 -delete

# Remove all logs
rm logs/eod-batch-*.log
```

## Process Flow

```
Daily Cron Job (4:15 PM IST)
    ↓
1. Fetch NSE EOD Data (fetch-eod-data.py)
    - Fetches OHLCV data from NSE
    - Stores in DuckDB
    ↓
2. Run Technical Analysis (analyze-symbols-duckdb.py)
    - Reads from DuckDB
    - Calculates indicators (SMA, EMA, RSI, MACD, Supertrend)
    - Stores in Firebase
    ↓
3. Run Screeners (screeners.py)
    - Detects MA crossovers (50, 200)
    - Detects Supertrend crossovers
    - Detects volume spikes
    - Stores in Firebase
    ↓
4. Cleanup old logs
    ↓
✅ Complete (logs available in logs/ directory)
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `crontab -e` | Edit crontab |
| `crontab -l` | List cron jobs |
| `tail -f logs/cron.log` | Monitor cron execution |
| `tail -f logs/eod-batch-error.log` | Monitor errors |
| `ls -t logs/eod-batch-*.log \| head -1 \| xargs cat` | View latest log |
| `./scripts/daily-eod-batch.sh` | Run manually |

## Support

If you encounter issues:
1. Check logs in `logs/` directory
2. Run the script manually to see detailed output
3. Verify all prerequisites are met
4. Check cron service is running
