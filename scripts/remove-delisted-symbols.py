#!/usr/bin/env python3
"""
Remove Delisted Symbols from Firebase

This script removes delisted/suspended symbols that consistently fail to fetch
data from NSE. These symbols return wrong column format indicating they are
no longer actively traded.
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

# List of confirmed delisted symbols (consistently failing with column format error)
DELISTED_SYMBOLS = [
    'A2ZINFRA', 'AAATECH', 'AAREYDRUGS', 'AARVEEDEN', 'ABAN', 'ABMINTLLTD',
    'ACL', 'AGROPHOS', 'AHCL', 'AKSHAR', 'ALPSINDUS', 'ARFIN', 'ASMS',
    'ATLANTAA', 'AXISCADES', 'BAFNAPH', 'BCONCEPTS', 'BGRENERGY', 'BHAGYANGR',
    'BHARATGEAR', 'BLUECOAST', 'BVCL', 'CEAT', 'CENTEXT', 'CLEDUCATE',
    'COFFEEDAY', 'CURAA', 'CYBERMEDIA', 'CYBERTECH', 'DELPHIFX', 'DIGISPICE',
    'DIGJAMLMTD', 'EASTSILK', 'ELGIRUBCO', 'EMKAY', 'EQUIPPP', 'EXCEL',
    'GATECHDVR', 'GAYAHWS', 'GINNIFILA', 'GUJAPOLLO', 'GVKPIL', 'HGM',
    'HITECHGEAR', 'HTMEDIA', 'ICDSLTD', 'IEL', 'INDOBORAX', 'INDOTHAI',
    'INFOMEDIA', 'INNOVANA', 'INTENTECH', 'ISHANCH', 'IZMO', 'JAYBARMARU',
    'JITFINFRA', 'JPASSOCIAT', 'JUBLCPL', 'KALYANI', 'KARMAENG', 'KAUSHALYA',
    'KAVDEFENCE', 'KAYA', 'KINGFA', 'KIOCL', 'KRISHIVAL', 'LASA', 'LORDSCHLO',
    'LOTUSEYE', 'LOYALTEX', 'MAHASTEEL', 'MANAKALUCO', 'MANAKSTEEL', 'MANUGRAPH',
    'MCL', 'MCLEODRUSS', 'MEDICO', 'MIRCELECTR', 'MOHITIND', 'MTEDUCARE',
    'NACLIND', 'NAGREEKCAP', 'NARMADA', 'NATCAPSUQ', 'NAVKARURB', 'NDLVENTURE',
    'NDTV-RE', 'NECLIFE', 'NILASPACES', 'NORBTEAEXP', 'ODIGMA', 'OLAELEC',
    'OMAXAUTO', 'ORCHASP', 'ORTINGLOBE', 'OSIAHYPER', 'OSWALSEEDS', 'PALREDTEC',
    'PANACHE', 'PAR', 'PARSVNATH', 'PIGL', 'PKTEA', 'PNC', 'PRAENG', 'PRAXIS',
    'PREMIER', 'PROZONER', 'PVP', 'RAJRILTD', 'RCOM', 'RELIABLE', 'RELINFRA',
    'RISHABH', 'RVHL', 'SABEVENTS', 'SABTNL', 'SADBHIN', 'SADHNANIQ', 'SALSTEEL',
    'SEYAIND', 'SHREERAMA', 'SIGMA', 'SILGO', 'SIMBHALS', 'SKFINDIA', 'SKMEGGPROD',
    'SOMATEX', 'SPCENET', 'SRD', 'SUMEETINDS', 'SUVIDHAA', 'SVLL', 'TAKE',
    'TEAMGTY', 'TECILCHEM'
]

def main():
    print('=' * 80)
    print('🗑️  Remove Delisted Symbols from Firebase')
    print('=' * 80)
    print(f'Total symbols to remove: {len(DELISTED_SYMBOLS)}\n')

    removed_count = 0
    not_found_count = 0
    error_count = 0

    for symbol in DELISTED_SYMBOLS:
        try:
            # Try with NS_ prefix first
            symbol_id = f'NS_{symbol}'
            doc_ref = db.collection('symbols').document(symbol_id)
            doc = doc_ref.get()

            if doc.exists:
                doc_ref.delete()
                print(f'✅ Removed: {symbol_id}')
                removed_count += 1
            else:
                # Try without prefix
                doc_ref = db.collection('symbols').document(symbol)
                doc = doc_ref.get()

                if doc.exists:
                    doc_ref.delete()
                    print(f'✅ Removed: {symbol}')
                    removed_count += 1
                else:
                    print(f'⏭️  Not found: {symbol}')
                    not_found_count += 1

        except Exception as e:
            print(f'❌ Error removing {symbol}: {str(e)}')
            error_count += 1

    print('\n' + '=' * 80)
    print('📊 Summary')
    print('=' * 80)
    print(f'Total symbols: {len(DELISTED_SYMBOLS)}')
    print(f'✅ Removed: {removed_count}')
    print(f'⏭️  Not found: {not_found_count}')
    print(f'❌ Errors: {error_count}')
    print('=' * 80)

    if error_count > 0:
        sys.exit(1)
    else:
        print('\n✅ Delisted symbols removed successfully!')
        sys.exit(0)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
