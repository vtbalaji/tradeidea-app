#!/usr/bin/env python3
"""
Alert Generation Service - Backend Alert Checker

Checks all "cooking" ideas and "open" portfolio positions for alert conditions:
- Entry price alerts for cooking ideas (within 1% variance)
- Target price alerts for open positions
- Stop-loss alerts for open positions
- Exit criteria alerts (50EMA, 100MA, 200MA, custom exit price)

Generates notifications in Firestore and auto-updates idea status when entry alerts trigger.
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
        print(f'  ⚠️ Error fetching symbol data: {str(e)}')
        return None

def check_entry_alert(symbol, entry_price, current_price):
    """Check if idea entry price is hit (within 1% variance)"""
    if not current_price or not entry_price:
        return None

    # Calculate variance percentage
    variance = abs((current_price - entry_price) / entry_price)

    # Check if price is within 1% of entry price
    if variance <= 0.01:
        return {
            'type': 'entry_alert',
            'message': f'{symbol} reached entry price! Current: ₹{current_price:.2f}, Entry: ₹{entry_price:.2f} - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': entry_price,
            'triggerReason': '1% variance'
        }

    return None

def check_target_alert(symbol, target_price, current_price):
    """Check if portfolio target is reached"""
    if not current_price or not target_price:
        return None

    if current_price >= target_price:
        return {
            'type': 'target_alert',
            'message': f'{symbol} reached target price! Current: ₹{current_price:.2f}, Target: ₹{target_price:.2f} - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': target_price,
            'triggerReason': 'target reached'
        }

    return None

def check_stoploss_alert(symbol, stop_loss_price, current_price, technicals):
    """
    Check if stop loss is hit
    Uses the LOWEST value among: User SL, Supertrend, 100MA
    """
    if not current_price:
        return None

    # Determine effective stop loss (LOWEST among user SL, Supertrend, 100MA)
    effective_sl = stop_loss_price if stop_loss_price else float('inf')
    sl_source = 'User SL' if stop_loss_price else 'None'

    # Check Supertrend - use if it's LOWER than current effective SL
    if technicals.get('supertrend') and technicals['supertrend'] < effective_sl:
        effective_sl = technicals['supertrend']
        sl_source = 'Supertrend'

    # Check 100MA - use if it's LOWER than current effective SL
    if technicals.get('sma100') and technicals['sma100'] < effective_sl:
        effective_sl = technicals['sma100']
        sl_source = '100MA'

    # Fallback to 200MA if nothing else is available
    if effective_sl == float('inf') and technicals.get('sma200'):
        effective_sl = technicals['sma200']
        sl_source = '200MA'

    # Only trigger if we have a valid stop loss
    if effective_sl != float('inf') and current_price <= effective_sl:
        return {
            'type': 'stoploss_alert',
            'message': f'{symbol} hit stop loss! Current: ₹{current_price:.2f}, SL: ₹{effective_sl:.2f} ({sl_source}) - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': effective_sl,
            'triggerReason': sl_source
        }

    return None

def check_exit_criteria_alerts(symbol, exit_criteria, current_price, technicals):
    """Check exit criteria alerts (50EMA, 100MA, 200MA, custom exit price)"""
    alerts = []

    if not exit_criteria or not current_price or not technicals:
        return alerts

    # Check 50 EMA exit
    if exit_criteria.get('exitBelow50EMA') and technicals.get('ema50') and current_price < technicals['ema50']:
        alerts.append({
            'type': 'stoploss_alert',
            'message': f'{symbol} went below 50 EMA! Current: ₹{current_price:.2f}, 50 EMA: ₹{technicals["ema50"]:.2f} - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': technicals['ema50'],
            'triggerReason': '50 EMA'
        })

    # Check 100 MA exit
    if exit_criteria.get('exitBelow100MA') and technicals.get('sma100') and current_price < technicals['sma100']:
        alerts.append({
            'type': 'stoploss_alert',
            'message': f'{symbol} went below 100 MA! Current: ₹{current_price:.2f}, 100 MA: ₹{technicals["sma100"]:.2f} - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': technicals['sma100'],
            'triggerReason': '100 MA'
        })

    # Check 200 MA exit
    if exit_criteria.get('exitBelow200MA') and technicals.get('sma200') and current_price < technicals['sma200']:
        alerts.append({
            'type': 'stoploss_alert',
            'message': f'{symbol} went below 200 MA! Current: ₹{current_price:.2f}, 200 MA: ₹{technicals["sma200"]:.2f} - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': technicals['sma200'],
            'triggerReason': '200 MA'
        })

    # Check custom exit price
    if exit_criteria.get('exitBelowPrice') and current_price < exit_criteria['exitBelowPrice']:
        alerts.append({
            'type': 'stoploss_alert',
            'message': f'{symbol} went below exit price! Current: ₹{current_price:.2f}, Exit: ₹{exit_criteria["exitBelowPrice"]:.2f} - TradeIdea',
            'currentPrice': current_price,
            'triggerPrice': exit_criteria['exitBelowPrice'],
            'triggerReason': 'custom exit price'
        })

    return alerts

def has_recent_alert(symbol, alert_type, user_id=None):
    """Check if alert already sent in last 24 hours"""
    from datetime import timezone
    one_day_ago = datetime.now(timezone.utc) - timedelta(hours=24)

    notifications_ref = db.collection('notifications')
    query = notifications_ref.where('ideaSymbol', '==', symbol).where('type', '==', alert_type)

    if user_id:
        query = query.where('userId', '==', user_id)

    existing_alerts = query.stream()

    for doc in existing_alerts:
        data = doc.to_dict()
        created_at = data.get('createdAt')
        if created_at and created_at > one_day_ago:
            return True

    return False

def create_notification(notification_data):
    """Create notification in Firestore"""
    try:
        db.collection('notifications').add(notification_data)
        return True
    except Exception as e:
        print(f'  ⚠️ Error creating notification: {str(e)}')
        return False

def check_cooking_ideas():
    """Check all cooking ideas for entry price alerts"""
    print('\n📊 Checking cooking ideas for entry price alerts...')
    print('-' * 70)

    ideas_ref = db.collection('tradingIdeas')
    query = ideas_ref.where('status', '==', 'cooking')

    cooking_ideas = list(query.stream())
    print(f'Found {len(cooking_ideas)} cooking ideas\n')

    if not cooking_ideas:
        return 0

    alert_count = 0

    # Group by symbol to avoid duplicate alerts
    symbol_ideas = {}
    for doc in cooking_ideas:
        idea = doc.to_dict()
        idea['id'] = doc.id
        symbol = idea.get('symbol')
        if symbol:
            if symbol not in symbol_ideas:
                symbol_ideas[symbol] = []
            symbol_ideas[symbol].append(idea)

    for symbol, ideas in symbol_ideas.items():
        try:
            # Check if recent alert exists
            if has_recent_alert(symbol, 'entry_alert'):
                print(f'  ⏭️  {symbol}: Skipping (recent alert exists)')
                continue

            # Get symbol data
            symbol_data = get_symbol_data(symbol)
            if not symbol_data or not symbol_data.get('technical'):
                print(f'  ⚠️  {symbol}: No technical data available')
                continue

            technical = symbol_data['technical']
            current_price = technical.get('lastPrice')

            if not current_price:
                print(f'  ⚠️  {symbol}: No current price available')
                continue

            # Check each idea for this symbol
            for idea in ideas:
                entry_price = idea.get('entryPrice')
                if not entry_price:
                    continue

                alert = check_entry_alert(symbol, entry_price, current_price)

                if alert:
                    print(f'  🎯 {symbol}: Entry price hit! Current: ₹{current_price:.2f}, Entry: ₹{entry_price:.2f}')

                    # Update idea status to "active"
                    idea_ref = db.collection('tradingIdeas').document(idea['id'])
                    idea_ref.update({
                        'status': 'active',
                        'updatedAt': firestore.SERVER_TIMESTAMP
                    })
                    print(f'     ✅ Updated idea status to "active"')

                    # Notify idea owner
                    create_notification({
                        'userId': idea['userId'],
                        'type': 'entry_alert',
                        'fromUserId': 'system',
                        'fromUserName': 'TradeIdea',
                        'ideaId': idea['id'],
                        'ideaSymbol': symbol,
                        'message': alert['message'],
                        'read': False,
                        'createdAt': datetime.now()
                    })
                    print(f'     📬 Notified owner')

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
                                'ideaId': idea['id'],
                                'ideaSymbol': symbol,
                                'message': f"idea {alert['message']}",
                                'read': False,
                                'createdAt': datetime.now()
                            })
                            follower_count += 1

                    if follower_count > 0:
                        print(f'     📬 Notified {follower_count} followers')

                    alert_count += 1
                    break  # Only process first triggered idea per symbol

        except Exception as e:
            print(f'  ❌ {symbol}: Error - {str(e)}')

    return alert_count

def check_portfolio_positions():
    """Check all open portfolio positions for target/stop-loss/exit alerts"""
    print('\n📊 Checking portfolio positions for alerts...')
    print('-' * 70)

    portfolios_ref = db.collection('portfolios')
    query = portfolios_ref.where('status', '==', 'open')

    open_positions = list(query.stream())
    print(f'Found {len(open_positions)} open positions\n')

    if not open_positions:
        return 0

    alert_count = 0

    # Group by symbol and user to avoid duplicate alerts
    symbol_user_positions = {}
    for doc in open_positions:
        position = doc.to_dict()
        position['id'] = doc.id
        symbol = position.get('symbol')
        user_id = position.get('userId')

        if symbol and user_id:
            key = f'{symbol}_{user_id}'
            if key not in symbol_user_positions:
                symbol_user_positions[key] = []
            symbol_user_positions[key].append(position)

    for key, positions in symbol_user_positions.items():
        symbol = positions[0]['symbol']
        user_id = positions[0]['userId']

        try:
            # Get symbol data
            symbol_data = get_symbol_data(symbol)
            if not symbol_data or not symbol_data.get('technical'):
                print(f'  ⚠️  {symbol} ({user_id[:8]}): No technical data available')
                continue

            technical = symbol_data['technical']
            current_price = technical.get('lastPrice')

            if not current_price:
                print(f'  ⚠️  {symbol} ({user_id[:8]}): No current price available')
                continue

            # Track which alert types have been sent recently for this symbol+user
            recent_alert_types = set()

            # Check recent alerts for this user and symbol
            from datetime import timezone
            one_day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
            notifications_ref = db.collection('notifications')
            existing_query = notifications_ref.where('ideaSymbol', '==', symbol).where('userId', '==', user_id)

            for notif_doc in existing_query.stream():
                notif_data = notif_doc.to_dict()
                created_at = notif_data.get('createdAt')
                if created_at and created_at > one_day_ago:
                    recent_alert_types.add(notif_data.get('type'))

            # Check each position for alerts
            for position in positions:
                alerts = []

                # Check target alert
                target_price = position.get('target1')
                if target_price:
                    target_alert = check_target_alert(symbol, target_price, current_price)
                    if target_alert:
                        alerts.append(target_alert)

                # Check stop-loss alert
                stop_loss = position.get('stopLoss')
                sl_alert = check_stoploss_alert(symbol, stop_loss, current_price, technical)
                if sl_alert:
                    alerts.append(sl_alert)

                # Check exit criteria alerts
                exit_criteria = position.get('exitCriteria')
                if exit_criteria:
                    exit_alerts = check_exit_criteria_alerts(symbol, exit_criteria, current_price, technical)
                    alerts.extend(exit_alerts)

                # Process triggered alerts
                for alert in alerts:
                    alert_type = alert['type']

                    # Skip if already sent for this symbol+user today
                    if alert_type in recent_alert_types:
                        print(f'  ⏭️  {symbol} ({user_id[:8]}): Skipping {alert_type} (recent alert exists)')
                        continue

                    icon = '🎯' if alert_type == 'target_alert' else '⚠️'
                    print(f'  {icon} {symbol} ({user_id[:8]}): {alert["triggerReason"]}')
                    print(f'     Current: ₹{current_price:.2f}, Trigger: ₹{alert["triggerPrice"]:.2f}')

                    # Create notification
                    create_notification({
                        'userId': user_id,
                        'type': alert_type,
                        'fromUserId': 'system',
                        'fromUserName': 'TradeIdea',
                        'ideaId': position.get('ideaId'),
                        'positionId': position['id'],
                        'ideaSymbol': symbol,
                        'message': alert['message'],
                        'read': False,
                        'createdAt': datetime.now()
                    })
                    print(f'     📬 Notification sent')

                    recent_alert_types.add(alert_type)
                    alert_count += 1

        except Exception as e:
            print(f'  ❌ {symbol}: Error - {str(e)}')

    return alert_count

def main():
    """Main function"""
    print('=' * 70)
    print('🔔 Alert Generation Service')
    print('=' * 70)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    start_time = datetime.now()

    try:
        # Check cooking ideas for entry alerts
        entry_alerts = check_cooking_ideas()

        # Check portfolio positions for target/stop-loss/exit alerts
        portfolio_alerts = check_portfolio_positions()

        duration = (datetime.now() - start_time).total_seconds()

        print('\n' + '=' * 70)
        print('📊 Summary')
        print('=' * 70)
        print(f'Entry Alerts: {entry_alerts}')
        print(f'Portfolio Alerts: {portfolio_alerts}')
        print(f'Total Alerts: {entry_alerts + portfolio_alerts}')
        print(f'⏱️  Duration: {duration:.1f}s')
        print('=' * 70)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        main()
        print('\n✅ Alert generation completed successfully')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Alert generation failed: {str(e)}')
        sys.exit(1)
