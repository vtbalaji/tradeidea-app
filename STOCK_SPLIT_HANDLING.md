# Stock Split & Bonus Handling Strategy

## The Problem

When a stock undergoes a corporate action (split/bonus):
- **Price changes** - Stock price halves in a 1:2 split
- **Your data is out of sync**:
  - ✅ Historical EOD data from DuckDB/Yahoo is **already adjusted**
  - ❌ User's portfolio data (entry, stop-loss, target) is **NOT adjusted**
  - ❌ Moving averages calculated on adjusted data don't match old entry prices
  - ❌ Alerts fire incorrectly (false stop-loss/target hits)

### Example Scenario
```
User bought RELIANCE at ₹2,500 with SL ₹2,300
1:2 split happens → Price becomes ₹1,250

Current System:
- DuckDB shows adjusted historical prices (₹1,250)
- 200MA = ₹1,200 (calculated from adjusted data)
- User's entry = ₹2,500 (NOT adjusted) ❌
- User's stop-loss = ₹2,300 (NOT adjusted) ❌
- Alert: "Price ₹1,250 hit stop-loss ₹2,300" → WRONG!
```

## Solution: Multi-Layered Approach

### 1. **Detection System** (Automated)

Detect splits by comparing price changes to expected ranges:

```typescript
// lib/corporateActionDetector.ts
interface SplitDetection {
  symbol: string;
  detectedDate: string;
  oldPrice: number;
  newPrice: number;
  ratio: number; // e.g., 0.5 for 1:2 split
  confidence: 'high' | 'medium' | 'low';
}

function detectPotentialSplit(symbol: string, technical: TechnicalData): SplitDetection | null {
  const { lastPrice, previousClose, change, changePercent } = technical;

  // Detect abnormal price drops (likely splits)
  // A 40%+ drop overnight with matching volume patterns
  if (changePercent < -40 && changePercent > -60) {
    // Check if it's close to 50% (1:2 split)
    const ratio = lastPrice / previousClose;

    if (Math.abs(ratio - 0.5) < 0.05) {
      return {
        symbol,
        detectedDate: new Date().toISOString(),
        oldPrice: previousClose,
        newPrice: lastPrice,
        ratio: 0.5,
        confidence: 'high'
      };
    }

    // Check for 1:3, 1:5, 1:10 splits
    if (Math.abs(ratio - 0.33) < 0.03) return { /* 1:3 split */ };
    if (Math.abs(ratio - 0.2) < 0.02) return { /* 1:5 split */ };
    if (Math.abs(ratio - 0.1) < 0.01) return { /* 1:10 split */ };
  }

  // Detect bonus issues (price drops 10-30%)
  if (changePercent < -10 && changePercent > -35) {
    // 1:1 bonus = ~50% drop, 1:2 bonus = ~33% drop
    // Similar logic
  }

  return null;
}
```

### 2. **NSE Corporate Actions API** (Recommended)

Fetch official corporate action data from NSE:

```python
# scripts/fetch_corporate_actions.py
import requests
import firebase_admin
from datetime import datetime, timedelta

def fetch_nse_corporate_actions(symbol, days=30):
    """
    Fetch corporate actions from NSE official API
    https://www.nseindia.com/api/corporates-corporateActions?index=equities&symbol=RELIANCE
    """
    url = f"https://www.nseindia.com/api/corporates-corporateActions"
    params = {
        'index': 'equities',
        'symbol': symbol,
        'from_date': (datetime.now() - timedelta(days=days)).strftime('%d-%m-%Y'),
        'to_date': datetime.now().strftime('%d-%m-%Y')
    }

    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
    }

    response = requests.get(url, params=params, headers=headers)
    actions = response.json()

    # Filter for splits and bonuses
    splits = []
    for action in actions:
        if 'Split' in action.get('subject', ''):
            # Parse "Stock Split From Rs 10/- Per Share To Rs 5/- Per Share"
            splits.append({
                'symbol': symbol,
                'type': 'split',
                'exDate': action['exDate'],
                'ratio': parse_split_ratio(action['subject']),
                'purpose': action['subject']
            })
        elif 'Bonus' in action.get('subject', ''):
            splits.append({
                'symbol': symbol,
                'type': 'bonus',
                'exDate': action['exDate'],
                'ratio': parse_bonus_ratio(action['subject']),
                'purpose': action['subject']
            })

    return splits

def parse_split_ratio(text):
    """Parse '10/- to 5/-' → 0.5"""
    # Extract numbers and calculate ratio
    pass

def save_to_firestore(actions):
    """Save to corporateActions collection"""
    db = firestore.client()
    for action in actions:
        symbol_with_prefix = f"NS_{action['symbol']}"
        db.collection('corporateActions').document(f"{symbol_with_prefix}_{action['exDate']}").set({
            **action,
            'processed': False,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
```

