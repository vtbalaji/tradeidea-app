#!/usr/bin/env python3
"""
Portfolio Stop-Loss Management Batch Job

Strategy 3: Breakeven + Technical Trail
- Phase 1 (Capital Protection): Use User SL until price moves 1.5x initial risk
- Phase 2 (Breakeven Lock): Once at 1.5R profit, raise SL to entry price or technical SL (whichever is higher)
- Phase 3 (Profit Protection): Once at 2R+ profit, use technical SL and ratchet up only

Technical SL = max(100MA, Daily Supertrend) - only if above entry price
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
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

def get_open_positions():
    """Fetch all open positions from portfolios collection"""
    print('📊 Fetching open positions from Firestore...')
    positions = []

    portfolios_ref = db.collection('portfolios')
    query = portfolios_ref.where('status', '==', 'open')

    for doc in query.stream():
        data = doc.to_dict()
        data['id'] = doc.id
        positions.append(data)

    print(f'✅ Found {len(positions)} open positions\n')
    return positions

def get_symbol_data(symbol):
    """Fetch symbol data from symbols collection"""
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

def get_technical_sl(position, technical_data):
    """
    Calculate technical SL from 100MA and Daily Supertrend
    Returns the HIGHEST of 100MA and Supertrend (both must be above entry)
    """
    entry_price = position['entryPrice']

    # Get technical levels
    sma100 = technical_data.get('sma100', 0)
    supertrend = technical_data.get('supertrend', 0)
    supertrend_direction = technical_data.get('supertrendDirection', 0)

    # Only consider levels above entry (we don't want to lower SL)
    candidates = []

    # 100MA (only if above entry)
    if sma100 > 0 and sma100 > entry_price:
        candidates.append(sma100)

    # Daily Supertrend (only if bullish and above entry)
    if supertrend > 0 and supertrend_direction == 1 and supertrend > entry_price:
        candidates.append(supertrend)

    # Return HIGHEST technical level (max of 100MA and Supertrend)
    if candidates:
        technical_sl = max(candidates)

        # Determine which sources contributed
        sources = []
        if sma100 > 0 and sma100 > entry_price:
            sources.append(f'100MA:₹{sma100:.2f}')
        if supertrend > 0 and supertrend_direction == 1 and supertrend > entry_price:
            sources.append(f'ST:₹{supertrend:.2f}')

        source_label = ' | '.join(sources) if sources else 'Technical'
        return technical_sl, source_label

    return None, None

def initialize_sl_management(position):
    """Initialize stop-loss management for a position that doesn't have it"""
    from datetime import datetime as dt
    return {
        'userStopLoss': position['stopLoss'],
        'effectiveStopLoss': position['stopLoss'],
        'initialRisk': position['entryPrice'] - position['stopLoss'],
        'phase': 'protection',
        'slHistory': [
            {
                'timestamp': dt.now(),
                'fromSL': position['stopLoss'],
                'toSL': position['stopLoss'],
                'fromPhase': 'protection',
                'toPhase': 'protection',
                'reason': 'Position initialized with user stop-loss',
                'priceAtChange': position.get('currentPrice', position['entryPrice']),
                'profitInR': 0.0
            }
        ]
    }

