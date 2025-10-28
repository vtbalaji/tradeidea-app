# Portfolio Management Scripts

Scripts for managing user portfolios, trading ideas, stop-loss orders, and alerts.

## 📋 Scripts Overview

### 1. `manage-portfolio-stoploss.py`
**Purpose:** Manage stop-loss orders for portfolio holdings

**What it does:**
- Monitors portfolio holdings
- Tracks stop-loss levels
- Triggers alerts when stop-loss hit
- Updates Firebase with stop-loss status
- Supports trailing stop-loss

**Usage:**
```bash
# Check all portfolios for stop-loss triggers
python scripts/portfolio/manage-portfolio-stoploss.py

# Check specific user
python scripts/portfolio/manage-portfolio-stoploss.py --user-id USER123

# Update stop-loss levels
python scripts/portfolio/manage-portfolio-stoploss.py --update-stops
```

**Features:**
- **Fixed stop-loss:** User sets price (e.g., sell at ₹500)
- **Percentage stop-loss:** User sets % (e.g., -10% from buy price)
- **Trailing stop-loss:** Automatically adjusts upward with price

**Example alert:**
```
🚨 STOP-LOSS ALERT
Symbol: TCS
Current Price: ₹3,450
Stop-Loss: ₹3,500
Action: SELL
Reason: Price fell below stop-loss
```

---

### 2. `check-idea-triggers.py`
**Purpose:** Check if trading idea entry/exit conditions are met

**What it does:**
- Monitors trading ideas from `ideas` collection
- Checks technical triggers:
  - Price targets hit
  - RSI levels reached
  - Moving average crossovers
  - Support/resistance breakouts
- Sends notifications when triggers activated
- Updates idea status

**Usage:**
```bash
# Check all active ideas
python scripts/portfolio/check-idea-triggers.py

# Check ideas for specific user
python scripts/portfolio/check-idea-triggers.py --user-id USER123

# Check specific idea
python scripts/portfolio/check-idea-triggers.py --idea-id IDEA456
```

**Trigger Types:**
- **Price trigger:** "Buy TCS if price goes above ₹3,500"
- **Technical trigger:** "Buy when RSI < 30 (oversold)"
- **Pattern trigger:** "Buy on golden cross (50 SMA > 200 SMA)"

**Example notification:**
```
💡 IDEA TRIGGER ACTIVATED

Idea: TCS Long Position
Trigger: Price crossed above ₹3,500
Current Price: ₹3,520
Action: BUY
Time to execute your trade!
```

---

### 3. `expire-ideas.py`
**Purpose:** Mark expired trading ideas as inactive

**What it does:**
- Scans all trading ideas
- Checks expiry dates
- Marks expired ideas as inactive
- Sends notification to user
- Archives expired ideas

**Usage:**
```bash
# Check and expire old ideas
python scripts/portfolio/expire-ideas.py

# Dry run (preview only)
python scripts/portfolio/expire-ideas.py --dry-run

# Set custom expiry days
python scripts/portfolio/expire-ideas.py --expiry-days 30
```

**Expiry Rules:**
- Default: 90 days from creation
- User can set custom expiry
- Expired ideas moved to archive
- User notified before expiry (7 days warning)

**Example notification:**
```
⏰ IDEA EXPIRING SOON

Idea: INFY Swing Trade
Created: July 28, 2025
Expires: October 26, 2025 (7 days)
Status: Not triggered yet

Action: Renew or let it expire
```

---

### 4. `check-and-generate-alerts.py`
**Purpose:** Generate custom price and indicator alerts

**What it does:**
- Monitors price alerts set by users
- Checks custom indicator conditions
- Sends real-time notifications
- Supports multiple alert types:
  - Price alerts (above/below)
  - Percentage change alerts
  - Volume spike alerts
  - Technical indicator alerts

**Usage:**
```bash
# Check all alerts
python scripts/portfolio/check-and-generate-alerts.py

# Check for specific user
python scripts/portfolio/check-and-generate-alerts.py --user-id USER123

# Test alert system
python scripts/portfolio/check-and-generate-alerts.py --test
```

**Alert Types:**

1. **Price Alerts:**
   - "Notify when TCS > ₹3,500"
   - "Notify when TCS < ₹3,000"

