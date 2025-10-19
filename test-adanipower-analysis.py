#!/usr/bin/env python3
"""
Complete analysis for ADANIPOWER - Tests all fundamental metrics and calculations
"""

import yfinance as yf
import firebase_admin
from firebase_admin import credentials, firestore
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
    pass

db = firestore.client()

def calculate_piotroski_score(ticker):
    """Calculate Piotroski F-Score"""
    try:
        financials = ticker.financials
        balance_sheet = ticker.balance_sheet
        cashflow = ticker.cashflow

        if financials is None or balance_sheet is None or cashflow is None:
            return None
        if financials.empty or balance_sheet.empty or cashflow.empty:
            return None
        if len(financials.columns) < 2:
            return None

        score = 0
        breakdown = {}
        details = []
        current = 0
        previous = 1

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

        # 3. ROA increased
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

        # 4. Quality of Earnings
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
        print(f'⚠️  Piotroski calculation error: {str(e)}')
        return None

def calculate_fundamental_score(fundamentals):
    """Calculate fundamental strength score (0-100)"""
    score = 0
    max_score = 0

    # PE Ratio
    if fundamentals.get('trailingPE') and fundamentals['trailingPE'] > 0:
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

    # ROE
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

    # Debt to Equity
    if fundamentals.get('debtToEquity') is not None:
        max_score += 10
        de = fundamentals['debtToEquity']
        if de < 0.5:
            score += 10
        elif 0.5 <= de < 1.0:
            score += 7
        elif 1.0 <= de < 2.0:
            score += 4
        else:
            score += 1

    # Profit Margins
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

    # Earnings Growth
    if fundamentals.get('earningsGrowth') is not None:
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

    # Revenue Growth
    if fundamentals.get('revenueGrowth') is not None:
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

    # Current Ratio
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

    # Operating Margins
    if fundamentals.get('operatingMargins'):
        max_score += 10
        om = fundamentals['operatingMargins']
        if om >= 25:
            score += 10
        elif 20 <= om < 25:
            score += 8
        elif 15 <= om < 20:
            score += 6
        elif 10 <= om < 15:
            score += 4
        else:
            score += 2

    if max_score > 0:
        normalized_score = round((score / max_score) * 100, 1)
    else:
        normalized_score = 0

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

    return {'score': normalized_score, 'rating': rating}

# Main analysis
symbol = 'ADANIPOWER'
print('=' * 80)
print(f'🔍 COMPLETE FUNDAMENTAL ANALYSIS - {symbol}')
print('=' * 80)

ticker = yf.Ticker(f'{symbol}.NS')
info = ticker.info

# Extract fundamentals
trailing_eps = info.get('trailingEps', None)
book_value = info.get('bookValue', None)
current_price = info.get('currentPrice', None) or info.get('regularMarketPrice', None)

graham_number = None
price_to_graham = None
if trailing_eps and book_value and trailing_eps > 0 and book_value > 0:
    graham_number = round((22.5 * trailing_eps * book_value) ** 0.5, 2)
    if current_price and graham_number > 0:
        price_to_graham = round(current_price / graham_number, 2)

fundamentals = {
    'trailingPE': info.get('trailingPE', None),
    'forwardPE': info.get('forwardPE', None),
    'priceToBook': info.get('priceToBook', None),
    'priceToSales': info.get('priceToSalesTrailing12Months', None),
    'grahamNumber': graham_number,
    'priceToGraham': price_to_graham,
    'debtToEquity': info.get('debtToEquity', None),
    'currentRatio': info.get('currentRatio', None),
    'quickRatio': info.get('quickRatio', None),
    'returnOnEquity': info.get('returnOnEquity', None),
    'returnOnAssets': info.get('returnOnAssets', None),
    'profitMargins': info.get('profitMargins', None),
    'operatingMargins': info.get('operatingMargins', None),
    'earningsGrowth': info.get('earningsGrowth', None),
    'revenueGrowth': info.get('revenueGrowth', None),
    'earningsQuarterlyGrowth': info.get('earningsQuarterlyGrowth', None),
    'dividendYield': info.get('dividendYield', None),
    'payoutRatio': info.get('payoutRatio', None),
    'marketCap': info.get('marketCap', None),
    'beta': info.get('beta', None),
    'sector': info.get('sector', None),
    'industry': info.get('industry', None),
    'companyName': info.get('longName', None) or info.get('shortName', None),
    'longBusinessSummary': info.get('longBusinessSummary', None),
}

