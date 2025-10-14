#!/usr/bin/env python3
"""
Weekly Fundamentals Analysis Batch Job (Python)

Fetches fundamental data from Yahoo Finance and updates Firebase Firestore.
Run this weekly (e.g., every Sunday) to update fundamental metrics.
"""

import yfinance as yf
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

def fetch_fundamentals(symbol):
    """Fetch fundamental data from Yahoo Finance"""
    try:
        print(f'  📥 Fetching fundamentals for {symbol}...')
        ticker = yf.Ticker(f'{symbol}.NS')
        info = ticker.info

        if not info or 'symbol' not in info:
            print(f'  ⚠️  No data available')
            return None

        # Check market cap FIRST - skip if less than 1000 Cr (10 billion INR)
        market_cap = info.get('marketCap', 0)
        MIN_MARKET_CAP = 10_000_000_000  # 1000 Cr = 10 billion INR

        if market_cap and market_cap < MIN_MARKET_CAP:
            market_cap_cr = market_cap / 10_000_000  # Convert to Crores
            print(f'  ⏭️  Skipped - Market cap too low ({market_cap_cr:.0f} Cr < 1000 Cr)')
            return None

        # Extract fundamental metrics
        fundamentals = {
            # Valuation Ratios
            'trailingPE': info.get('trailingPE', None),
            'forwardPE': info.get('forwardPE', None),
            'pegRatio': info.get('pegRatio', None),  # Will calculate manually if None
            'priceToBook': info.get('priceToBook', None),
            'priceToSales': info.get('priceToSalesTrailing12Months', None),

            # Financial Health
            'debtToEquity': info.get('debtToEquity', None),
            'currentRatio': info.get('currentRatio', None),
            'quickRatio': info.get('quickRatio', None),

            # Profitability
            'returnOnEquity': info.get('returnOnEquity', None),
            'returnOnAssets': info.get('returnOnAssets', None),
            'profitMargins': info.get('profitMargins', None),
            'operatingMargins': info.get('operatingMargins', None),

            # Growth
            'earningsGrowth': info.get('earningsGrowth', None),
            'revenueGrowth': info.get('revenueGrowth', None),
            'earningsQuarterlyGrowth': info.get('earningsQuarterlyGrowth', None),

            # Dividends
            'dividendYield': info.get('dividendYield', None),
            'payoutRatio': info.get('payoutRatio', None),

            # Market Data
            'marketCap': info.get('marketCap', None),
            'enterpriseValue': info.get('enterpriseValue', None),
            'beta': info.get('beta', None),

            # Additional Info
            'sector': info.get('sector', None),
            'industry': info.get('industry', None),
            'companyName': info.get('longName', None) or info.get('shortName', None),
        }

        # Convert percentages to actual percentages (Yahoo returns as decimals)
        percentage_fields = ['returnOnEquity', 'returnOnAssets', 'profitMargins', 'operatingMargins',
                           'earningsGrowth', 'revenueGrowth', 'earningsQuarterlyGrowth', 'dividendYield', 'payoutRatio']

        for field in percentage_fields:
            if fundamentals[field] is not None and isinstance(fundamentals[field], (int, float)):
                fundamentals[field] = round(fundamentals[field] * 100, 2)  # Convert to percentage

        # Don't calculate PEG - Yahoo data is unreliable for Indian stocks
        # Screener.in uses 3-year CAGR which we don't have access to
        fundamentals['pegRatio'] = None

        # Convert Debt-to-Equity from percentage to ratio
        # Yahoo returns it as percentage (e.g., 63.93 for 63.93%)
        # Convert to ratio format (e.g., 0.64) to match screener.in
        if fundamentals['debtToEquity'] is not None:
            fundamentals['debtToEquity'] = round(fundamentals['debtToEquity'] / 100, 2)

        print(f'  ✅ Fetched fundamentals')
        return fundamentals

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')
        return None