### 3. **Adjustment Script** (Run after detection)

```python
# scripts/adjust_portfolio_for_splits.py

def adjust_positions_for_split(symbol, split_ratio, ex_date):
    """
    Adjust all user positions for a stock split
    split_ratio: 0.5 for 1:2, 0.33 for 1:3, etc.
    """
    db = firestore.client()

    # Find all open positions for this symbol
    positions_ref = db.collection('portfolios')
    query = positions_ref.where('symbol', '==', symbol).where('status', '==', 'open')
    positions = query.stream()

    for pos_doc in positions:
        pos_data = pos_doc.to_dict()
        position_id = pos_doc.id

        # Calculate adjusted values
        old_entry = pos_data.get('entryPrice', 0)
        old_stop_loss = pos_data.get('stopLoss', 0)
        old_target1 = pos_data.get('target1', 0)
        old_quantity = pos_data.get('quantity', 0)

        new_entry = old_entry * split_ratio
        new_stop_loss = old_stop_loss * split_ratio
        new_target1 = old_target1 * split_ratio
        new_quantity = int(old_quantity / split_ratio)  # Quantity increases!

        # Adjust all transactions
        transactions = pos_data.get('transactions', [])
        adjusted_transactions = []
        for txn in transactions:
            adjusted_transactions.append({
                **txn,
                'price': txn['price'] * split_ratio,
                'quantity': int(txn['quantity'] / split_ratio),
                'totalValue': txn['totalValue']  # Total value remains same
            })

        # Update position with adjustment note
        update_data = {
            'entryPrice': new_entry,
            'stopLoss': new_stop_loss,
            'target1': new_target1,
            'quantity': new_quantity,
            'transactions': adjusted_transactions,
            'splitAdjustment': {
                'date': ex_date,
                'ratio': split_ratio,
                'oldEntry': old_entry,
                'newEntry': new_entry,
                'applied': firestore.SERVER_TIMESTAMP
            },
            'updatedAt': firestore.SERVER_TIMESTAMP
        }

        positions_ref.document(position_id).update(update_data)
        print(f"✅ Adjusted position {position_id} for {symbol}: Entry {old_entry} → {new_entry}")

    # Also adjust trading ideas
    ideas_ref = db.collection('tradingIdeas')
    ideas_query = ideas_ref.where('symbol', '==', symbol).where('status', '==', 'cooking')
    ideas = ideas_query.stream()

    for idea_doc in ideas:
        idea_data = idea_doc.to_dict()
        ideas_ref.document(idea_doc.id).update({
            'entryPrice': idea_data['entryPrice'] * split_ratio,
            'stopLoss': idea_data['stopLoss'] * split_ratio,
            'target1': idea_data['target1'] * split_ratio,
            'splitAdjustment': {
                'date': ex_date,
                'ratio': split_ratio,
                'applied': firestore.SERVER_TIMESTAMP
            }
        })

    # Mark corporate action as processed
    db.collection('corporateActions').document(f"NS_{symbol}_{ex_date}").update({
        'processed': True,
        'processedAt': firestore.SERVER_TIMESTAMP
    })

# Run for detected splits
unprocessed = db.collection('corporateActions').where('processed', '==', False).stream()
for action in unprocessed:
    data = action.to_dict()
    adjust_positions_for_split(data['symbol'], data['ratio'], data['exDate'])
```