# Convert percentages
percentage_fields = ['returnOnEquity', 'returnOnAssets', 'profitMargins', 'operatingMargins',
                    'earningsGrowth', 'revenueGrowth', 'earningsQuarterlyGrowth', 'dividendYield', 'payoutRatio']

for field in percentage_fields:
    if fundamentals[field] is not None and isinstance(fundamentals[field], (int, float)):
        if fundamentals[field] == 0:
            fundamentals[field] = None
        else:
            fundamentals[field] = round(fundamentals[field] * 100, 2)

# Convert Debt-to-Equity
if fundamentals['debtToEquity'] is not None:
    fundamentals['debtToEquity'] = round(fundamentals['debtToEquity'] / 100, 2)

# Calculate Piotroski
piotroski = calculate_piotroski_score(ticker)
if piotroski:
    fundamentals['piotroskiScore'] = piotroski['score']
    fundamentals['piotroskiBreakdown'] = piotroski['breakdown']
    fundamentals['piotroskiDetails'] = piotroski['details']

# Calculate fundamental score
fund_score = calculate_fundamental_score(fundamentals)
fundamentals['fundamentalScore'] = fund_score['score']
fundamentals['fundamentalRating'] = fund_score['rating']

# Display results
print(f'\n🏢 {fundamentals["companyName"]}')
print(f'   Sector: {fundamentals["sector"]}')
print(f'   Industry: {fundamentals["industry"]}')
print(f'   Market Cap: ₹{fundamentals["marketCap"] / 10000000:.0f} Cr')

print(f'\n💯 SCORES:')
print(f'   Fundamental Score: {fundamentals["fundamentalScore"]}/100 ({fundamentals["fundamentalRating"]})')
if fundamentals.get('piotroskiScore') is not None:
    print(f'   Piotroski F-Score: {fundamentals["piotroskiScore"]}/9')

print(f'\n💰 VALUATION:')
print(f'   Trailing P/E: {fundamentals["trailingPE"]}')
print(f'   Forward P/E: {fundamentals["forwardPE"]}')
print(f'   P/B: {fundamentals["priceToBook"]}')
print(f'   P/S: {fundamentals["priceToSales"]}')
if graham_number:
    print(f'   Graham Number: ₹{graham_number}')
    print(f'   Price/Graham: {price_to_graham}')

print(f'\n📈 PROFITABILITY:')
print(f'   ROE: {fundamentals["returnOnEquity"]}%')
print(f'   ROA: {fundamentals["returnOnAssets"]}%')
print(f'   Net Margin: {fundamentals["profitMargins"]}%')
print(f'   Operating Margin: {fundamentals["operatingMargins"]}%')

print(f'\n💪 FINANCIAL HEALTH:')
print(f'   Debt/Equity: {fundamentals["debtToEquity"]}')
print(f'   Current Ratio: {fundamentals["currentRatio"]}')
print(f'   Beta: {fundamentals["beta"]}')

print(f'\n🚀 GROWTH:')
print(f'   Earnings Growth: {fundamentals["earningsGrowth"]}%')
print(f'   Revenue Growth: {fundamentals["revenueGrowth"]}%')
print(f'   Quarterly Growth: {fundamentals["earningsQuarterlyGrowth"]}%')

if piotroski:
    print(f'\n🔍 PIOTROSKI F-SCORE BREAKDOWN:')
    for detail in piotroski['details']:
        print(f'   {detail}')

print('\n' + '=' * 80)

# Save to Firestore
print('\n💾 Saving to Firestore...')
symbol_ref = db.collection('symbols').document(f'NS_{symbol}')
symbol_ref.set({
    'symbol': f'NS_{symbol}',
    'originalSymbol': symbol,
    'name': fundamentals['companyName'],
    'sector': fundamentals['sector'],
    'industry': fundamentals['industry'],
    'fundamental': {**fundamentals, 'symbol': symbol, 'updatedAt': firestore.SERVER_TIMESTAMP},
    'lastFetched': firestore.SERVER_TIMESTAMP
}, merge=True)

print(f'✅ Data saved to Firestore: symbols/NS_{symbol}')
print('=' * 80)
