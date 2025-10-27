#!/usr/bin/env python3
"""
Trading Ideas Trigger Detection Batch Job

Checks ACTIVE trading ideas for entry/exit conditions and sends notifications:
1. ACTIVE ideas: Check if entry price is near current price (within 2%)
2. TRIGGERED ideas: Check if target or stop-loss is hit

Runs as part of daily EOD batch process.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import sys
import os

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
            # Get symbol data
            symbol_data = get_symbol_data(symbol)
            if not symbol_data or not symbol_data.get('technical'):
                print(f'  ⚠️  {symbol}: No technical data')
                continue

            technical = symbol_data['technical']
            current_price = technical.get('lastPrice')

            if not current_price:
                print(f'  ⚠️  {symbol}: No current price')
                continue

            # Check each idea for this symbol
            for idea in ideas:
                idea_id = idea['id']

                # Skip if recent alert exists
                if has_recent_alert(idea_id, 'entry_alert', hours=24):
                    continue

                entry_price = idea.get('entryPrice')
                trade_type = idea.get('tradeType', 'Long')

                if not entry_price:
                    continue

                alert = check_entry_alert(symbol, entry_price, current_price, trade_type)

                if alert:
                    title = idea.get('title', 'Untitled')
                    print(f'  🎯 {symbol}: {alert["message"]}')
                    print(f'     Idea: {title}')

                    # Notify idea owner
                    create_notification({
                        'userId': idea['userId'],
                        'type': 'entry_alert',
                        'fromUserId': 'system',
                        'fromUserName': 'TradeIdea Bot',
                        'ideaId': idea_id,
                        'ideaSymbol': symbol,
                        'message': alert['message'],
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
                                'type': 'entry_alert',
                                'fromUserId': idea['userId'],
                                'fromUserName': idea.get('userName', 'A trader'),
                                'ideaId': idea_id,
                                'ideaSymbol': symbol,
                                'message': f"{idea.get('userName', 'A trader')}'s idea: {alert['message']}",
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
            # Get symbol data
            symbol_data = get_symbol_data(symbol)
            if not symbol_data or not symbol_data.get('technical'):
                print(f'  ⚠️  {symbol}: No technical data')
                continue

            technical = symbol_data['technical']
            current_price = technical.get('lastPrice')

            if not current_price:
                print(f'  ⚠️  {symbol}: No current price')
                continue

            # Check each idea
            for idea in ideas:
                idea_id = idea['id']

                # Get targets and stop-loss
                targets = [
                    idea.get('target1'),
                    idea.get('target2'),
                    idea.get('target3')
                ]
                stop_loss = idea.get('stopLoss')
                trade_type = idea.get('tradeType', 'Long')

                alert = check_exit_alert(symbol, current_price, targets, stop_loss, trade_type)

                if alert:
                    # Skip if recent alert
                    if has_recent_alert(idea_id, alert['type'], hours=24):
                        continue

                    title = idea.get('title', 'Untitled')
                    print(f'  {alert["message"]}')
                    print(f'     Idea: {title}')

                    # Notify owner
                    create_notification({
                        'userId': idea['userId'],
                        'type': alert['type'],
                        'fromUserId': 'system',
                        'fromUserName': 'TradeIdea Bot',
                        'ideaId': idea_id,
                        'ideaSymbol': symbol,
                        'message': alert['message'],
                        'read': False,
                        'createdAt': firestore.SERVER_TIMESTAMP,
                        'exitReason': alert.get('exitReason')
                    })
                    print(f'     📬 Notified owner: {idea.get("userName", "Unknown")}')

                    # Notify followers
                    followers = idea.get('followers', [])
                    follower_count = 0
                    for follower_id in followers:
                        if follower_id != idea['userId']:
                            create_notification({
                                'userId': follower_id,
                                'type': alert['type'],
                                'fromUserId': idea['userId'],
                                'fromUserName': idea.get('userName', 'A trader'),
                                'ideaId': idea_id,
                                'ideaSymbol': symbol,
                                'message': f"{idea.get('userName', 'A trader')}'s idea: {alert['message']}",
                                'read': False,
                                'createdAt': firestore.SERVER_TIMESTAMP,
                                'exitReason': alert.get('exitReason')
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

if __name__ == '__main__':
    main()
