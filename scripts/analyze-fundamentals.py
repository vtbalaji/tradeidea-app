#!/usr/bin/env python3
"""
Weekly Fundamentals Analysis Batch Job (Python)

Fetches fundamental data from Yahoo Finance and updates:
1. Firebase Firestore (for web app)
2. DuckDB (for forensic analysis)

Run this weekly (e.g., every Sunday) to update fundamental metrics.
"""

import yfinance as yf
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import sys
import os

# Add scripts directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Import Yahoo DuckDB fetcher, PEG calculator, and XBRL enricher
from yahoo_fundamentals_fetcher import YahooFundamentalsFetcher
from peg_calculator import PEGCalculator
from yahoo_xbrl_enricher import YahooXBRLEnricher

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

# Initialize DuckDB storage, PEG calculator, and XBRL enricher
duckdb_fetcher = YahooFundamentalsFetcher()
peg_calculator = PEGCalculator()
xbrl_enricher = YahooXBRLEnricher()

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

        # Calculate Graham Number
        # Graham Number = √(22.5 × EPS × Book Value per Share)
        graham_number = None
        price_to_graham = None
        trailing_eps = info.get('trailingEps', None)
        book_value = info.get('bookValue', None)
        current_price = info.get('currentPrice', None) or info.get('regularMarketPrice', None)

        if trailing_eps and book_value and trailing_eps > 0 and book_value > 0:
            graham_number = round((22.5 * trailing_eps * book_value) ** 0.5, 2)
            if current_price and graham_number > 0:
                price_to_graham = round(current_price / graham_number, 2)

        # Extract fundamental metrics
        fundamentals = {
            # Valuation Ratios
            'trailingPE': info.get('trailingPE', None),
            'forwardPE': info.get('forwardPE', None),
            'pegRatio': info.get('pegRatio', None),  # Will calculate manually if None
            'priceToBook': info.get('priceToBook', None),
            'priceToSales': info.get('priceToSalesTrailing12Months', None),
            'grahamNumber': graham_number,
            'priceToGraham': price_to_graham,

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
            'longBusinessSummary': info.get('longBusinessSummary', None),
        }

        # Convert percentages to actual percentages (Yahoo returns as decimals)
        percentage_fields = ['returnOnEquity', 'returnOnAssets', 'profitMargins', 'operatingMargins',
                           'earningsGrowth', 'revenueGrowth', 'earningsQuarterlyGrowth', 'dividendYield', 'payoutRatio']

        for field in percentage_fields:
            if fundamentals[field] is not None and isinstance(fundamentals[field], (int, float)):
                # Skip if value is 0 (likely missing data)
                if fundamentals[field] == 0:
                    fundamentals[field] = None
                else:
                    fundamentals[field] = round(fundamentals[field] * 100, 2)  # Convert to percentage

        # Calculate PEG using 3-year CAGR (Indian market standard)
        print(f'  📊 Calculating PEG Ratio...')
        try:
            peg_data = peg_calculator.calculate_hybrid_peg(symbol)
            if peg_data and 'pegHybrid' in peg_data and peg_data['pegHybrid'] is not None:
                fundamentals['pegRatio'] = round(peg_data['pegHybrid'], 2)
                fundamentals['earningsGrowth3Y'] = peg_data.get('earningsCagr3Y')  # Store 3-year CAGR
                fundamentals['pegHistorical'] = peg_data.get('pegHistorical3Y')  # Historical PEG
                fundamentals['pegForward'] = peg_data.get('pegForward1Y')  # Forward PEG
                print(f'  ✅ PEG Ratio: {fundamentals["pegRatio"]} (3Y CAGR: {peg_data.get("earningsCagr3Y")}%)')
            else:
                fundamentals['pegRatio'] = None
                print(f'  ⚠️  PEG calculation failed - insufficient data')
        except Exception as e:
            fundamentals['pegRatio'] = None
            print(f'  ⚠️  PEG calculation error: {str(e)[:50]}')

        # Convert Debt-to-Equity from percentage to ratio
        # Yahoo returns it as percentage (e.g., 63.93 for 63.93%)
        # Convert to ratio format (e.g., 0.64) to match screener.in
        if fundamentals['debtToEquity'] is not None:
            fundamentals['debtToEquity'] = round(fundamentals['debtToEquity'] / 100, 2)

        # Calculate Piotroski F-Score
        print(f'  📊 Calculating Piotroski F-Score...')
        piotroski = calculate_piotroski_score(ticker)
        if piotroski:
            fundamentals['piotroskiScore'] = piotroski['score']
            fundamentals['piotroskiBreakdown'] = piotroski['breakdown']
            fundamentals['piotroskiDetails'] = piotroski['details']
            print(f'  ✅ Piotroski F-Score: {piotroski["score"]}/9')
        else:
            fundamentals['piotroskiScore'] = None
            fundamentals['piotroskiBreakdown'] = None
            fundamentals['piotroskiDetails'] = None
            print(f'  ⚠️  Piotroski F-Score unavailable (insufficient data)')

        print(f'  ✅ Fetched fundamentals')
        return fundamentals

    except Exception as e:
        print(f'  ❌ Error: {str(e)}')
        return None

