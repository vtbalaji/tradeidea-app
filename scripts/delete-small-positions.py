#!/usr/bin/env python3
"""
Delete portfolio positions with quantity <= 1
Removes positions with 0 or 1 shares
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

def delete_small_positions():
    """Delete all open positions with quantity <= 1, and all closed positions"""
    print('=' * 70)
    print('🗑️  Delete Small Open Positions & All Closed Positions')
    print('=' * 70)
    print(f'Started at: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')

    try:
        # Fetch all positions (both open and closed)
        portfolios_ref = db.collection('portfolios')

        positions_to_delete = []
        total_open = 0
        total_closed = 0

        print('📊 Scanning for positions to delete...\n')

        # Scan open positions - only delete if quantity <= 1
        print('  Scanning open positions (qty <= 1)...')
        open_query = portfolios_ref.where('status', '==', 'open')
        for doc in open_query.stream():
            total_open += 1
            data = doc.to_dict()
            quantity = data.get('quantity', 0)
            symbol = data.get('symbol', 'UNKNOWN')

            if quantity <= 1:
                positions_to_delete.append({
                    'id': doc.id,
                    'symbol': symbol,
                    'quantity': quantity,
                    'status': 'open',
                    'entryPrice': data.get('entryPrice', 0),
                    'currentPrice': data.get('currentPrice', 0),
                })

        # Scan closed positions - delete ALL closed positions
        print('  Scanning closed positions (all)...')
        closed_query = portfolios_ref.where('status', '==', 'closed')
        for doc in closed_query.stream():
            total_closed += 1
            data = doc.to_dict()
            quantity = data.get('quantity', 0)
            symbol = data.get('symbol', 'UNKNOWN')

            # Delete all closed positions regardless of quantity
            positions_to_delete.append({
                'id': doc.id,
                'symbol': symbol,
                'quantity': quantity,
                'status': 'closed',
                'entryPrice': data.get('entryPrice', 0),
                'currentPrice': data.get('currentPrice', 0),
            })

        print(f'\n📊 Total open positions: {total_open}')
        print(f'📊 Total closed positions: {total_closed}')

        open_to_delete = sum(1 for p in positions_to_delete if p['status'] == 'open')
        closed_to_delete = sum(1 for p in positions_to_delete if p['status'] == 'closed')

        print(f'🗑️  Open positions to delete (qty <= 1): {open_to_delete}')
        print(f'🗑️  Closed positions to delete (all): {closed_to_delete}\n')

        if not positions_to_delete:
            print('✅ No positions to delete!')
            return

        # Show positions that will be deleted
        print('Positions to be deleted:')
        print('-' * 80)
        for pos in positions_to_delete:
            status_emoji = '🟢' if pos["status"] == 'open' else '🔴'
            print(f'  {status_emoji} {pos["symbol"]:<15} Qty: {pos["quantity"]:<5} Status: {pos["status"]:<6} Entry: ₹{pos["entryPrice"]:<10.2f}')
        print('-' * 80)

        # Confirm deletion
        print(f'\n⚠️  WARNING: This will permanently delete {len(positions_to_delete)} positions!')
        print(f'           - {open_to_delete} open position(s) with qty <= 1')
        print(f'           - {closed_to_delete} closed position(s) (all closed positions)')

        # Check if --confirm flag is passed
        if '--confirm' not in sys.argv:
            confirm = input('Type "DELETE" to confirm: ')
            if confirm != 'DELETE':
                print('\n❌ Deletion cancelled.')
                return
        else:
            print('✅ Auto-confirmed via --confirm flag')

        print('\n🗑️  Deleting positions...\n')

        deleted_count = 0
        error_count = 0

        for pos in positions_to_delete:
            try:
                print(f'  Deleting {pos["symbol"]} (qty: {pos["quantity"]})... ', end='', flush=True)
                db.collection('portfolios').document(pos['id']).delete()
                print('✅')
                deleted_count += 1
            except Exception as e:
                print(f'❌ Error: {str(e)}')
                error_count += 1

        print()
        print('=' * 70)
        print('📊 Summary')
        print('=' * 70)
        print(f'Total open scanned: {total_open}')
        print(f'Total closed scanned: {total_closed}')
        print(f'✅ Deleted: {deleted_count}')
        print(f'❌ Errors: {error_count}')
        print('=' * 70)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        delete_small_positions()
        print('\n✅ Job completed successfully')
        sys.exit(0)
    except KeyboardInterrupt:
        print('\n\n❌ Cancelled by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
