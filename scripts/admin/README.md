# Admin Scripts - Setup & Utilities

Administrative scripts for setup, deployment, and database management.

## 📋 Scripts Overview

### 1. `setup-venv.sh`
**Purpose:** Set up Python virtual environment

**What it does:**
- Creates Python virtual environment (`venv/`)
- Installs all required packages from `requirements.txt`
- Configures environment for development

**When to run:** First time setup or after cloning repository

**Usage:**
```bash
./scripts/admin/setup-venv.sh
```

---

### 2. `deploy.sh`
**Purpose:** Deploy application to production

**What it does:**
- Runs build process
- Deploys to hosting platform (Vercel/etc.)
- Updates environment variables
- Runs post-deployment checks

**When to run:** After testing, ready to deploy

**Usage:**
```bash
./scripts/admin/deploy.sh
```

---

### 3. `view-duckdb.sh`
**Purpose:** Interactive DuckDB database viewer

**What it does:**
- Opens DuckDB CLI with database loaded
- Allows SQL queries on EOD/fundamentals data
- Useful for debugging and data inspection

**When to run:** When you need to inspect database

**Usage:**
```bash
# View EOD database
./scripts/admin/view-duckdb.sh data/eod.duckdb

# View fundamentals database
./scripts/admin/view-duckdb.sh data/fundamentals.duckdb
```

**Common queries:**
```sql
-- List all tables
.tables

-- Check symbol count
SELECT COUNT(DISTINCT symbol) FROM xbrl_data;

-- View recent data
SELECT * FROM xbrl_data ORDER BY end_date DESC LIMIT 10;
```

---

### 4. `grantPremium.js`
**Purpose:** Grant premium access to user

**Usage:**
```bash
node scripts/admin/grantPremium.js user@example.com
```

---

### 5. `listPremiumUsers.js`
**Purpose:** List all premium users

**Usage:**
```bash
node scripts/admin/listPremiumUsers.js
```

---

### 6. `revokePremium.js`
**Purpose:** Revoke premium access

**Usage:**
```bash
node scripts/admin/revokePremium.js user@example.com
```

---

## 🚀 Quick Start

### First Time Setup:
```bash
# 1. Set up virtual environment
./scripts/admin/setup-venv.sh

# 2. Activate virtual environment
source venv/bin/activate

# 3. Verify installation
python --version
pip list
```

### Inspect Database:
```bash
# Open database viewer
./scripts/admin/view-duckdb.sh data/fundamentals.duckdb

# Run queries
SELECT symbol, fy, quarter, eps, pe_ratio
FROM xbrl_data
WHERE symbol = 'TCS'
ORDER BY end_date DESC
LIMIT 5;
```

---

## 🔧 Maintenance

### Update Dependencies:
```bash
# Activate venv
source venv/bin/activate

# Update requirements
pip install --upgrade -r requirements.txt
```

### Database Backup:
```bash
# Backup databases before major changes
cp data/eod.duckdb data/eod.duckdb.backup
cp data/fundamentals.duckdb data/fundamentals.duckdb.backup
```

---

**Last Updated:** October 28, 2025
