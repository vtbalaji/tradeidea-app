# Stock Split Detection - Change Proposal

## 🎯 Goal
Add automated detection of stock splits/bonuses to your existing `analyze-symbols-duckdb.py` script.

---

## 📋 What Will Change

### **File to Modify:**
- `scripts/analyze-symbols-duckdb.py` (ONE file only)

### **Changes:**

#### **1. Add New Function: `detect_corporate_action()` (NEW - Lines ~400-450)**

```python
def detect_corporate_action(df, symbol):
    """
    Detect potential stock splits or bonus issues based on price movements
    Returns: dict with detection info or None
    """
    if len(df) < 2:
        return None

    last_price = float(df['Close'].iloc[-1])
    previous_close = float(df['Close'].iloc[-2])
    change_percent = ((last_price - previous_close) / previous_close) * 100

    # DETECTION THRESHOLDS
    # Split detection: price drop of 40-60% (typical of 1:2 split)
    if -60 < change_percent < -40:
        ratio = last_price / previous_close

        # Check common split ratios
        split_types = [
            (0.5, '1:2 split', 0.05),    # 50% price = 1:2 split (±5% tolerance)
            (0.33, '1:3 split', 0.03),   # 33% price = 1:3 split (±3% tolerance)
            (0.25, '1:4 split', 0.02),   # 25% price = 1:4 split (±2% tolerance)
            (0.2, '1:5 split', 0.02),    # 20% price = 1:5 split (±2% tolerance)
            (0.1, '1:10 split', 0.01),   # 10% price = 1:10 split (±1% tolerance)
        ]

        for target_ratio, split_type, tolerance in split_types:
            if abs(ratio - target_ratio) < tolerance:
                return {
                    'symbol': symbol,
                    'type': 'split',
                    'detectedDate': df.index[-1].strftime('%Y-%m-%d'),
                    'priceChange': change_percent,
                    'oldPrice': previous_close,
                    'newPrice': last_price,
                    'ratio': ratio,
                    'splitType': split_type,
                    'confidence': 'high'
                }

    # Bonus issue detection: price drop of 10-35% (common for bonus issues)
    elif -35 < change_percent < -10:
        ratio = last_price / previous_close

        bonus_types = [
            (0.67, '1:2 bonus', 0.03),   # 33% drop = 1:2 bonus (1 free for 2 held)
            (0.5, '1:1 bonus', 0.05),    # 50% drop = 1:1 bonus (1 free for 1 held)
            (0.75, '1:3 bonus', 0.03),   # 25% drop = 1:3 bonus
        ]

        for target_ratio, bonus_type, tolerance in bonus_types:
            if abs(ratio - target_ratio) < tolerance:
                return {
                    'symbol': symbol,
                    'type': 'bonus',
                    'detectedDate': df.index[-1].strftime('%Y-%m-%d'),
                    'priceChange': change_percent,
                    'oldPrice': previous_close,
                    'newPrice': last_price,
                    'ratio': ratio,
                    'bonusType': bonus_type,
                    'confidence': 'medium'
                }

    return None
```

**Location**: Insert AFTER `calculate_bb_position_history()` function (around line 400)

---

#### **2. Add New Function: `log_corporate_action()` (NEW - Lines ~450-480)**

```python
def log_corporate_action(action_data):
    """
    Log detected corporate action to Firestore for manual review
    Saves to: corporateActions collection
    """
    try:
        # Create document ID from symbol and date
        doc_id = f"{action_data['symbol']}_{action_data['detectedDate']}"

        # Check if already logged
        action_ref = db.collection('corporateActions').document(doc_id)
        existing = action_ref.get()

        if existing.exists:
            # Already logged, skip
            return

        # Log new corporate action
        action_ref.set({
            **action_data,
            'processed': False,  # Flag for manual processing
            'createdAt': firestore.SERVER_TIMESTAMP,
            'needsReview': True
        })

        print(f'  🚨 CORPORATE ACTION DETECTED!')
        print(f'     Type: {action_data.get("splitType") or action_data.get("bonusType")}')
        print(f'     Price: ₹{action_data["oldPrice"]:.2f} → ₹{action_data["newPrice"]:.2f} ({action_data["priceChange"]:+.1f}%)')
        print(f'     Logged to Firestore for review')

    except Exception as e:
        print(f'  ⚠️  Failed to log corporate action: {str(e)}')
```

**Location**: Insert AFTER `detect_corporate_action()` function (around line 450)

---

#### **3. Modify `analyze_symbols()` Function (EXISTING - Around Line 510-548)**

**Current code** (lines ~527-548):
```python
                # Calculate indicators
                print(f'  📈 Calculating indicators...')
                analysis = calculate_indicators(df)

                # Save to Firestore
                print(f'  💾 Saving to Firestore...')
                save_to_firestore(symbol, analysis)

                # Display summary
                print(f'  ✅ {symbol} - {analysis["overallSignal"]}')
                print(f'     Price: ₹{analysis["lastPrice"]:.2f} ({analysis["changePercent"]:+.2f}%)')
                # ... rest of display
```

