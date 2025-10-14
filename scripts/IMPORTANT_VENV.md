# ⚠️ IMPORTANT: Virtual Environment Usage

## 🚨 CRITICAL RULE

**NEVER RUN PYTHON SCRIPTS WITH SYSTEM `python3`**

All Python scripts MUST be run using the virtual environment Python interpreter.

## ❌ WRONG (Don't Do This)

```bash
# ❌ DON'T USE SYSTEM PYTHON
python3 scripts/fetch-eod-data.py
python scripts/screeners.py
python3 -c "import jugaad_data"

# ❌ DON'T ACTIVATE/DEACTIVATE MANUALLY IN BATCH SCRIPTS
source venv/bin/activate
python3 scripts/fetch-eod-data.py
deactivate
```

## ✅ CORRECT (Always Do This)

### Option 1: Use Explicit Venv Python Path (Recommended)
```bash
# ✅ ALWAYS USE VENV PYTHON EXPLICITLY
./venv/bin/python3 scripts/fetch-eod-data.py
./venv/bin/python3 scripts/screeners.py
./venv/bin/python3 -c "import jugaad_data; print('OK')"
```

### Option 2: Use Batch Script (Handles venv automatically)
```bash
# ✅ BATCH SCRIPT USES VENV AUTOMATICALLY
./scripts/daily-eod-batch.sh
```

## 📋 Why This Matters

### Problems with System Python:
1. ❌ **Missing dependencies** - System Python doesn't have jugaad-data, duckdb, etc.
2. ❌ **Version conflicts** - System packages may conflict with our requirements
3. ❌ **Permission issues** - System-wide installs require sudo
4. ❌ **Inconsistent environment** - Different machines have different packages

### Benefits of Venv Python:
1. ✅ **Isolated dependencies** - Only our required packages
2. ✅ **No conflicts** - Doesn't touch system Python
3. ✅ **Reproducible** - Same environment everywhere
4. ✅ **No sudo needed** - User-level installation

## 🔧 How `daily-eod-batch.sh` Works

The batch script uses **explicit venv path**, not `source activate`:

```bash
#!/bin/bash

# Check venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    exit 1
fi

# Use explicit venv Python (NOT system python3)
PYTHON="./venv/bin/python3"

# Run scripts with venv Python
$PYTHON scripts/fetch-eod-data.py
$PYTHON scripts/analyze-symbols.py
$PYTHON scripts/screeners.py
```

**Why explicit path instead of `source activate`?**
- ✅ More reliable (no shell environment issues)
- ✅ Works in cron jobs
- ✅ No need to deactivate
- ✅ Clear which Python is being used

## 📝 Examples

### Running Individual Scripts

**From project root:**
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web

# ✅ Correct
./venv/bin/python3 scripts/fetch-eod-data.py
./venv/bin/python3 scripts/screeners.py

# ❌ Wrong
python3 scripts/fetch-eod-data.py  # Uses system Python!
```

**From scripts directory:**
```bash
cd /Volumes/ssd-backup/git/SmartFarm/myportfolio-web/scripts

# ✅ Correct
../venv/bin/python3 fetch-eod-data.py
../venv/bin/python3 screeners.py

# ❌ Wrong
python3 fetch-eod-data.py  # Uses system Python!
```

### Testing Imports

```bash
# ✅ Test venv has dependencies
./venv/bin/python3 -c "import jugaad_data; import duckdb; print('All OK')"

# ❌ Testing system Python (will fail)
python3 -c "import jugaad_data"  # ModuleNotFoundError!
```

### Cron Jobs

```bash
# ✅ Correct - Batch script uses venv automatically
30 16 * * * cd /path/to/myportfolio-web/scripts && ./daily-eod-batch.sh >> /tmp/eod-batch.log 2>&1

# ✅ Also correct - Explicit venv path
30 16 * * * cd /path/to/myportfolio-web && ./venv/bin/python3 scripts/fetch-eod-data.py >> /tmp/eod-batch.log 2>&1

# ❌ Wrong - Uses system Python
30 16 * * * cd /path/to/myportfolio-web && python3 scripts/fetch-eod-data.py  # Will fail!
```

## 🔍 How to Verify

### Check which Python is being used:
```bash
# System Python (DON'T USE THIS)
which python3
# Output: /usr/bin/python3 or /usr/local/bin/python3

# Venv Python (USE THIS)
./venv/bin/python3 --version
# Output: Python 3.13.7

# Check venv has dependencies
./venv/bin/python3 -c "import jugaad_data, duckdb, pandas, ta, pytz, firebase_admin; print('✅ All dependencies OK')"
```

### In batch script, print Python path:
```bash
PYTHON="./venv/bin/python3"
echo "Using Python: $PYTHON"
$PYTHON --version
# Should show: Python 3.13.7
```

## 🐛 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'jugaad_data'"

**Cause**: You're using system Python instead of venv Python

**Fix**: Use explicit venv path
```bash
# ❌ What you did (wrong)
python3 scripts/fetch-eod-data.py

# ✅ What you should do (correct)
./venv/bin/python3 scripts/fetch-eod-data.py
```

### Error: "venv/bin/python3: No such file or directory"

**Cause**: Virtual environment not created

**Fix**: Run setup script
```bash
./scripts/setup-venv.sh
```

### Error: Script works manually but fails in cron

**Cause**: Cron uses system Python by default

**Fix**: Use absolute path in cron
```bash
# Use absolute path to venv Python
30 16 * * * /absolute/path/to/myportfolio-web/venv/bin/python3 /absolute/path/to/scripts/fetch-eod-data.py

# Or use batch script (handles paths automatically)
30 16 * * * cd /absolute/path/to/myportfolio-web/scripts && ./daily-eod-batch.sh
```

## 📊 Summary Table

| Scenario | Wrong ❌ | Correct ✅ |
|----------|---------|-----------|
| Run script | `python3 scripts/fetch-eod-data.py` | `./venv/bin/python3 scripts/fetch-eod-data.py` |
| Test import | `python3 -c "import jugaad_data"` | `./venv/bin/python3 -c "import jugaad_data"` |
| Batch script | `source venv/bin/activate; python3 ...` | `PYTHON="./venv/bin/python3"; $PYTHON ...` |
| Cron job | `python3 scripts/fetch-eod-data.py` | `./venv/bin/python3 scripts/fetch-eod-data.py` |

## 🎯 Key Takeaways

1. **NEVER** use system `python3` or `python`
2. **ALWAYS** use `./venv/bin/python3` explicitly
3. **Batch script** already handles this correctly
4. **Cron jobs** must use absolute paths or batch script
5. **Test** by verifying Python path and dependencies

## 📚 Related Documentation

- [QUICK_START.md](QUICK_START.md) - All examples use venv Python
- [HOW_TO_RUN.md](HOW_TO_RUN.md) - Detailed venv usage guide
- [daily-eod-batch.sh](daily-eod-batch.sh) - Batch script using venv

---

**Remember**: When in doubt, use the batch script `./scripts/daily-eod-batch.sh` - it handles everything correctly! 🎯
