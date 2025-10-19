#!/usr/bin/env python3
"""
Test script to analyze ADANIPOWER and verify all investment rules
"""

import yfinance as yf
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import sys
import os

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts'))

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

# Import functions from analyze-fundamentals script
from analyze_fundamentals import fetch_fundamentals, calculate_fundamental_score, calculate_piotroski_score, save_to_firestore

def test_adanipower():
    """Test ADANIPOWER analysis"""
    symbol = 'ADANIPOWER'

    print('=' * 80)
    print(f'🔍 TESTING ADANIPOWER ANALYSIS')
    print('=' * 80)
    print()

    # Fetch fundamentals
    print('📥 Fetching fundamental data from Yahoo Finance...')
    fundamentals = fetch_fundamentals(symbol)

    if fundamentals is None:
        print('❌ Failed to fetch fundamentals')
        sys.exit(1)

    # Calculate fundamental score
    print('\n📊 Calculating fundamental score...')
    fundamental_analysis = calculate_fundamental_score(fundamentals)
    fundamentals['fundamentalScore'] = fundamental_analysis['score']
    fundamentals['fundamentalRating'] = fundamental_analysis['rating']

    # Save to Firestore
    print('\n💾 Saving to Firestore...')
    save_to_firestore(symbol, fundamentals)

    print('\n' + '=' * 80)
    print('📊 ADANIPOWER FUNDAMENTAL ANALYSIS RESULTS')
    print('=' * 80)
    print()

    # Display key metrics
    print('🏢 COMPANY INFO:')
    print(f'   Name: {fundamentals.get("companyName", "N/A")}')
    print(f'   Sector: {fundamentals.get("sector", "N/A")}')
    print(f'   Industry: {fundamentals.get("industry", "N/A")}')
    print(f'   Market Cap: ₹{fundamentals.get("marketCap", 0) / 10000000:.0f} Cr')
    print()

    print('💯 OVERALL SCORE:')
    print(f'   Fundamental Score: {fundamentals["fundamentalScore"]}/100')
    print(f'   Rating: {fundamentals["fundamentalRating"]}')
    if fundamentals.get('piotroskiScore') is not None:
        print(f'   Piotroski F-Score: {fundamentals["piotroskiScore"]}/9')
    print()

    print('💰 VALUATION METRICS:')
    print(f'   P/E Ratio (Trailing): {fundamentals.get("trailingPE", "N/A")}')
    print(f'   P/E Ratio (Forward): {fundamentals.get("forwardPE", "N/A")}')
    print(f'   P/B Ratio: {fundamentals.get("priceToBook", "N/A")}')
    print(f'   P/S Ratio: {fundamentals.get("priceToSales", "N/A")}')
    if fundamentals.get('grahamNumber'):
        print(f'   Graham Number: ₹{fundamentals["grahamNumber"]}')
        print(f'   Price/Graham: {fundamentals.get("priceToGraham", "N/A")}')
    print()

    print('💪 FINANCIAL HEALTH:')
    print(f'   Debt/Equity: {fundamentals.get("debtToEquity", "N/A")}')
    print(f'   Current Ratio: {fundamentals.get("currentRatio", "N/A")}')
    print(f'   Quick Ratio: {fundamentals.get("quickRatio", "N/A")}')
    print()

    print('📈 PROFITABILITY:')
    print(f'   ROE: {fundamentals.get("returnOnEquity", "N/A")}%')
    print(f'   ROA: {fundamentals.get("returnOnAssets", "N/A")}%')
    print(f'   Net Profit Margin: {fundamentals.get("profitMargins", "N/A")}%')
    print(f'   Operating Margin: {fundamentals.get("operatingMargins", "N/A")}%')
    print()

    print('🚀 GROWTH:')
    print(f'   Earnings Growth: {fundamentals.get("earningsGrowth", "N/A")}%')
    print(f'   Revenue Growth: {fundamentals.get("revenueGrowth", "N/A")}%')
    print(f'   Quarterly Earnings Growth: {fundamentals.get("earningsQuarterlyGrowth", "N/A")}%')
    print()

    print('💵 DIVIDENDS:')
    print(f'   Dividend Yield: {fundamentals.get("dividendYield", "N/A")}%')
    print(f'   Payout Ratio: {fundamentals.get("payoutRatio", "N/A")}%')
    print()

    # Piotroski breakdown
    if fundamentals.get('piotroskiDetails'):
        print('🔍 PIOTROSKI F-SCORE DETAILS:')
        for detail in fundamentals['piotroskiDetails']:
            print(f'   {detail}')
        print()

    print('=' * 80)
    print('✅ ANALYSIS COMPLETE')
    print('=' * 80)

    # Now check investment rules
    print('\n' + '=' * 80)
    print('📋 CHECKING INVESTMENT RULES')
    print('=' * 80)
    print()

    print('📊 Value Investor Rules:')
    print('   Required conditions:')
    print(f'   ✓ P/B < 5.0: {fundamentals.get("priceToBook", 999)} {"✓" if fundamentals.get("priceToBook", 999) < 5.0 else "✗"}')
    print(f'   ✓ P/S < 5.0: {fundamentals.get("priceToSales", 999)} {"✓" if fundamentals.get("priceToSales", 999) < 5.0 else "✗"}')
    print(f'   ✓ Forward P/E < 20: {fundamentals.get("forwardPE", 999)} {"✓" if fundamentals.get("forwardPE", 999) and fundamentals.get("forwardPE", 999) < 20 else "✗"}')
    print(f'   ✓ Trailing P/E < 25: {fundamentals.get("trailingPE", 999)} {"✓" if fundamentals.get("trailingPE", 999) and fundamentals.get("trailingPE", 999) < 25 else "✗"}')
    print(f'   ✓ Fundamental Score >= 60: {fundamentals.get("fundamentalScore", 0)} {"✓" if fundamentals.get("fundamentalScore", 0) >= 60 else "✗"}')
    print(f'   ✓ Profit Margin >= 15%: {fundamentals.get("profitMargins", 0)} {"✓" if fundamentals.get("profitMargins", 0) >= 15 else "✗"}')
    print(f'   ✓ Operating Margin >= 20%: {fundamentals.get("operatingMargins", 0)} {"✓" if fundamentals.get("operatingMargins", 0) >= 20 else "✗"}')
    print(f'   ✓ Debt/Equity < 1.0: {fundamentals.get("debtToEquity", 999)} {"✓" if fundamentals.get("debtToEquity", 999) < 1.0 else "✗"}')
    print()

    return fundamentals

if __name__ == '__main__':
    try:
        fundamentals = test_adanipower()
        print('\n✅ Test completed successfully')
        sys.exit(0)
    except Exception as e:
        print(f'\n❌ Test failed: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
