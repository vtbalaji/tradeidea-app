# Portfolio Import - Symbol Resolution Fix

## Problem
CSV imports were failing for stocks with company names instead of trading symbols:
- ❌ "BHARAT ELECTRONICS LTD" (ISIN: INE263A01024)
- ❌ "GE POWER INDIA LIMITED" (ISIN: INE878A01011)
- ❌ "HINDALCO  INDUSTRIES  LTD" (ISIN: INE038A01020) - extra spaces

## Solution Implemented

### 1. Company Name Mapping (Immediate Fix) ✅
Added direct mapping for common company names to NSE symbols:

```typescript
const COMPANY_NAME_TO_SYMBOL = {
  'BHARAT ELECTRONICS LTD': 'BEL',
  'GE POWER INDIA LIMITED': 'GEPIL',
  'HINDALCO INDUSTRIES LTD': 'HINDALCO',
  // + 40 more common stocks
};
```

**This fix works immediately** without any database changes!

### 2. ISIN Lookup (Optional Enhancement)

For better coverage, you can add ISIN numbers to your Firestore symbols:

#### Option A: Fetch from NSE (Recommended - Gets ALL ISINs)
```bash
# Fetches ISIN for ALL NSE stocks from official NSE archives
npx tsx scripts/fetch-isin-from-nse.ts
```

This downloads the official NSE equity master file and updates ALL your symbols with ISINs!

#### Option B: Add Manual Mappings (Quick Fix for Common Stocks)
```bash
# Adds ISINs for 20+ common stocks only
npx tsx scripts/add-isin-to-symbols.ts
```

This adds ISIN mappings for:
- BEL (INE263A01024)
- GEPIL (INE878A01011)
- HINDALCO (INE038A01020)
- Plus 20+ more top stocks (Reliance, TCS, HDFC, etc.)

## How Symbol Resolution Works

The import process tries multiple methods in order:

### Step 1: Exact Symbol Match
```
"RELIANCE" → ✅ Recognized NSE symbol
```

### Step 2: Company Name Mapping (NEW!)
```
"BHARAT ELECTRONICS LTD" → ✅ Maps to "BEL"
"HINDALCO  INDUSTRIES  LTD" → ✅ Maps to "HINDALCO" (extra spaces handled)
```

### Step 3: ISIN Lookup
```
Symbol: "???"
ISIN: INE263A01024 → ✅ Looks up "BEL" in Firestore
```

### Step 4: ICICI Symbol Mapping
```
"HDFBAN" → ✅ Maps to "HDFCBANK"
```

## CSV Format Requirements

Your CSV must have these columns (in any order):

### Required Columns:
- **Symbol** OR **Instrument** OR **Stock Name**
- **Quantity** OR **Qty** OR **Qty.**
- **Entry Price** OR **Avg. cost** OR **Average Cost Price**

### Optional Columns:
- **ISIN** OR **ISIN Code** - For fallback lookup
- **Date** OR **Date Taken**
- **Target** OR **Target1**
- **Stop Loss** OR **SL**
- **Trade Type** - "Long" or "Short"

### Example CSV Formats:

#### Format 1: With Trading Symbols
```csv
Symbol,Quantity,Entry Price,ISIN
BEL,100,150.50,INE263A01024
HINDALCO,50,625.75,INE038A01020
RELIANCE,25,2450.00,INE002A01018
```

#### Format 2: With Company Names (NEW - Now Supported!)
```csv
Stock Name,Qty,Avg. cost,ISIN
BHARAT ELECTRONICS LTD,100,150.50,INE263A01024
HINDALCO  INDUSTRIES  LTD,50,625.75,INE038A01020
RELIANCE INDUSTRIES LIMITED,25,2450.00,INE002A01018
```

#### Format 3: ICICI Direct Format
```csv
Instrument,Qty.,Avg. cost
HDFBAN,100,1650.50
TATCHE,50,1050.25
```

## Supported Company Name Variations

All these variations work:

```
✅ BHARAT ELECTRONICS
✅ BHARAT ELECTRONICS LTD
✅ BHARAT ELECTRONICS LIMITED
✅ bharat electronics ltd (case-insensitive)
✅ BHARAT  ELECTRONICS  LTD (extra spaces handled)

✅ GE POWER INDIA
✅ GE POWER INDIA LIMITED
✅ GE POWER INDIA LTD

✅ HINDALCO INDUSTRIES
✅ HINDALCO INDUSTRIES LTD
✅ HINDALCO INDUSTRIES LIMITED
✅ HINDALCO  INDUSTRIES  LTD (extra spaces)
```

See full list in `lib/csvImport.ts` → `COMPANY_NAME_TO_SYMBOL`

## Testing Your CSV

### Before Importing:
1. Open your CSV file
2. Check the "Symbol" or "Stock Name" column
3. Verify formatting:
   - ✅ "BHARAT ELECTRONICS LTD"
   - ❌ "Bharat Elect. Ltd" (abbreviated - won't match)
   - ✅ "HINDALCO INDUSTRIES LTD"
   - ❌ "Hindalco Inds" (abbreviated - won't match)

### If Symbol Not Recognized:

**Option 1: Use Trading Symbol**
```csv
Symbol,Quantity,Entry Price
BEL,100,150.50
GEPIL,50,45.25
HINDALCO,75,625.75
```

**Option 2: Use Exact Company Name**
```csv
Stock Name,Quantity,Entry Price
BHARAT ELECTRONICS LTD,100,150.50
GE POWER INDIA LIMITED,50,45.25
HINDALCO INDUSTRIES LTD,75,625.75
```

**Option 3: Add ISIN Column**
```csv
Symbol,Quantity,Entry Price,ISIN
BHARAT ELECTRONICS,100,150.50,INE263A01024
GE POWER INDIA,50,45.25,INE878A01011
HINDALCO INDUSTRIES,75,625.75,INE038A01020
```

## Common Import Errors

### Error: "Invalid or unknown NSE symbol"

**Cause:** Symbol name doesn't match any known format

**Solutions:**
1. Use exact trading symbol: `BEL` instead of `Bharat Electronics`
2. Use full company name: `BHARAT ELECTRONICS LTD`
3. Add ISIN column with ISIN number
4. Run the ISIN script: `npm run tsx scripts/add-isin-to-symbols.ts`

### Error: "ISIN lookup also failed"

**Cause:** ISIN not in Firestore database

**Solution:** Run the ISIN script to add common ISINs:
```bash
npm run tsx scripts/add-isin-to-symbols.ts
```

## Adding More Company Name Mappings

If you have a stock not in the mapping, add it to `lib/csvImport.ts`:

```typescript
const COMPANY_NAME_TO_SYMBOL: { [key: string]: string } = {
  // ... existing mappings ...

  'YOUR COMPANY NAME LTD': 'SYMBOL',
  'YOUR COMPANY NAME LIMITED': 'SYMBOL',
  'YOUR COMPANY NAME': 'SYMBOL',
};
```

## Summary

✅ **Fix 1: Company Name Mapping** (Active Now)
- No database changes needed
- Works for 40+ common stocks
- Handles extra spaces automatically

✅ **Fix 2: ISIN Lookup** (Optional Enhancement)
- Run: `npm run tsx scripts/add-isin-to-symbols.ts`
- Adds ISINs for 20+ top stocks
- Better fallback for unknown symbols

✅ **Fix 3: Better Error Messages**
- Shows which resolution method failed
- Suggests exact company name format

Your portfolio imports should now work! 🎉