**New code** (ADD 4 LINES after `calculate_indicators()`):
```python
                # Calculate indicators
                print(f'  📈 Calculating indicators...')
                analysis = calculate_indicators(df)

                # 🆕 CHECK FOR CORPORATE ACTIONS (NEW - 4 LINES)
                corporate_action = detect_corporate_action(df, symbol)
                if corporate_action:
                    log_corporate_action(corporate_action)

                # Save to Firestore
                print(f'  💾 Saving to Firestore...')
                save_to_firestore(symbol, analysis)
                # ... rest unchanged
```

**Location**: Modify lines 527-529 in `analyze_symbols()` function

---

## 📊 Firestore Changes

### **New Collection: `corporateActions`**

Schema:
```typescript
{
  symbol: string;              // "RELIANCE"
  type: "split" | "bonus";     // Action type
  detectedDate: string;         // "2024-10-15"
  priceChange: number;          // -49.8
  oldPrice: number;             // 2500.00
  newPrice: number;             // 1255.00
  ratio: number;                // 0.502
  splitType?: string;           // "1:2 split"
  bonusType?: string;           // "1:1 bonus"
  confidence: string;           // "high" | "medium" | "low"
  processed: boolean;           // false (needs manual review)
  needsReview: boolean;         // true
  createdAt: Timestamp;
}
```

**This collection will only be created when splits are detected. No impact on existing collections.**

---

## 🔍 How It Works

### Detection Flow:

```
Daily EOD Batch Run
  └─> For each symbol:
       1. Fetch historical data from DuckDB
       2. Calculate indicators (existing)
       3. 🆕 Check for corporate action:
          - Compare today's price vs yesterday's
          - If drop is 40-60% → Check for split patterns
          - If drop is 10-35% → Check for bonus patterns
       4. 🆕 If detected → Log to Firestore
       5. Save technical analysis (existing)
       6. Continue to next symbol
```

### Detection Logic:

**1:2 Stock Split Example:**
- Yesterday: ₹2,500
- Today: ₹1,250
- Change: -50%
- Ratio: 0.5
- **Detection**: Matches 1:2 split pattern (50% ± 5% tolerance)
- **Action**: Log to `corporateActions` collection
- **Console Output**:
  ```
  🚨 CORPORATE ACTION DETECTED!
     Type: 1:2 split
     Price: ₹2500.00 → ₹1250.00 (-50.0%)
     Logged to Firestore for review
  ```

---

## ✅ What Changes

| Item | Current | After Change |
|------|---------|--------------|
| **Scripts modified** | 0 | 1 (`analyze-symbols-duckdb.py`) |
| **New functions** | 0 | 2 (`detect_corporate_action`, `log_corporate_action`) |
| **Lines added** | 0 | ~90 lines |
| **Existing functions modified** | 0 | 1 (`analyze_symbols` - 4 lines added) |
| **New Firestore collections** | 0 | 1 (`corporateActions` - auto-created when split detected) |
| **Impact on existing data** | NONE | No impact - only adds new detection |
| **Impact on users** | NONE | No impact - detection runs silently |

---

## ❌ What Does NOT Change

- ✅ Existing technical analysis logic - **UNCHANGED**
- ✅ Existing Firestore collections (`symbols`, `portfolios`, `tradingIdeas`) - **UNCHANGED**
- ✅ User portfolio data - **UNCHANGED** (detection only, no adjustment yet)
- ✅ DuckDB data fetching - **UNCHANGED**
- ✅ Moving average calculations - **UNCHANGED**
- ✅ Alert system - **UNCHANGED**
- ✅ Frontend/UI - **UNCHANGED** (no UI changes in this phase)

---

## 🧪 Testing Plan

### Phase 1: Detection Only (This PR)
1. Run script on symbols with known historical splits
2. Verify detections are logged correctly
3. Review `corporateActions` collection
4. **No adjustments made** - just logging for review

### Test Symbols (Known Splits):
- RELIANCE: 1:1 bonus (2024-10-28)
- TCS: 1:1 bonus (2022-09-16)
- WIPRO: 1:3 split (2019-07-18)

**Testing command:**
```bash
python3 scripts/test-single-symbol.py RELIANCE
```

---

## 📈 Next Steps (NOT in this PR)

**Phase 2**: Manual adjustment script
- Create `adjust-for-split.py`
- Run manually when split confirmed
- Adjust user portfolios

**Phase 3**: NSE API integration
- Fetch official corporate actions
- Auto-confirm detected splits

**Phase 4**: Full automation
- Auto-adjust + notify users
- Admin dashboard

---

## 🚦 Approval Needed

Please review and approve:

1. ✅ **Add 2 new functions** to `analyze-symbols-duckdb.py`
2. ✅ **Modify 1 existing function** (add 4 lines)
3. ✅ **Create new Firestore collection** `corporateActions` (auto-created)
4. ✅ **No changes to user data** (detection only, no adjustments)

**Total impact**: ~90 lines added, 0 lines removed, 1 file changed

---

## 🔴 Rollback Plan

If issues occur:
1. Comment out the 4 new lines in `analyze_symbols()` function
2. Script continues working as before
3. Delete `corporateActions` collection if needed

**Zero risk to existing functionality** ✅

---

## 📝 Summary

**What you get:**
- Automated detection of splits/bonuses during daily batch run
- Logged to Firestore for your review
- Console alerts when detected
- No impact on existing data or users

**What you need to approve:**
- Adding detection logic to existing script
- Creating new Firestore collection for logs
- No user-facing changes in this phase

**Ready to proceed?**
Say "Yes" and I'll implement exactly as described above!