def calculate_fundamental_score(fundamentals):
    """Calculate a fundamental strength score (0-100)"""
    score = 0
    max_score = 0

    # PE Ratio (lower is better, ideally 10-20)
    if fundamentals.get('trailingPE'):
        max_score += 10
        pe = fundamentals['trailingPE']
        if 10 <= pe <= 20:
            score += 10
        elif 20 < pe <= 30:
            score += 7
        elif 5 <= pe < 10:
            score += 7
        elif pe < 5:
            score += 3
        else:
            score += 3

    # PEG Ratio (< 1 is good)
    if fundamentals.get('pegRatio'):
        max_score += 10
        peg = fundamentals['pegRatio']
        if peg < 1:
            score += 10
        elif 1 <= peg < 1.5:
            score += 7
        elif 1.5 <= peg < 2:
            score += 5
        else:
            score += 2

    # ROE (higher is better, > 15% is good)
    if fundamentals.get('returnOnEquity'):
        max_score += 15
        roe = fundamentals['returnOnEquity']
        if roe >= 20:
            score += 15
        elif 15 <= roe < 20:
            score += 12
        elif 10 <= roe < 15:
            score += 8
        else:
            score += 3

    # Debt to Equity (lower is better, < 1 is good)
    if fundamentals.get('debtToEquity'):
        max_score += 10
        de = fundamentals['debtToEquity']
        if de < 50:
            score += 10
        elif 50 <= de < 100:
            score += 7
        elif 100 <= de < 200:
            score += 4
        else:
            score += 1

    # Profit Margins (higher is better, > 10% is good)
    if fundamentals.get('profitMargins'):
        max_score += 10
        pm = fundamentals['profitMargins']
        if pm >= 15:
            score += 10
        elif 10 <= pm < 15:
            score += 7
        elif 5 <= pm < 10:
            score += 4
        else:
            score += 2

    # Earnings Growth (higher is better)
    if fundamentals.get('earningsGrowth'):
        max_score += 15
        eg = fundamentals['earningsGrowth']
        if eg >= 20:
            score += 15
        elif 10 <= eg < 20:
            score += 12
        elif 5 <= eg < 10:
            score += 8
        elif eg > 0:
            score += 4
        else:
            score += 0

    # Revenue Growth (higher is better)
    if fundamentals.get('revenueGrowth'):
        max_score += 10
        rg = fundamentals['revenueGrowth']
        if rg >= 15:
            score += 10
        elif 10 <= rg < 15:
            score += 7
        elif 5 <= rg < 10:
            score += 5
        elif rg > 0:
            score += 3
        else:
            score += 0

    # Current Ratio (> 1.5 is good)
    if fundamentals.get('currentRatio'):
        max_score += 10
        cr = fundamentals['currentRatio']
        if cr >= 2:
            score += 10
        elif 1.5 <= cr < 2:
            score += 7
        elif 1 <= cr < 1.5:
            score += 4
        else:
            score += 1

    # Normalize to 100
    if max_score > 0:
        normalized_score = round((score / max_score) * 100, 1)
    else:
        normalized_score = 0

    # Determine rating
    if normalized_score >= 80:
        rating = 'EXCELLENT'
    elif normalized_score >= 60:
        rating = 'GOOD'
    elif normalized_score >= 40:
        rating = 'AVERAGE'
    elif normalized_score >= 20:
        rating = 'POOR'
    else:
        rating = 'WEAK'

    return {
        'score': normalized_score,
        'rating': rating
    }

def get_symbols():
    """Get all unique symbols from Firestore"""
    print('📊 Fetching symbols from Firestore...')
    symbols = set()

    # PRIMARY SOURCE: From symbols collection (master list of all NSE symbols)
    # This ensures we fetch data for ALL available symbols, not just those in portfolios
    print('  📋 Fetching from symbols collection...')
    symbols_ref = db.collection('symbols')
    symbols_count = 0
    for doc in symbols_ref.stream():
        data = doc.to_dict()
        symbol = data.get('symbol') or doc.id
        # Remove NS_ prefix if present
        if symbol.startswith('NS_'):
            symbol = symbol.replace('NS_', '')
        if symbol:
            symbols.add(symbol)
            symbols_count += 1
    print(f'  ✅ Found {symbols_count} symbols from symbols collection')

    # SECONDARY SOURCE: From user positions/ideas (ensures we don't miss any active symbols)
    print('  📋 Fetching from active portfolios and ideas...')
    active_symbols = set()

    # From ideas
    ideas_ref = db.collection('ideas')
    for doc in ideas_ref.stream():
        data = doc.to_dict()
        if 'symbol' in data:
            active_symbols.add(data['symbol'])

    # From tradingIdeas
    # trading_ideas_ref = db.collection('tradingIdeas')
    # for doc in trading_ideas_ref.stream():
    #     data = doc.to_dict()
    #     if 'symbol' in data:
    #         active_symbols.add(data['symbol'])

    # # From portfolio
    # portfolio_ref = db.collection('portfolio')
    # for doc in portfolio_ref.stream():
    #     data = doc.to_dict()
    #     if 'symbol' in data:
    #         active_symbols.add(data['symbol'])

    # From portfolios
    # portfolios_ref = db.collection('portfolios')
    # for doc in portfolios_ref.stream():
    #     data = doc.to_dict()
    #     if 'symbol' in data:
    #         active_symbols.add(data['symbol'])

    # From user positions (multi-account support)
    # users_ref = db.collection('users')
    # for user_doc in users_ref.stream():
    #     positions_ref = db.collection(f'users/{user_doc.id}/positions')
    #     for pos_doc in positions_ref.stream():
    #         data = pos_doc.to_dict()
    #         if 'symbol' in data:
    #             active_symbols.add(data['symbol'])

    print(f'  ✅ Found {len(active_symbols)} active symbols from portfolios/ideas')

    # Combine both sources
    symbols = symbols.union(active_symbols)

    print(f'✅ Total unique symbols: {len(symbols)}\n')
    return list(symbols)