def calculate_piotroski_score(ticker):
    """
    Calculate Piotroski F-Score (0-9 points)

    A value investing metric that evaluates 9 criteria:
    - Profitability (4 points)
    - Leverage/Liquidity (3 points)
    - Operating Efficiency (2 points)

    Returns:
        dict: {'score': int (0-9), 'breakdown': dict, 'details': str}
    """
    try:
        # Get financial statements
        financials = ticker.financials
        balance_sheet = ticker.balance_sheet
        cashflow = ticker.cashflow

        if financials is None or balance_sheet is None or cashflow is None:
            return None

        if financials.empty or balance_sheet.empty or cashflow.empty:
            return None

        # Ensure we have at least 2 years of data (current + previous)
        if len(financials.columns) < 2:
            return None

        score = 0
        breakdown = {}
        details = []

        # Get current year (most recent) and previous year data
        current = 0  # Most recent column
        previous = 1  # Second most recent column

        # ===== PROFITABILITY (4 points) =====

        # 1. Positive Net Income
        try:
            net_income = financials.loc['Net Income', financials.columns[current]]
            if net_income > 0:
                score += 1
                breakdown['netIncome'] = 1
                details.append('✓ Net Income > 0')
            else:
                breakdown['netIncome'] = 0
                details.append('✗ Net Income ≤ 0')
        except:
            breakdown['netIncome'] = 0
            details.append('✗ Net Income data unavailable')

        # 2. Positive Operating Cash Flow
        try:
            ocf = cashflow.loc['Operating Cash Flow', cashflow.columns[current]]
            if ocf > 0:
                score += 1
                breakdown['operatingCashFlow'] = 1
                details.append('✓ Operating Cash Flow > 0')
            else:
                breakdown['operatingCashFlow'] = 0
                details.append('✗ Operating Cash Flow ≤ 0')
        except:
            breakdown['operatingCashFlow'] = 0
            details.append('✗ Operating Cash Flow data unavailable')

        # 3. ROA increased (Return on Assets)
        try:
            net_income_curr = financials.loc['Net Income', financials.columns[current]]
            net_income_prev = financials.loc['Net Income', financials.columns[previous]]
            total_assets_curr = balance_sheet.loc['Total Assets', balance_sheet.columns[current]]
            total_assets_prev = balance_sheet.loc['Total Assets', balance_sheet.columns[previous]]

            roa_curr = net_income_curr / total_assets_curr
            roa_prev = net_income_prev / total_assets_prev

            if roa_curr > roa_prev:
                score += 1
                breakdown['roaIncrease'] = 1
                details.append(f'✓ ROA increased ({roa_prev:.2%} → {roa_curr:.2%})')
            else:
                breakdown['roaIncrease'] = 0
                details.append(f'✗ ROA decreased ({roa_prev:.2%} → {roa_curr:.2%})')
        except:
            breakdown['roaIncrease'] = 0
            details.append('✗ ROA data unavailable')

        # 4. Quality of Earnings (Operating Cash Flow > Net Income)
        try:
            if ocf > net_income:
                score += 1
                breakdown['qualityOfEarnings'] = 1
                details.append('✓ Operating Cash Flow > Net Income')
            else:
                breakdown['qualityOfEarnings'] = 0
                details.append('✗ Operating Cash Flow ≤ Net Income')
        except:
            breakdown['qualityOfEarnings'] = 0
            details.append('✗ Quality of earnings data unavailable')

        # ===== LEVERAGE/LIQUIDITY (3 points) =====

        # 5. Long-term debt decreased
        try:
            lt_debt_curr = balance_sheet.loc['Long Term Debt', balance_sheet.columns[current]]
            lt_debt_prev = balance_sheet.loc['Long Term Debt', balance_sheet.columns[previous]]

            if lt_debt_curr < lt_debt_prev:
                score += 1
                breakdown['debtDecrease'] = 1
                details.append('✓ Long-term debt decreased')
            else:
                breakdown['debtDecrease'] = 0
                details.append('✗ Long-term debt increased')
        except:
            breakdown['debtDecrease'] = 0
            details.append('✗ Long-term debt data unavailable')

        # 6. Current Ratio increased
        try:
            curr_assets_curr = balance_sheet.loc['Current Assets', balance_sheet.columns[current]]
            curr_liab_curr = balance_sheet.loc['Current Liabilities', balance_sheet.columns[current]]
            curr_assets_prev = balance_sheet.loc['Current Assets', balance_sheet.columns[previous]]
            curr_liab_prev = balance_sheet.loc['Current Liabilities', balance_sheet.columns[previous]]

            current_ratio_curr = curr_assets_curr / curr_liab_curr
            current_ratio_prev = curr_assets_prev / curr_liab_prev

            if current_ratio_curr > current_ratio_prev:
                score += 1
                breakdown['currentRatioIncrease'] = 1
                details.append(f'✓ Current ratio increased ({current_ratio_prev:.2f} → {current_ratio_curr:.2f})')
            else:
                breakdown['currentRatioIncrease'] = 0
                details.append(f'✗ Current ratio decreased ({current_ratio_prev:.2f} → {current_ratio_curr:.2f})')
        except:
            breakdown['currentRatioIncrease'] = 0
            details.append('✗ Current ratio data unavailable')

        # 7. No new shares issued
        try:
            shares_curr = balance_sheet.loc['Ordinary Shares Number', balance_sheet.columns[current]]
            shares_prev = balance_sheet.loc['Ordinary Shares Number', balance_sheet.columns[previous]]

            if shares_curr <= shares_prev:
                score += 1
                breakdown['noSharesIssued'] = 1
                details.append('✓ No new shares issued')
            else:
                breakdown['noSharesIssued'] = 0
                details.append('✗ New shares issued')
        except:
            breakdown['noSharesIssued'] = 0
            details.append('✗ Shares outstanding data unavailable')

        # ===== OPERATING EFFICIENCY (2 points) =====

        # 8. Gross Margin increased
        try:
            revenue_curr = financials.loc['Total Revenue', financials.columns[current]]
            revenue_prev = financials.loc['Total Revenue', financials.columns[previous]]
            gross_profit_curr = financials.loc['Gross Profit', financials.columns[current]]
            gross_profit_prev = financials.loc['Gross Profit', financials.columns[previous]]

            gross_margin_curr = gross_profit_curr / revenue_curr
            gross_margin_prev = gross_profit_prev / revenue_prev

            if gross_margin_curr > gross_margin_prev:
                score += 1
                breakdown['grossMarginIncrease'] = 1
                details.append(f'✓ Gross margin increased ({gross_margin_prev:.2%} → {gross_margin_curr:.2%})')
            else:
                breakdown['grossMarginIncrease'] = 0
                details.append(f'✗ Gross margin decreased ({gross_margin_prev:.2%} → {gross_margin_curr:.2%})')
        except:
            breakdown['grossMarginIncrease'] = 0
            details.append('✗ Gross margin data unavailable')

        # 9. Asset Turnover increased
        try:
            asset_turnover_curr = revenue_curr / total_assets_curr
            asset_turnover_prev = revenue_prev / total_assets_prev

            if asset_turnover_curr > asset_turnover_prev:
                score += 1
                breakdown['assetTurnoverIncrease'] = 1
                details.append(f'✓ Asset turnover increased ({asset_turnover_prev:.2f} → {asset_turnover_curr:.2f})')
            else:
                breakdown['assetTurnoverIncrease'] = 0
                details.append(f'✗ Asset turnover decreased ({asset_turnover_prev:.2f} → {asset_turnover_curr:.2f})')
        except:
            breakdown['assetTurnoverIncrease'] = 0
            details.append('✗ Asset turnover data unavailable')

        return {
            'score': score,
            'breakdown': breakdown,
            'details': details
        }

    except Exception as e:
        print(f'    ⚠️  Piotroski calculation error: {str(e)}')
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


