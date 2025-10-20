# Firebase Cleanup Script

## Overview

The `cleanup-firebase.py` script automatically removes old data from Firebase collections to keep your database clean and reduce storage costs.

## What Gets Cleaned Up

### 1. Notifications (>5 days old)
- Collection: `notifications`
- Removes notifications older than 5 days
- Based on `createdAt` timestamp

### 2. Screener Data (>5 days old)
- Collections cleaned:
  - `macrossover50` - 50 MA crossovers
  - `macrossover200` - 200 MA crossovers
  - `advancedtrailstop` - Advanced Trailstop crossovers
  - `volumespike` - Volume spikes
  - `darvasboxes` - Darvas box patterns
  - `bbsqueeze` - BB Squeeze signals
- Removes records older than 5 days
- Based on `date` field (YYYY-MM-DD format)

### 3. Closed Ideas (>3 days old)
- Collection: `ideas`
- Removes closed ideas older than 3 days
- Closed statuses: `closed`, `target_hit`, `stop_loss_hit`, `manual_exit`
- Based on `exitDate` or `updatedAt` timestamp

## How to Run

### Manual Run

```bash
cd scripts
source ../venv/bin/activate
python3 cleanup-firebase.py
```

### Output Example

```
🧹 Firebase Cleanup Script
============================================================
Started at: 2025-01-20 10:30:00

📊 Current Firebase Statistics:
============================================================
  Notifications              1234 records
  50 MA Crossovers            567 records
  200 MA Crossovers           432 records
  Advanced Trailstop          345 records
  Volume Spikes               234 records
  Darvas Boxes                123 records
  BB Squeeze                  210 records
  Ideas                       890 records
============================================================

🔍 Cleaning up notifications older than 5 days...
✅ Deleted 456 old notifications

🔍 Cleaning up screener data older than 5 days...
  ✅ Deleted 234 records from macrossover50
  ✅ Deleted 178 records from macrossover200
  ✅ Deleted 145 records from advancedtrailstop
  ✅ Deleted 98 records from volumespike
  ✅ Deleted 56 records from darvasboxes
  ✅ Deleted 87 records from bbsqueeze
✅ Total screener records deleted: 798

🔍 Cleaning up closed ideas older than 3 days...
✅ Deleted 23 closed ideas

📈 Cleanup Summary:
============================================================
  Notifications deleted: 456
  Screener records deleted: 798
  Closed ideas deleted: 23
  Total records deleted: 1277
============================================================

✅ Cleanup completed at: 2025-01-20 10:30:45
```

## Automated Daily Cleanup

### Using Cron (Mac/Linux)

Add to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts && source ../venv/bin/activate && python3 cleanup-firebase.py >> ../logs/cleanup.log 2>&1
```

### Create logs directory

```bash
mkdir -p /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/logs
```

## Customizing Retention Periods

Edit the script to change retention periods:

```python
# Notifications - change from 5 to 7 days
cutoff_date = datetime.now() - timedelta(days=7)

# Screener data - change from 5 to 10 days
cutoff_date = (datetime.now() - timedelta(days=10)).strftime('%Y-%m-%d')

# Closed ideas - change from 3 to 7 days
cutoff_date = datetime.now() - timedelta(days=7)
```

## Safety Features

1. **Timestamp validation**: Only deletes records with valid timestamps
2. **Status check for ideas**: Only deletes truly closed ideas
3. **Error handling**: Continues cleaning other collections if one fails
4. **Statistics reporting**: Shows before/after counts

## Monitoring

Check the cleanup logs:

```bash
# View today's cleanup log
tail -f logs/cleanup.log

# View all cleanup history
cat logs/cleanup.log | grep "Cleanup Summary" -A 5
```

## Troubleshooting

### Script fails to delete

**Problem**: Firebase permission denied

**Solution**: Ensure your `serviceAccountKey.json` has proper permissions:
- `firestore.documents.delete` permission required
- Service account should be "Firebase Admin SDK"

### No records deleted

**Problem**: Dates might be in different formats

**Solution**: Check the date format in Firebase console:
- Notifications: Should have `createdAt` timestamp
- Screener data: Should have `date` field in YYYY-MM-DD format
- Ideas: Should have `exitDate` or `updatedAt` timestamp

### Script takes too long

**Problem**: Too many records to process

**Solution**:
1. Run cleanup more frequently (daily instead of weekly)
2. Reduce retention periods
3. Consider batch deletion (modify script to use batch writes)

## Best Practices

1. **Run daily**: Schedule cleanup to run every day at off-peak hours (2-4 AM)
2. **Monitor logs**: Check logs weekly to ensure cleanup is working
3. **Backup important data**: Before first run, export important ideas/notifications
4. **Test first**: Run manually and verify correct data is being deleted
5. **Adjust retention**: Based on your usage, adjust retention periods as needed

## Integration with Other Scripts

Add cleanup to your daily batch:

```bash
#!/bin/bash
# daily-eod-batch.sh

# Run EOD analysis
python3 analyze-symbols-duckdb.py

# Run screeners
python3 screeners.py

# Cleanup old data (NEW)
python3 cleanup-firebase.py

# Generate alerts
python3 check-and-generate-alerts.py
```

## Important Notes

⚠️ **WARNING**: Deleted data cannot be recovered. Test thoroughly before scheduling!

✅ **SAFE**: Script only deletes based on age and status, never deletes active data

📊 **STORAGE**: Regular cleanup can reduce Firebase storage costs by 50-70%

🔒 **SECURITY**: Ensure `serviceAccountKey.json` is never committed to git
