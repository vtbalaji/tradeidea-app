# Debug ISIN CSV Import

## Issue
CSV import with wrong symbol but correct ISIN failed to import.

## What I Added

### 1. **Enhanced ISIN Header Detection**
Added more ISIN header variations:
- `ISIN`
- `isin`
- `Isin`
- `ISIN Code`
- `isin code`
- `ISIN Number`
- `isin number`

### 2. **Debug Logging**
Added console logs to track:
- CSV headers found
- Field mapping
- Each row's data (symbol, ISIN, quantity, price)
- ISIN lookup attempts
- Symbol resolution

## How to Debug

### Step 1: Check Browser Console
When you upload the CSV, open browser DevTools (F12) and look for these logs:

```
📋 CSV Headers found: ['symbol', 'ISIN', 'quantity', 'entryPrice']
🔄 Field mapping: { symbol: 'symbol', ISIN: 'isin', ... }

📝 Row 1: { symbol: 'WRONGSYMBOL', isin: 'INE002A01018', quantity: '10', entryPrice: '2500' }
⚙️  Symbol 'WRONGSYMBOL' invalid, attempting ISIN fallback: INE002A01018
✅ Found symbol RELIANCE for ISIN INE002A01018
✅ Corrected symbol from 'WRONGSYMBOL' to 'RELIANCE' using ISIN INE002A01018
```

### Step 2: Test with Sample CSV

I created a test CSV file: `test-isin.csv`

**Contents:**
```csv
symbol,ISIN,quantity,entryPrice
WRONGSYMBOL,INE002A01018,10,2500
,INE467B01029,5,3500
RELIANCE,INE040A01034,3,1600
```

**Expected Results:**
- Row 1: WRONGSYMBOL → RELIANCE (via ISIN)
- Row 2: Empty → TCS (via ISIN)
- Row 3: RELIANCE stays RELIANCE

**To Test:**
1. Go to `/portfolio`
2. Click "Import Portfolio"
3. Upload `test-isin.csv`
4. Check browser console for debug logs
5. Verify import results

### Step 3: Check Your CSV Format

**Common Issues:**

1. **ISIN Column Not Detected**
   - Check header name matches one of: `ISIN`, `isin`, `ISIN Code`, etc.
   - No extra spaces in header
   - No special characters

2. **ISIN Value Format**
   - Must be 12 characters
   - Format: `INE002A01018` (2 letters + 10 alphanumeric)
   - No spaces or special chars

3. **Symbol Column**
   - Can be wrong or empty
   - ISIN will be used as fallback

### Step 4: Verify ISIN in Database

Check if your ISIN exists:

```bash
npm test -- -t "should find symbol by valid ISIN"
```

Or check hardcoded ISINs:
- INE002A01018 → RELIANCE ✅
- INE467B01029 → TCS ✅
- INE040A01034 → HDFCBANK ✅
- INE009A01021 → INFY ✅
- INE090A01021 → ICICIBANK ✅
- ... (15 total)

## What to Check

### Checklist

- [ ] CSV has ISIN column (check header name)
- [ ] ISIN values are 12 characters (e.g., INE002A01018)
- [ ] Check browser console for debug logs
- [ ] Look for "📋 CSV Headers found" log
- [ ] Look for "📝 Row X" logs showing ISIN
- [ ] Look for "⚙️ attempting ISIN fallback" logs
- [ ] Check if ISIN is in supported list (15 symbols)

### Expected Console Output

**Success Case:**
```
📋 CSV Headers found: ['symbol', 'ISIN', 'quantity', 'entryPrice']
🔄 Field mapping: {
  'symbol': 'symbol',
  'ISIN': 'isin',
  'quantity': 'quantity',
  'entryPrice': 'entryPrice'
}

📝 Row 1: {
  symbol: 'BADSYMBOL',
  isin: 'INE002A01018',
  quantity: '10',
  entryPrice: '2500'
}
⚙️  Symbol 'BADSYMBOL' invalid, attempting ISIN fallback: INE002A01018
✅ Found symbol RELIANCE for ISIN INE002A01018
✅ Corrected symbol from 'BADSYMBOL' to 'RELIANCE' using ISIN INE002A01018
```

**Failure Case (ISIN not mapped):**
```
📝 Row 1: { symbol: 'BADSYMBOL', isin: '(empty)', ... }
❌ Invalid or unknown NSE symbol: 'BADSYMBOL'. Please verify...
```

**Failure Case (ISIN header not detected):**
```
📋 CSV Headers found: ['symbol', 'ISINCode', 'quantity', ...]
🔄 Field mapping: { 'symbol': 'symbol', ... }
// Notice: 'ISINCode' not mapped because it's not in FIELD_MAPPINGS
```

## Troubleshooting

### Issue: ISIN column not detected

**Symptoms:**
- Debug log shows header but no `isin` in field mapping
- Row logs show `isin: '(empty)'` even though CSV has ISIN

**Solution:**
Add your ISIN header name to `FIELD_MAPPINGS` in `lib/csvImport.ts`:

```typescript
const FIELD_MAPPINGS = {
  // ...
  'Your ISIN Header Name': 'isin',
  // ...
}
```

### Issue: ISIN format invalid

**Symptoms:**
```
❌ Invalid ISIN format: INE002A0101
```

**Solution:**
- ISIN must be exactly 12 characters
- Format: 2 letters + 10 alphanumeric
- Example: INE002A01018 ✅
- Wrong: INE002A0101 (11 chars) ❌

### Issue: ISIN not in database

**Symptoms:**
```
❌ No symbol found for ISIN INE123456789
```

**Solution:**
1. Check if ISIN is for NSE stock
2. Add ISIN to `lib/symbolsData.ts`:
   ```typescript
   {
     symbol: 'NEWSYMBOL',
     isin: 'INE123456789',
     // ...
   }
   ```
3. Or add to Firestore:
   ```javascript
   await db.collection('symbols').doc('NEWSYMBOL').set({
     isin: 'INE123456789',
     // ...
   });
   ```

## Your CSV Format

**What's your CSV header?**

Please check and share:
1. First row of your CSV (headers)
2. One sample data row
3. What the ISIN column is named

**Example formats that work:**

```csv
symbol,ISIN,quantity,entryPrice
RELIANCE,INE002A01018,10,2500
```

```csv
Stock Symbol,isin,Qty,Average Cost Price
RELIANCE,INE002A01018,10,2500
```

```csv
Instrument,ISIN Code,Qty.,Avg. cost
RELIANCE,INE002A01018,10,2500
```

## Next Steps

1. **Upload test-isin.csv** and check console
2. **Share your CSV headers** (first row)
3. **Share console logs** from browser DevTools
4. **Share any error messages**

I'll help debug further based on what you see!

---

**Files Modified:**
- `lib/csvImport.ts` - Added debug logging + ISIN header variations
- `test-isin.csv` - Test file created
- `DEBUG_ISIN_IMPORT.md` - This guide
