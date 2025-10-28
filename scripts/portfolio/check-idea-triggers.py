#!/usr/bin/env python3
"""
Trading Ideas Trigger Detection Batch Job

Checks ACTIVE trading ideas for entry/exit conditions and sends notifications:
1. ACTIVE ideas: Check if entry price is within day's high/low range → Auto-trigger
2. TRIGGERED ideas: Check if target or stop-loss is hit → Auto-update status

Runs as part of daily EOD batch process.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import sys
import os
import duckdb

# Initialize Firebase
cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
if not os.path.exists(cred_path):
    print('❌ serviceAccountKey.json not found')
    sys.exit(1)

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
except ValueError:
    # Already initialized
    pass

db = firestore.client()

# Connect to DuckDB for OHLC data
db_path = os.path.join(os.getcwd(), 'data', 'eod.duckdb')
duckdb_conn = duckdb.connect(db_path, read_only=True)

def get_today_ohlc(symbol, max_days_back=7):
    """
    Fetch recent OHLC data from DuckDB
    Tries today first, then goes back up to max_days_back days
    """
    try:
        today = datetime.now().date()

        # Try each day going backwards
        for days_back in range(max_days_back):
            check_date = today - timedelta(days=days_back)

            # Query DuckDB for this date
            query = """
                SELECT open, high, low, close, ltp, date
                FROM ohlcv
                WHERE symbol = ? AND date = ?
                ORDER BY date DESC
                LIMIT 1
            """
            result = duckdb_conn.execute(query, [symbol, check_date]).fetchone()

            if result:
                ohlc_date = result[5]
                # If not today's data, log it
                if days_back > 0:
                    print(f'  ℹ️  {symbol}: Using data from {ohlc_date} ({days_back} day(s) ago)')

                return {
                    'open': result[0],
                    'high': result[1],
                    'low': result[2],
                    'close': result[3],
                    'ltp': result[4] or result[3],  # Use close if ltp is null
                    'date': ohlc_date
                }

        # If no data found within max_days_back, try to get the most recent data
        query = """
            SELECT open, high, low, close, ltp, date
            FROM ohlcv
            WHERE symbol = ?
            ORDER BY date DESC
            LIMIT 1
        """
        result = duckdb_conn.execute(query, [symbol]).fetchone()

        if result:
            ohlc_date = result[5]
            days_diff = (today - ohlc_date).days
            print(f'  ⚠️  {symbol}: Using old data from {ohlc_date} ({days_diff} days old)')

            return {
                'open': result[0],
                'high': result[1],
                'low': result[2],
                'close': result[3],
                'ltp': result[4] or result[3],
                'date': ohlc_date
            }

        return None
    except Exception as e:
        print(f'  ⚠️  Error fetching OHLC for {symbol}: {str(e)}')
        return None

def get_symbol_data(symbol):
    """Fetch symbol technical data from symbols collection"""
    # Add NS_ prefix if not present
    symbol_with_prefix = f'NS_{symbol}' if not symbol.startswith('NS_') else symbol

    try:
        doc = db.collection('symbols').document(symbol_with_prefix).get()
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f'  ⚠️  Error fetching {symbol}: {str(e)}')
        return None

def has_recent_alert(idea_id, alert_type, hours=24):
    """Check if alert was sent recently to avoid spam"""
    try:
        cutoff = datetime.now() - timedelta(hours=hours)

        query = db.collection('notifications')\
            .where('ideaId', '==', idea_id)\
            .where('type', '==', alert_type)\
            .order_by('createdAt', direction=firestore.Query.DESCENDING)\
            .limit(1)

        docs = list(query.stream())
        if docs:
            last_alert = docs[0].to_dict()
            created_at = last_alert.get('createdAt')
            if created_at and hasattr(created_at, 'toDate'):
                created_at = created_at.toDate()
                if created_at > cutoff:
                    return True
        return False
    except Exception:
        # If query fails (maybe index doesn't exist), just proceed
        return False

def create_notification(notification_data):
    """Create a notification in Firestore"""
    try:
        db.collection('notifications').add(notification_data)
        return True
    except Exception as e:
        print(f'  ⚠️  Error creating notification: {str(e)}')
        return False

def update_idea_status(idea_id, new_status):
    """Update idea status in Firestore"""
    try:
        db.collection('tradingIdeas').document(idea_id).update({
            'status': new_status,
            'updatedAt': firestore.SERVER_TIMESTAMP
        })
        return True
    except Exception as e:
        print(f'  ⚠️  Error updating idea status: {str(e)}')
        return False

def check_entry_triggered(entry_price, day_low, day_high, trade_type='Long'):
    """
    Check if entry price was triggered during the day
    Entry is triggered if it falls within day's low/high range
    """
    if not entry_price or not day_low or not day_high:
        return False

    # Entry triggered if entry price is within day's range
    return day_low <= entry_price <= day_high

def check_entry_alert(symbol, entry_price, current_price, trade_type='Long'):
    """Check if idea entry price is near current price (within 2%)"""
    if not current_price or not entry_price:
        return None

    # For Long trades: alert if current price is near or below entry
    # For Short trades: alert if current price is near or above entry
    if trade_type == 'Long':
        # Alert if price is within 2% below entry or at entry
        if current_price <= entry_price * 1.02 and current_price >= entry_price * 0.95:
            variance = abs((current_price - entry_price) / entry_price) * 100
            return {
                'type': 'entry_alert',
                'message': f'{symbol} near entry price! Current: ₹{current_price:.2f}, Entry: ₹{entry_price:.2f} ({variance:.1f}% diff)',
                'currentPrice': current_price,
                'entryPrice': entry_price
            }
    else:  # Short
        # Alert if price is within 2% above entry or at entry
        if current_price >= entry_price * 0.98 and current_price <= entry_price * 1.05:
            variance = abs((current_price - entry_price) / entry_price) * 100
            return {
                'type': 'entry_alert',
                'message': f'{symbol} near entry price! Current: ₹{current_price:.2f}, Entry: ₹{entry_price:.2f} ({variance:.1f}% diff)',
                'currentPrice': current_price,
                'entryPrice': entry_price
            }

    return None

def check_exit_triggered_during_day(day_low, day_high, targets, stop_loss, trade_type='Long'):
    """
    Check if target or stop-loss was hit during the day
    Returns the new status and alert details
    """
    if not day_low or not day_high:
        return None

    # Check stop-loss first (higher priority)
    if stop_loss:
        if trade_type == 'Long' and day_low <= stop_loss:
            # For Long: SL hit if day's low touched or went below SL
            return {
                'new_status': 'STOP_LOSS',
                'type': 'stoploss_alert',
                'exitReason': 'STOP_LOSS_HIT'
            }
        elif trade_type == 'Short' and day_high >= stop_loss:
            # For Short: SL hit if day's high touched or went above SL
            return {
                'new_status': 'STOP_LOSS',
                'type': 'stoploss_alert',
                'exitReason': 'STOP_LOSS_HIT'
            }

    # Check targets
    for i, target in enumerate(targets, 1):
        if not target:
            continue

        if trade_type == 'Long' and day_high >= target:
            # For Long: Target hit if day's high touched or exceeded target
            return {
                'new_status': 'PROFIT_BOOKED',
                'type': 'target_alert',
                'targetNumber': i,
                'exitReason': f'TARGET_{i}_HIT'
            }
        elif trade_type == 'Short' and day_low <= target:
            # For Short: Target hit if day's low touched or went below target
            return {
                'new_status': 'PROFIT_BOOKED',
                'type': 'target_alert',
                'targetNumber': i,
                'exitReason': f'TARGET_{i}_HIT'
            }

    return None

def check_exit_alert(symbol, current_price, targets, stop_loss, trade_type='Long'):
    """Check if TRIGGERED idea hit target or stop-loss"""
    if not current_price:
        return None

    # Check targets
    for i, target in enumerate(targets, 1):
        if not target:
            continue

        if trade_type == 'Long' and current_price >= target:
            gain = ((current_price - target) / target) * 100
            return {
                'type': 'target_alert',
                'message': f'🎯 {symbol} hit Target {i}! Current: ₹{current_price:.2f}, Target: ₹{target:.2f}',
                'currentPrice': current_price,
                'targetPrice': target,
                'targetNumber': i,
                'exitReason': f'TARGET_{i}_HIT'
            }
        elif trade_type == 'Short' and current_price <= target:
            gain = ((target - current_price) / target) * 100
            return {
                'type': 'target_alert',
                'message': f'🎯 {symbol} hit Target {i}! Current: ₹{current_price:.2f}, Target: ₹{target:.2f}',
                'currentPrice': current_price,
                'targetPrice': target,
                'targetNumber': i,
                'exitReason': f'TARGET_{i}_HIT'
            }

    # Check stop-loss
    if stop_loss:
        if trade_type == 'Long' and current_price <= stop_loss:
            loss = ((stop_loss - current_price) / stop_loss) * 100
            return {
                'type': 'stoploss_alert',
                'message': f'🛑 {symbol} hit Stop Loss! Current: ₹{current_price:.2f}, SL: ₹{stop_loss:.2f}',
                'currentPrice': current_price,
                'stopLossPrice': stop_loss,
                'exitReason': 'STOP_LOSS_HIT'
            }
        elif trade_type == 'Short' and current_price >= stop_loss:
            loss = ((current_price - stop_loss) / stop_loss) * 100
            return {
                'type': 'stoploss_alert',
                'message': f'🛑 {symbol} hit Stop Loss! Current: ₹{current_price:.2f}, SL: ₹{stop_loss:.2f}',
                'currentPrice': current_price,
                'stopLossPrice': stop_loss,
                'exitReason': 'STOP_LOSS_HIT'
            }

    return None

def check_active_ideas():
    """Check ACTIVE ideas for entry price triggers"""
    print('🔍 Checking ACTIVE ideas for entry price triggers...')
    print('-' * 70)

    # Check both 'active' (current) and 'ACTIVE' (future) status
    ideas_ref = db.collection('tradingIdeas')
    active_ideas = []

    # Fetch current 'active' status ideas
    query1 = ideas_ref.where('status', '==', 'active')
    active_ideas.extend(list(query1.stream()))

    # Fetch future 'ACTIVE' status ideas (when migration happens)
    try:
        query2 = ideas_ref.where('status', '==', 'ACTIVE')
        active_ideas.extend(list(query2.stream()))
    except Exception:
        pass  # Query might fail if no such documents exist

    print(f'Found {len(active_ideas)} ACTIVE ideas\n')

    if not active_ideas:
        return 0

    alert_count = 0

    # Group by symbol to batch fetch symbol data
    symbol_ideas = {}
    for doc in active_ideas:
        idea = doc.to_dict()
        idea['id'] = doc.id
        symbol = idea.get('symbol')
        if symbol:
            if symbol not in symbol_ideas:
                symbol_ideas[symbol] = []
            symbol_ideas[symbol].append(idea)

    for symbol, ideas in symbol_ideas.items():
        try:
            # Get today's OHLC data from DuckDB
            ohlc = get_today_ohlc(symbol)
            if not ohlc:
                print(f'  ⚠️  {symbol}: No OHLC data for today')
                continue

            day_low = ohlc['low']
            day_high = ohlc['high']
            current_price = ohlc['ltp']

            if not day_low or not day_high or not current_price:
                print(f'  ⚠️  {symbol}: Incomplete OHLC data')
                continue

            # Check each idea for this symbol
            for idea in ideas:
                idea_id = idea['id']
                entry_price = idea.get('entryPrice')
                trade_type = idea.get('tradeType', 'Long')

                if not entry_price:
                    continue

                # Check if entry was triggered during the day
                entry_triggered = check_entry_triggered(entry_price, day_low, day_high, trade_type)

                if entry_triggered:
                    title = idea.get('title', 'Untitled')
                    print(f'  ✅ {symbol}: Entry TRIGGERED!')
                    print(f'     Entry: ₹{entry_price:.2f}, Day Range: ₹{day_low:.2f} - ₹{day_high:.2f}')
                    print(f'     Idea: {title}')

                    # Update status to TRIGGERED
                    if update_idea_status(idea_id, 'TRIGGERED'):
                        print(f'     🔄 Status updated: active → TRIGGERED')

                    # Check if we should send alert (not already sent today)
                    if has_recent_alert(idea_id, 'entry_triggered_alert', hours=24):
                        print(f'     ⏭️  Alert already sent today, skipping notification')
                        continue

                    alert_message = f'{symbol} entry triggered! Entry: ₹{entry_price:.2f}, Day Range: ₹{day_low:.2f} - ₹{day_high:.2f}'

                    # Notify idea owner
                    create_notification({
                        'userId': idea['userId'],
                        'type': 'entry_triggered_alert',
                        'fromUserId': 'system',
                        'fromUserName': 'TradeIdea Bot',
                        'ideaId': idea_id,
                        'ideaSymbol': symbol,
                        'message': alert_message,
                        'read': False,
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })
                    print(f'     📬 Notified owner: {idea.get("userName", "Unknown")}')

                    # Notify followers
                    followers = idea.get('followers', [])
                    follower_count = 0
                    for follower_id in followers:
                        if follower_id != idea['userId']:  # Don't double-notify owner
                            create_notification({
                                'userId': follower_id,
                                'type': 'entry_triggered_alert',
                                'fromUserId': idea['userId'],
                                'fromUserName': idea.get('userName', 'A trader'),
                                'ideaId': idea_id,
                                'ideaSymbol': symbol,
                                'message': f"{idea.get('userName', 'A trader')}'s idea: {alert_message}",
                                'read': False,
                                'createdAt': firestore.SERVER_TIMESTAMP
                            })
                            follower_count += 1

                    if follower_count > 0:
                        print(f'     📬 Notified {follower_count} follower(s)')

                    alert_count += 1

        except Exception as e:
            print(f'  ❌ Error checking {symbol}: {str(e)}')
            continue

    return alert_count

def check_triggered_ideas():
    """Check TRIGGERED ideas for exit conditions (target/stop-loss)"""
    print('\n🔍 Checking TRIGGERED ideas for exit conditions...')
    print('-' * 70)

    # Check for 'TRIGGERED' status (future implementation)
    ideas_ref = db.collection('tradingIdeas')

    try:
        query = ideas_ref.where('status', '==', 'TRIGGERED')
        triggered_ideas = list(query.stream())
    except Exception:
        # Status doesn't exist yet
        print('No TRIGGERED ideas found (status not yet implemented)\n')
        return 0

    print(f'Found {len(triggered_ideas)} TRIGGERED ideas\n')

    if not triggered_ideas:
        return 0

    alert_count = 0

    # Group by symbol
    symbol_ideas = {}
    for doc in triggered_ideas:
        idea = doc.to_dict()
        idea['id'] = doc.id
        symbol = idea.get('symbol')
        if symbol:
            if symbol not in symbol_ideas:
                symbol_ideas[symbol] = []
            symbol_ideas[symbol].append(idea)

    for symbol, ideas in symbol_ideas.items():
        try:
            # Get today's OHLC data from DuckDB
            ohlc = get_today_ohlc(symbol)
            if not ohlc:
                print(f'  ⚠️  {symbol}: No OHLC data for today')
                continue

            day_low = ohlc['low']
            day_high = ohlc['high']
            current_price = ohlc['ltp']

            if not day_low or not day_high or not current_price:
                print(f'  ⚠️  {symbol}: Incomplete OHLC data')
                continue

            # Check each idea
            for idea in ideas:
                idea_id = idea['id']
                title = idea.get('title', 'Untitled')

                # Get targets and stop-loss
                targets = [
                    idea.get('target1'),
                    idea.get('target2'),
                    idea.get('target3')
                ]
                stop_loss = idea.get('stopLoss')
                trade_type = idea.get('tradeType', 'Long')

                # Check if exit was triggered during the day
                exit_result = check_exit_triggered_during_day(day_low, day_high, targets, stop_loss, trade_type)

                if exit_result:
                    new_status = exit_result['new_status']
                    exit_type = exit_result['type']
                    exit_reason = exit_result['exitReason']

                    # Determine the message
                    if new_status == 'STOP_LOSS':
                        message = f'🛑 {symbol} hit Stop Loss! SL: ₹{stop_loss:.2f}, Day Low: ₹{day_low:.2f}'
                    else:  # PROFIT_BOOKED
                        target_num = exit_result.get('targetNumber', 1)
                        target_price = targets[target_num - 1]
                        message = f'🎯 {symbol} hit Target {target_num}! Target: ₹{target_price:.2f}, Day High: ₹{day_high:.2f}'

                    print(f'  ✅ {symbol}: Exit TRIGGERED!')
                    print(f'     {message}')
                    print(f'     Idea: {title}')

                    # Update status
                    if update_idea_status(idea_id, new_status):
                        print(f'     🔄 Status updated: TRIGGERED → {new_status}')

                    # Skip if recent alert
                    if has_recent_alert(idea_id, exit_type, hours=24):
                        print(f'     ⏭️  Alert already sent today, skipping notification')
                        continue

                    # Notify owner
                    create_notification({
                        'userId': idea['userId'],
                        'type': exit_type,
                        'fromUserId': 'system',
                        'fromUserName': 'TradeIdea Bot',
                        'ideaId': idea_id,
                        'ideaSymbol': symbol,
                        'message': message,
                        'read': False,
                        'createdAt': firestore.SERVER_TIMESTAMP,
                        'exitReason': exit_reason
                    })
                    print(f'     📬 Notified owner: {idea.get("userName", "Unknown")}')

                    # Notify followers
                    followers = idea.get('followers', [])
                    follower_count = 0
                    for follower_id in followers:
                        if follower_id != idea['userId']:
                            create_notification({
                                'userId': follower_id,
                                'type': exit_type,
                                'fromUserId': idea['userId'],
                                'fromUserName': idea.get('userName', 'A trader'),
                                'ideaId': idea_id,
                                'ideaSymbol': symbol,
                                'message': f"{idea.get('userName', 'A trader')}'s idea: {message}",
                                'read': False,
                                'createdAt': firestore.SERVER_TIMESTAMP,
                                'exitReason': exit_reason
                            })
                            follower_count += 1

                    if follower_count > 0:
                        print(f'     📬 Notified {follower_count} follower(s)')

                    alert_count += 1

        except Exception as e:
            print(f'  ❌ Error checking {symbol}: {str(e)}')
            continue

    return alert_count

def main():
    """Main execution"""
    try:
        print('=' * 70)
        print('🚀 Trading Ideas Trigger Detection Job')
        print('=' * 70)
        print()

        # Check ACTIVE ideas for entry triggers
        entry_alerts = check_active_ideas()

        # Check TRIGGERED ideas for exit conditions
        exit_alerts = check_triggered_ideas()

        print('\n' + '=' * 70)
        print(f'✅ Entry alerts sent: {entry_alerts}')
        print(f'✅ Exit alerts sent: {exit_alerts}')
        print(f'✅ Total alerts: {entry_alerts + exit_alerts}')
        print('=' * 70)

    except Exception as e:
        print(f'\n❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        # Close DuckDB connection
        if duckdb_conn:
            duckdb_conn.close()

if __name__ == '__main__':
    main()