def save_to_duckdb(symbol, fundamentals):
    """Save fundamentals to DuckDB (for forensic analysis)"""
    try:
        # Use the yahoo_fundamentals_fetcher to store in DuckDB
        # It will fetch fresh data and store it properly
        duckdb_fetcher.fetch_and_store(symbol)

        # Enrich XBRL data with Yahoo Finance data for forensic calculations
        # This adds market_cap and current_price to existing XBRL records
        print(f'  🔄 Enriching XBRL data with Yahoo Finance...')
        enrich_result = xbrl_enricher.enrich_symbol(symbol, verbose=False)
        if enrich_result['success']:
            print(f'  💾 Saved to DuckDB (enriched {enrich_result.get("enriched_count", 0)} XBRL records)')
        else:
            print(f'  💾 Saved to DuckDB (XBRL enrichment skipped)')
    except Exception as e:
        print(f'  ⚠️  DuckDB save failed: {str(e)}')


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

                # Save to DuckDB
                save_to_duckdb(symbol, fundamentals)

                # Display summary
                print(f'  ✅ {symbol} - {fundamental_analysis["rating"]} (Score: {fundamental_analysis["score"]})')
                if fundamentals.get('piotroskiScore') is not None:
                    print(f'     Piotroski: {fundamentals["piotroskiScore"]}/9', end='')
                else:
                    print(f'     Piotroski: N/A', end='')
                if fundamentals.get('trailingPE'):
                    print(f' | PE: {fundamentals["trailingPE"]:.2f}', end='')
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
        # Check if symbol provided as command line argument
        if len(sys.argv) > 1:
            # SINGLE SYMBOL MODE
            symbol = sys.argv[1].upper()

            # Remove NS_ prefix if present (we'll add it in save_to_firestore)
            symbol_clean = symbol.replace('NS_', '')

            print(f'🚀 Fetching Fundamentals for {symbol}\n')
            print('=' * 60)

            # Fetch fundamentals
            fundamentals = fetch_fundamentals(symbol_clean)

            if fundamentals is None:
                print(f'\n⚠️  No fundamental data available for {symbol}')
                print('    Possible reasons:')
                print('    - Market cap < 1000 Cr')
                print('    - Symbol not found on Yahoo Finance')
                print('    - No data available')
                sys.exit(1)

            # Calculate fundamental score
            fundamental_analysis = calculate_fundamental_score(fundamentals)
            fundamentals['fundamentalScore'] = fundamental_analysis['score']
            fundamentals['fundamentalRating'] = fundamental_analysis['rating']

            # Save to Firestore
            print(f'\n💾 Saving to Firestore...')
            save_to_firestore(symbol_clean, fundamentals)

            # Save to DuckDB
            save_to_duckdb(symbol_clean, fundamentals)

            # Display summary
            print('\n' + '=' * 60)
            print(f'✅ {symbol} - {fundamental_analysis["rating"]} (Score: {fundamental_analysis["score"]})')
            print('=' * 60)
            print(f'Company: {fundamentals.get("companyName", "N/A")}')
            print(f'Sector: {fundamentals.get("sector", "N/A")}')
            if fundamentals.get('trailingPE'):
                print(f'P/E Ratio: {fundamentals["trailingPE"]:.2f}')
            if fundamentals.get('returnOnEquity'):
                print(f'ROE: {fundamentals["returnOnEquity"]:.1f}%')
            if fundamentals.get('debtToEquity'):
                print(f'D/E Ratio: {fundamentals["debtToEquity"]:.1f}')
            if fundamentals.get('piotroskiScore') is not None:
                print(f'Piotroski F-Score: {fundamentals["piotroskiScore"]}/9')
            if fundamentals.get('marketCap'):
                market_cap_cr = fundamentals['marketCap'] / 10_000_000
                print(f'Market Cap: ₹{market_cap_cr:.0f} Cr')
            print('=' * 60)

        else:
            # BATCH MODE (existing code)
            analyze_fundamentals()

        print('\n✅ Job completed')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Job failed: {str(e)}')
        sys.exit(1)