def save_to_firestore(symbol, fundamentals):
    """Save fundamentals to Firestore (central symbols collection only)"""
    # Add NS_ prefix for Firebase compatibility (symbols starting with numbers)
    symbol_with_prefix = f'NS_{symbol}' if not symbol.startswith('NS_') else symbol

    # Add metadata
    data = {
        **fundamentals,
        'symbol': symbol,  # Store original symbol in data
        'updatedAt': firestore.SERVER_TIMESTAMP
    }

    # Save to symbols collection (central storage - single source of truth)
    # This allows all users to immediately access fundamental data
    symbols_doc = db.collection('symbols').document(symbol_with_prefix)
    symbols_doc.set({
        'symbol': symbol_with_prefix,  # Store with NS_ prefix
        'originalSymbol': symbol,  # Store original symbol for reference
        'name': fundamentals.get('companyName', symbol),
        'sector': fundamentals.get('sector'),
        'industry': fundamentals.get('industry'),
        'fundamental': data,
        'lastFetched': firestore.SERVER_TIMESTAMP
    }, merge=True)  # merge=True preserves technical data if it exists


def analyze_fundamentals():
    """Main analysis function"""
    print('🚀 Starting Fundamentals Analysis (Python)\n')
    print('=' * 60)

    start_time = datetime.now()

    try:
        symbols = get_symbols()

        if not symbols:
            print('⚠️  No symbols found')
            return

        success_count = 0
        fail_count = 0
        skipped_count = 0

        for i, symbol in enumerate(symbols):
            print(f'\n[{i+1}/{len(symbols)}] Processing {symbol}...')

            try:
                # Fetch fundamentals
                fundamentals = fetch_fundamentals(symbol)

                if fundamentals is None:
                    print(f'  ⏭️  Skipped')
                    skipped_count += 1
                    continue

                # Calculate fundamental score
                fundamental_analysis = calculate_fundamental_score(fundamentals)
                fundamentals['fundamentalScore'] = fundamental_analysis['score']
                fundamentals['fundamentalRating'] = fundamental_analysis['rating']

                # Save to Firestore
                print(f'  💾 Saving to Firestore...')
                save_to_firestore(symbol, fundamentals)

                # Display summary
                print(f'  ✅ {symbol} - {fundamental_analysis["rating"]} (Score: {fundamental_analysis["score"]})')
                if fundamentals.get('trailingPE'):
                    print(f'     PE: {fundamentals["trailingPE"]:.2f}', end='')
                if fundamentals.get('pegRatio'):
                    print(f' | PEG: {fundamentals["pegRatio"]:.2f}', end='')
                if fundamentals.get('returnOnEquity'):
                    print(f' | ROE: {fundamentals["returnOnEquity"]:.1f}%', end='')
                if fundamentals.get('debtToEquity'):
                    print(f' | D/E: {fundamentals["debtToEquity"]:.1f}', end='')
                print()

                success_count += 1

            except Exception as e:
                print(f'  ❌ Failed: {str(e)}')
                fail_count += 1

        duration = (datetime.now() - start_time).total_seconds()

        print('\n' + '=' * 60)
        print('📊 Fundamentals Analysis Complete!')
        print('=' * 60)
        print(f'✅ Success: {success_count} symbols')
        print(f'⏭️  Skipped: {skipped_count} symbols (market cap < 1000 Cr or no data)')
        print(f'❌ Failed: {fail_count} symbols')
        print(f'⏱️  Duration: {duration:.1f}s')
        print('=' * 60)

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)

if __name__ == '__main__':
    try:
        analyze_fundamentals()
        print('\n✅ Job completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