def calculate_sl_phase(position, current_price, technical_sl, technical_sl_source):
    """
    Determine which phase position should be in based on Strategy 3

    Returns dict with:
    - phase: 'protection' | 'breakeven' | 'trailing'
    - effectiveStopLoss: number
    - phaseChanged: boolean
    - reason: string
    - profitInR: number
    """

    # Get existing state or initialize
    slm = position.get('stopLossManagement')
    if not slm:
        slm = initialize_sl_management(position)

    entry_price = position['entryPrice']
    initial_risk = slm['initialRisk']

    # Avoid division by zero
    if initial_risk <= 0:
        print(f'  ⚠️ Invalid initial risk ({initial_risk}), using user SL only')
        return {
            'phase': 'protection',
            'effectiveStopLoss': slm['userStopLoss'],
            'phaseChanged': False,
            'reason': 'Invalid risk calculation',
            'profitInR': 0.0,
            'slm': slm,
            'technicalSL': None,
            'technicalSLSource': None
        }

    current_profit = current_price - entry_price
    profit_in_r = current_profit / initial_risk

    new_phase = slm['phase']
    new_sl = slm['effectiveStopLoss']
    reason = ''

    # PHASE TRANSITIONS (Strategy 3)

    # Phase 1 → Phase 2: Breakeven (at 1.5R profit)
    if slm['phase'] == 'protection' and profit_in_r >= 1.5:
        new_phase = 'breakeven'

        # Use max(entry price, technical SL if available)
        if technical_sl and technical_sl > entry_price:
            new_sl = technical_sl
            reason = f'Breakeven crossed (1.5R) - using {technical_sl_source} at ₹{technical_sl:.2f}'
        else:
            new_sl = entry_price
            reason = f'Breakeven crossed (1.5R) - locked at entry ₹{entry_price:.2f}'

    # Phase 2 → Phase 3: Profit Protection (at 2R profit)
    elif slm['phase'] == 'breakeven' and profit_in_r >= 2.0:
        new_phase = 'trailing'

        # Use technical SL if available, otherwise keep current
        if technical_sl and technical_sl > new_sl:
            new_sl = technical_sl
            reason = f'Profit protection active (2R+) - trailing with {technical_sl_source} at ₹{technical_sl:.2f}'
        else:
            reason = f'Profit protection active (2R+) - no technical SL above current'

    # Phase 3: Ratchet Up Only (never lower SL)
    elif slm['phase'] == 'trailing':
        if technical_sl and technical_sl > new_sl:
            new_sl = technical_sl
            reason = f'Technical SL ratcheted up to ₹{technical_sl:.2f} ({technical_sl_source})'

    phase_changed = (new_phase != slm['phase']) or (new_sl != slm['effectiveStopLoss'])

    return {
        'phase': new_phase,
        'effectiveStopLoss': new_sl,
        'phaseChanged': phase_changed,
        'reason': reason,
        'profitInR': profit_in_r,
        'slm': slm,
        'technicalSL': technical_sl,
        'technicalSLSource': technical_sl_source
    }

def update_position_sl(position_id, sl_update, current_price):
    """Update position in Firebase with new effective stop-loss"""
    from datetime import datetime as dt

    # Build the stopLossManagement object
    slm = sl_update['slm']

    # Add history entry if phase changed
    if sl_update['phaseChanged']:
        history_entry = {
            'timestamp': dt.now(),
            'fromSL': slm['effectiveStopLoss'],
            'toSL': sl_update['effectiveStopLoss'],
            'fromPhase': slm['phase'],
            'toPhase': sl_update['phase'],
            'reason': sl_update['reason'],
            'priceAtChange': current_price,
            'profitInR': sl_update['profitInR'],
            'technicalSL': sl_update.get('technicalSL'),
            'technicalSLSource': sl_update.get('technicalSLSource')
        }

        # Update history
        if 'slHistory' not in slm:
            slm['slHistory'] = []
        slm['slHistory'].append(history_entry)

        # Add phase transition timestamps
        if sl_update['phase'] == 'breakeven' and slm['phase'] == 'protection':
            slm['breakevenCrossedAt'] = dt.now()
        elif sl_update['phase'] == 'trailing' and slm['phase'] == 'breakeven':
            slm['profitLockTriggeredAt'] = dt.now()

    # Update to new values
    slm['effectiveStopLoss'] = sl_update['effectiveStopLoss']
    slm['phase'] = sl_update['phase']

    # Update position in Firebase with full stopLossManagement object
    position_ref = db.collection('portfolios').document(position_id)
    position_ref.update({
        'stopLoss': sl_update['effectiveStopLoss'],
        'smartSLTrigger': 'yes',
        'smartSLPhase': sl_update['phase'],  # protection | breakeven | trailing
        'smartSLSource': sl_update.get('technicalSLSource'),  # 100MA | Supertrend | None
        'stopLossManagement': slm,  # Save full object with history
        'updatedAt': firestore.SERVER_TIMESTAMP
    })