### 4. **User Notification System**

```typescript
// When split is detected, notify users
async function notifyUsersOfSplit(symbol: string, splitInfo: SplitDetection) {
  // Find all users with positions in this symbol
  const positions = await db.collection('portfolios')
    .where('symbol', '==', symbol)
    .where('status', '==', 'open')
    .get();

  const userIds = new Set<string>();
  positions.forEach(doc => userIds.add(doc.data().userId));

  // Create notifications
  for (const userId of userIds) {
    await db.collection('notifications').add({
      userId,
      type: 'corporate_action',
      message: `${symbol} underwent a ${1/splitInfo.ratio}:1 split. Your entry/targets have been automatically adjusted.`,
      splitInfo,
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp()
    });
  }
}
```

### 5. **UI Indicators**

Show split adjustments in the UI:

```tsx
// components/portfolio/PositionCard.tsx
{position.splitAdjustment && (
  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
    <p className="text-xs text-blue-700 dark:text-blue-300">
      📊 Adjusted for {1/position.splitAdjustment.ratio}:1 split on {position.splitAdjustment.date}
      <br/>
      Original Entry: ₹{position.splitAdjustment.oldEntry} → New Entry: ₹{position.splitAdjustment.newEntry}
    </p>
  </div>
)}
```

## Implementation Plan

### Phase 1: Detection (Week 1)
1. ✅ Add detection logic to `analyze-symbols-duckdb.py`
2. ✅ Create `corporateActions` collection in Firestore
3. ✅ Log potential splits for manual review

### Phase 2: Manual Adjustment (Week 2)
1. ✅ Create admin script `adjust_portfolio_for_splits.py`
2. ✅ Test on historical split (e.g., RELIANCE split from 2024)
3. ✅ Run manually when splits are detected

### Phase 3: NSE API Integration (Week 3-4)
1. ✅ Implement NSE corporate actions fetcher
2. ✅ Daily cron job to check for new corporate actions
3. ✅ Auto-trigger adjustment script

### Phase 4: Full Automation (Week 5-6)
1. ✅ Automated detection + adjustment pipeline
2. ✅ User notifications
3. ✅ UI indicators
4. ✅ Admin dashboard for review

## Testing Strategy

```python
# Test with known historical splits
test_cases = [
    {'symbol': 'RELIANCE', 'date': '2024-10-28', 'ratio': 0.5},  # 1:2 split
    {'symbol': 'TCS', 'date': '2022-09-16', 'ratio': 0.5},
    {'symbol': 'WIPRO', 'date': '2019-07-18', 'ratio': 0.33},  # 1:3 split
]

for test in test_cases:
    print(f"Testing {test['symbol']} split adjustment...")
    # Verify old positions are correctly adjusted
    # Verify moving averages work correctly after adjustment
```

## Firestore Schema

```typescript
// Collection: corporateActions
interface CorporateAction {
  symbol: string;
  type: 'split' | 'bonus' | 'dividend';
  exDate: string;  // Ex-date (when adjustment takes effect)
  ratio: number;  // 0.5 for 1:2 split
  purpose: string;  // Full description from NSE
  detected: boolean;  // Auto-detected or from API
  processed: boolean;  // Adjustment script run?
  processedAt?: Timestamp;
  createdAt: Timestamp;
}

// Updated: portfolios collection
interface PortfolioPosition {
  // ... existing fields
  splitAdjustment?: {
    date: string;
    ratio: number;
    oldEntry: number;
    newEntry: number;
    applied: Timestamp;
  };
}
```

## Alternative: Hybrid Approach (Recommended for Start)

**Start with manual process, automate gradually:**

1. **Week 1-2**: Manual detection + adjustment
   - Run detection script daily
   - Review splits manually
   - Run adjustment script when confirmed

2. **Week 3-4**: Semi-automated
   - NSE API integration
   - Auto-detect + manual confirm
   - One-click adjustment

3. **Month 2+**: Full automation
   - Auto-adjust with user notification
   - Admin review dashboard
   - Rollback capability

This approach lets you validate accuracy before going fully automated!