2. **Change Alerts:**
   - "Notify when TCS moves ±5% in a day"
   - "Notify when TCS gains 10% from current price"

3. **Volume Alerts:**
   - "Notify when volume > 2x average"

4. **Technical Alerts:**
   - "Notify when RSI < 30 (oversold)"
   - "Notify when MACD crossover happens"

**Example alert:**
```
🔔 PRICE ALERT

Symbol: RELIANCE
Alert Type: Price above
Target: ₹2,500
Current: ₹2,520
Triggered: Oct 28, 2025 10:30 AM
```

---

## 🔄 Typical Workflow

### Daily Alert Check (Cron Job):
```bash
# Run multiple times during market hours
*/15 * * * * python scripts/portfolio/check-and-generate-alerts.py
*/15 * * * * python scripts/portfolio/check-idea-triggers.py
*/30 * * * * python scripts/portfolio/manage-portfolio-stoploss.py
```

### End of Day:
```bash
# Expire old ideas
python scripts/portfolio/expire-ideas.py
```

---

## 📊 Data Structure

### Portfolio Holdings (Firebase):
```json
{
  "portfolios": {
    "USER123": {
      "holdings": {
        "TCS": {
          "quantity": 10,
          "buyPrice": 3400,
          "currentPrice": 3520,
          "stopLoss": 3200,
          "stopLossType": "fixed",
          "alerts": ["stop-loss"]
        }
      }
    }
  }
}
```

### Trading Ideas (Firebase):
```json
{
  "ideas": {
    "IDEA456": {
      "symbol": "TCS",
      "type": "LONG",
      "entryPrice": 3500,
      "targetPrice": 3800,
      "stopLoss": 3300,
      "status": "active",
      "triggers": {
        "entry": "price > 3500",
        "exit": "price > 3800 || price < 3300"
      },
      "createdAt": "2025-07-28",
      "expiresAt": "2025-10-26"
    }
  }
}
```

### Alerts (Firebase):
```json
{
  "alerts": {
    "ALERT789": {
      "userId": "USER123",
      "symbol": "RELIANCE",
      "type": "price_above",
      "targetPrice": 2500,
      "status": "active",
      "triggered": false,
      "createdAt": "2025-10-20"
    }
  }
}
```

---

## 🔔 Notification Channels

Alerts sent via:
1. **Firebase Cloud Messaging (FCM)** - Push notifications
2. **Email** - For critical alerts
3. **In-app notifications** - Bell icon
4. **SMS** (optional, premium feature)

---

## ⚙️ Configuration

### Environment Variables:
```bash
# Firebase credentials
export GOOGLE_APPLICATION_CREDENTIALS="serviceAccountKey.json"

# Notification settings
export ENABLE_PUSH_NOTIFICATIONS=true
export ENABLE_EMAIL_ALERTS=true

# Market hours (for alert timing)
export MARKET_OPEN_HOUR=9
export MARKET_CLOSE_HOUR=15
```

### Alert Frequency:
```python
# In check-and-generate-alerts.py
CHECK_INTERVAL = 15  # minutes
MAX_ALERTS_PER_USER_PER_DAY = 50
```

---

## 🐛 Troubleshooting

**Alerts not triggering:**
- Verify Firebase credentials
- Check market hours (alerts paused outside trading)
- Validate alert conditions

**Stop-loss not working:**
- Ensure real-time price data is updating
- Check stop-loss levels in database
- Verify user has holdings

**Ideas not expiring:**
- Run `expire-ideas.py` manually
- Check cron job is scheduled
- Validate expiry date logic

---

## 📈 Best Practices

1. **Stop-Loss Management:**
   - Always set stop-loss when entering position
   - Use trailing stop-loss for trending stocks
   - Review stop-loss levels weekly

2. **Trading Ideas:**
   - Set realistic entry/exit triggers
   - Document reasoning for each idea
   - Review and update regularly

3. **Alert Hygiene:**
   - Delete triggered/expired alerts
   - Limit alerts per symbol (avoid spam)
   - Use % change alerts for volatile stocks

---

## 🔗 Related Folders

- `scripts/technical/` - Price data for alerts
- `scripts/fundamental/` - Fundamental data for ideas
- `scripts/batch/` - Schedule these scripts

---

**Last Updated:** October 28, 2025