def create_notification(user_id, position, message):
    """Create notification for user about SL phase change"""
    try:
        from datetime import datetime as dt
        notification = {
            'userId': user_id,
            'type': 'sl_phase_change',
            'fromUserId': 'system',
            'fromUserName': 'Portfolio Manager',
            'ideaId': position.get('ideaId'),
            'positionId': position['id'],
            'ideaSymbol': position['symbol'],
            'message': message,
            'read': False,
            'createdAt': dt.now()
        }

        db.collection('notifications').add(notification)
        print(f'  📬 Notification sent to user')
    except Exception as e:
        print(f'  ⚠️ Failed to create notification: {str(e)}')

def manage_portfolio_stoploss():
    """Main function"""
    print('=' * 70)
    print('🛡️  Portfolio Stop-Loss Management (Strategy 3)')
    print('=' * 70)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    start_time = datetime.now()

    try:
        # Fetch all open positions
        positions = get_open_positions()

        if not positions:
            print('⚠️  No open positions found\n')
            return

        updated_count = 0
        initialized_count = 0
        phase_changed_count = 0
        error_count = 0

        for i, pos in enumerate(positions):
            symbol = pos['symbol']
            print(f'[{i+1}/{len(positions)}] {symbol}')
            print('-' * 70)

            try:
                # Get current price from symbols collection
                symbol_data = get_symbol_data(symbol)
                if not symbol_data or not symbol_data.get('technical'):
                    print(f'  ⚠️  No technical data available - skipping')
                    error_count += 1
                    print()
                    continue

                technical_data = symbol_data['technical']
                current_price = technical_data.get('lastPrice')

                if not current_price:
                    print(f'  ⚠️  No current price available - skipping')
                    error_count += 1
                    print()
                    continue

                # Check if this is first time (needs initialization)
                if not pos.get('stopLossManagement'):
                    initialized_count += 1
                    print(f'  🆕 Initializing stop-loss management')

                # Get technical SL
                technical_sl, technical_sl_source = get_technical_sl(pos, technical_data)

                # Calculate phase
                sl_update = calculate_sl_phase(pos, current_price, technical_sl, technical_sl_source)

                # Display current state
                print(f'  Entry: ₹{pos["entryPrice"]:.2f} | Current: ₹{current_price:.2f}')
                print(f'  User SL: ₹{pos["stopLoss"]:.2f} | Initial Risk: ₹{sl_update["slm"]["initialRisk"]:.2f}')
                print(f'  Profit: {sl_update["profitInR"]:+.2f}R')

                if technical_sl:
                    print(f'  Technical SL: ₹{technical_sl:.2f} ({technical_sl_source})')
                else:
                    print(f'  Technical SL: None (no levels above entry)')

                print(f'  Current Phase: {sl_update["slm"]["phase"].upper()}')
                print(f'  Effective SL: ₹{sl_update["slm"]["effectiveStopLoss"]:.2f}')

                # Always update smartSL flag for managed positions
                update_position_sl(pos['id'], sl_update, current_price)

                if sl_update['phaseChanged']:
                    print(f'  🔄 CHANGE: {sl_update["reason"]}')
                    print(f'  New Phase: {sl_update["phase"].upper()}')
                    print(f'  New SL: ₹{sl_update["effectiveStopLoss"]:.2f}')
                    updated_count += 1

                    # Notify user if phase changed (not just SL ratchet within same phase)
                    if sl_update['phase'] != sl_update['slm']['phase']:
                        phase_changed_count += 1
                        create_notification(
                            pos['userId'],
                            pos,
                            f"{symbol}: {sl_update['reason']}"
                        )

                    print(f'  ✅ SL Updated in Firebase')
                else:
                    print(f'  ✅ Smart SL active (no change this cycle)')

            except Exception as e:
                print(f'  ❌ Error: {str(e)}')
                error_count += 1

            print()

        duration = (datetime.now() - start_time).total_seconds()

        print('=' * 70)
        print('📊 Summary')
        print('=' * 70)
        print(f'Total Positions: {len(positions)}')
        print(f'🛡️  Smart SL Active: {len(positions) - error_count}')
        print(f'🔄 SL Changes: {updated_count}')
        print(f'🆕 Initialized: {initialized_count}')
        print(f'📈 Phase Changes: {phase_changed_count}')
        print(f'❌ Errors: {error_count}')
        print(f'⏱️  Duration: {duration:.1f}s')
        print('=' * 70)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        manage_portfolio_stoploss()
        print('\n✅ Job completed successfully')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
