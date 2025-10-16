# Portfolio Stop-Loss Management

Automated stop-loss management system using **Strategy 3: Breakeven + Technical Trail**.

## Strategy Overview

The system manages stop-loss in three phases based on profit in R multiples (where R = initial risk):

### Phase 1: Capital Protection (0 - 1.5R)
- **Stop-Loss**: User's original SL
- **Purpose**: Protect initial capital
- **Example**: Entry ₹100, User SL ₹95 → SL stays at ₹95

### Phase 2: Breakeven Lock (1.5R - 2R)
- **Stop-Loss**: max(Entry Price, Technical SL)
- **Purpose**: Lock in breakeven, eliminate risk
- **Example**: Price reaches ₹107.50 → SL moves to ₹100 (entry) or higher technical level

### Phase 3: Profit Protection (2R+)
- **Stop-Loss**: Technical SL (ratchets up only, never down)
- **Purpose**: Let winners run while protecting profits
- **Example**: Price at ₹110+ → SL trails using 100MA or Supertrend

## Technical Stop-Loss Selection

The system uses the **higher** of two technical levels (both must be above entry price):
- **100-day Moving Average (SMA100)**
- **Daily Supertrend** (only if bullish direction = 1)

This ensures conservative stop placement that respects market structure.

## Usage

### Run the Batch Job

After running the EOD technical analysis, run stop-loss management:

```bash
# Run technical analysis first
npm run analyze

# Then run stop-loss management
npm run manage-sl
```

### Direct Python Execution

```bash
source venv/bin/activate
python3 scripts/manage-portfolio-stoploss.py
```

## What It Does

1. **Fetches** all open portfolio positions from Firebase
2. **Gets** current price from the symbols collection (updated by analyze-symbols.py)
3. **Calculates** profit in R multiples for each position
4. **Determines** which phase the position should be in
5. **Updates** the `stopLossManagement` field in Firebase if phase transition occurs
6. **Creates** notifications for users when their positions change phase
7. **Logs** detailed summary of all changes

## Data Structure

Each position gets a `stopLossManagement` object in Firebase:

```javascript
{
  userStopLoss: 95,              // Original user SL (never changes)
  effectiveStopLoss: 100,        // Current active SL (changes with phase)
  initialRisk: 5,                // Entry - User SL
  phase: 'breakeven',            // 'protection' | 'breakeven' | 'trailing'

  breakevenCrossedAt: Timestamp, // When 1.5R was reached
  profitLockTriggeredAt: Timestamp, // When 2R was reached

  slHistory: [
    {
      timestamp: Timestamp,
      fromSL: 95,
      toSL: 100,
      fromPhase: 'protection',
      toPhase: 'breakeven',
      reason: 'Breakeven crossed (1.5R) - locked at entry ₹100.00',
      priceAtChange: 107.50,
      profitInR: 1.5,
      technicalSL: 102,
      technicalSLSource: '100MA'
    }
  ]
}
```

## Example Workflow

**Day 1: Position Opened**
- Entry: ₹100, User SL: ₹95
- Phase: `protection`
- Effective SL: ₹95

**Day 5: Price reaches ₹107.50 (+1.5R)**
- Phase transition: `protection` → `breakeven`
- Effective SL: ₹100 (entry price)
- Notification sent: "Breakeven crossed - risk eliminated"

**Day 10: Price reaches ₹110 (+2R)**
- Phase transition: `breakeven` → `trailing`
- 100MA is at ₹103
- Effective SL: ₹103
- Notification sent: "Profit protection active - trailing with 100MA"

**Day 15: Price at ₹115, 100MA at ₹108**
- Phase: `trailing` (no change)
- SL ratchets up: ₹103 → ₹108
- No notification (same phase)

**Day 20: Price pullback to ₹112, 100MA at ₹107**
- Phase: `trailing` (no change)
- SL stays: ₹108 (never goes down)
- No notification

## Integration with UI

The UI automatically displays the effective stop-loss from `stopLossManagement`:

```typescript
// lib/exitCriteriaAnalysis.ts reads stopLossManagement
const effectiveStopLoss = position.stopLossManagement?.effectiveStopLoss || position.stopLoss;
const phase = position.stopLossManagement?.phase || 'protection';
```

Alert messages show the current phase:
- `✅ SL Safe: ₹100.00 (Breakeven)`
- `⚠️ Near SL: ₹103.00 (Technical Trail)`
- `🚨 STOP LOSS HIT at ₹108.00 (Technical Trail)`

## Scheduling

### Recommended: EOD After Technical Analysis

Add to your cron job or scheduler:

```bash
# Run at 4:30 PM IST after market close
30 16 * * 1-5 cd /path/to/project && npm run analyze && npm run manage-sl
```

### Alternative: Standalone Schedule

```bash
# Run at 5 PM IST (after technical analysis completes)
0 17 * * 1-5 cd /path/to/project && npm run manage-sl
```

## Notifications

Users receive notifications when:
- Position transitions from `protection` → `breakeven`
- Position transitions from `breakeven` → `trailing`

Users do NOT receive notifications for:
- SL ratcheting up within the `trailing` phase (avoids spam)
- Initialization of existing positions

## Error Handling

The script handles:
- Missing technical data (skips position)
- Invalid risk calculations (uses user SL only)
- Missing price data (skips position)
- Firebase connection errors (logs and continues)

## Monitoring

Check the script output for:
- ✅ **Updated**: Positions with SL changes
- 🆕 **Initialized**: Positions getting SL management for first time
- 🔄 **Phase Changes**: Positions transitioning between phases
- ❌ **Errors**: Positions that couldn't be processed

## Future Enhancements

Potential improvements:
- [ ] Support for short positions (inverse logic)
- [ ] Configurable R multiples per position
- [ ] Different strategies (conservative vs aggressive)
- [ ] Manual override capability
- [ ] Weekly Supertrend option for swing trades
- [ ] Partial profit booking at phase transitions
