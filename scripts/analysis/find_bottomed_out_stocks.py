#!/usr/bin/env python3
"""
Bottomed Out Stocks Finder

Usage:
    # Using venv:
    ./venv/bin/python3 scripts/find_bottomed_out_stocks.py

    # Using system Python:
    python3 scripts/find_bottomed_out_stocks.py

Identifies stocks that have:
1. Gone up significantly
2. Come down from peak
3. Now consolidating/maintaining at a certain support level
4. Optional: Filter by Graham Score (undervalued/average)

Example stocks: TRENT, DELTACORP

All data sourced from DuckDB:
- OHLCV data: data/eod.duckdb
- Fundamental data: data/fundamentals.duckdb
"""

import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

class BottomedOutStockFinder:
    def __init__(self,
                 eod_db_path='data/eod.duckdb',
                 fund_db_path='data/fundamentals.duckdb'):
        """Initialize with DuckDB connections"""
        self.eod_conn = duckdb.connect(eod_db_path, read_only=True)
        self.fund_conn = duckdb.connect(fund_db_path, read_only=True)

    def get_price_data(self, symbol: str, days: int = 365) -> pd.DataFrame:
        """Get OHLCV data for a symbol from DuckDB"""
        query = f"""
            SELECT date, open, high, low, close, volume
            FROM ohlcv
            WHERE symbol = '{symbol}'
            AND date >= CURRENT_DATE - INTERVAL '{days} days'
            ORDER BY date ASC
        """
        df = self.eod_conn.execute(query).fetchdf()
        if not df.empty:
            df['date'] = pd.to_datetime(df['date'])
        return df

    def get_fundamental_data(self, symbol: str) -> Dict:
        """Get fundamental data for Graham Score calculation"""
        query = f"""
            SELECT
                symbol,
                trailing_pe,
                price_to_book,
                market_cap,
                profit_margins,
                roe,
                current_price,
                debt_to_equity,
                current_ratio
            FROM yahoo_current_fundamentals
            WHERE symbol = '{symbol}'
        """
        result = self.fund_conn.execute(query).fetchdf()

        if result.empty:
            return {}

        return result.iloc[0].to_dict()

    def calculate_graham_score(self, fundamental: Dict) -> Tuple[float, str]:
        """
        Calculate simplified Graham Score
        Returns: (score, rating)

        Graham Score Components:
        - PE Ratio < 22.5 (Benjamin Graham's guideline)
        - P/B Ratio < 2.5
        - Debt to Equity < 1.0 (bonus)
        - Current Ratio > 2.0 (bonus)

        Rating: Undervalued, Average, Overvalued
        """
        if not fundamental:
            return 0, "Unknown"

        score = 0
        pe = fundamental.get('trailing_pe', None)
        pb = fundamental.get('price_to_book', None)
        de = fundamental.get('debt_to_equity', None)
        cr = fundamental.get('current_ratio', None)

        # PE Ratio scoring
        if pe and not np.isnan(pe):
            if pe < 15:
                score += 3
            elif pe < 22.5:
                score += 2
            elif pe < 30:
                score += 1

        # P/B Ratio scoring
        if pb and not np.isnan(pb):
            if pb < 1.5:
                score += 3
            elif pb < 2.5:
                score += 2
            elif pb < 4:
                score += 1

        # Debt to Equity (bonus)
        if de and not np.isnan(de):
            if de < 0.5:
                score += 1
            elif de < 1.0:
                score += 0.5

        # Current Ratio (bonus)
        if cr and not np.isnan(cr):
            if cr > 2.0:
                score += 1
            elif cr > 1.5:
                score += 0.5

        # Rating based on score
        if score >= 6:
            rating = "Undervalued"
        elif score >= 4:
            rating = "Average"
        elif score >= 2:
            rating = "Fair"
        else:
            rating = "Overvalued"

        return score, rating

    def check_ma_crossover_and_green_candles(self, df: pd.DataFrame) -> Dict:
        """
        Check for turnaround buy signal:
        1. Stock crossed above 50-day MA recently (last 10 days)
        2. Last 2 candles are green (close > open)

        Returns dict with signal info or None
        """
        if len(df) < 60:  # Need at least 60 days for 50-MA
            return None

        # Calculate 50-day MA
        df = df.copy()
        df['ma50'] = df['close'].rolling(window=50).mean()

        # Check last 2 candles are green
        if len(df) >= 2:
            last_candle_green = df['close'].iloc[-1] > df['open'].iloc[-1]
            second_last_green = df['close'].iloc[-2] > df['open'].iloc[-2]
            two_green_candles = last_candle_green and second_last_green
        else:
            return None

        if not two_green_candles:
            return None

        # Check if crossed above 50-MA in last 10 days
        crossed_above_ma = False
        cross_days_ago = None

        recent_10 = df.tail(10).reset_index(drop=True)

        for i in range(1, len(recent_10)):
            if pd.isna(recent_10['ma50'].iloc[i]) or pd.isna(recent_10['ma50'].iloc[i-1]):
                continue

            prev_below = recent_10['close'].iloc[i-1] <= recent_10['ma50'].iloc[i-1]
            curr_above = recent_10['close'].iloc[i] > recent_10['ma50'].iloc[i]

            if prev_below and curr_above:
                crossed_above_ma = True
                cross_days_ago = len(recent_10) - i - 1
                break

        if not crossed_above_ma:
            return None

        # Calculate metrics
        current_price = df['close'].iloc[-1]
        ma50_value = df['ma50'].iloc[-1]
        distance_from_ma = ((current_price - ma50_value) / ma50_value) * 100

        return {
            'has_signal': True,
            'crossed_ma_days_ago': cross_days_ago,
            'ma50_value': ma50_value,
            'distance_from_ma_pct': distance_from_ma,
            'two_green_candles': True
        }

    def analyze_price_pattern(self, df: pd.DataFrame) -> Dict:
        """
        Analyze if stock shows bottomed out pattern:
        1. Find peak in last 3-12 months
        2. Check for significant decline from peak
        3. Check if consolidating at support level recently
        4. Calculate consolidation duration (days in the box)
        """
        if len(df) < 90:  # Need at least 3 months of data
            return None

        current_price = df['close'].iloc[-1]

        # Find peak in last 3-12 months (60-250 trading days)
        lookback_start = max(60, len(df) - 250)
        lookback_end = len(df) - 30  # At least 30 days ago

        if lookback_end <= lookback_start:
            return None

        peak_window = df.iloc[lookback_start:lookback_end]
        peak_price = peak_window['close'].max()
        peak_date = peak_window.loc[peak_window['close'] == peak_price, 'date'].iloc[0]

        # Calculate decline from peak
        decline_pct = ((peak_price - current_price) / peak_price) * 100

        # Check if significant decline (at least 15%)
        if decline_pct < 15:
            return None

        # Analyze recent consolidation (last 30-60 days)
        consolidation_window = df.iloc[-60:]
        recent_prices = consolidation_window['close']

        # Check if price is consolidating (low volatility)
        price_range_pct = ((recent_prices.max() - recent_prices.min()) / recent_prices.mean()) * 100
        price_std = recent_prices.std()
        price_cv = (price_std / recent_prices.mean()) * 100  # Coefficient of variation

        # Find support level (lowest low in consolidation period)
        support_level = consolidation_window['low'].min()
        support_date = consolidation_window.loc[consolidation_window['low'] == support_level, 'date'].iloc[0]

        # Calculate how close current price is to support
        distance_from_support = ((current_price - support_level) / support_level) * 100

        # Check if consolidating (price range < 20% and CV < 10%)
        is_consolidating = price_range_pct < 20 and price_cv < 10

        # Check if near support (within 10% above support)
        near_support = distance_from_support < 10

        # Recovery potential (how much it can bounce back)
        recovery_potential = ((peak_price - current_price) / current_price) * 100

        # === NEW: Calculate consolidation duration (days in the box) ===

        # Define the "box" as the consolidation range
        box_high = recent_prices.max()
        box_low = recent_prices.min()
        box_range = box_high - box_low
        box_range_pct = (box_range / recent_prices.mean()) * 100

        # Find when consolidation started (when price first entered current range)
        # Working backwards from current, find when price was outside the box
        consolidation_start_idx = len(df) - 1
        tolerance = box_range * 0.15  # 15% tolerance for box boundaries

        for i in range(len(df) - 1, max(0, len(df) - 180), -1):  # Look back up to 180 days
            price = df.iloc[i]['close']
            # Check if price was significantly outside the current box
            if price > (box_high + tolerance) or price < (box_low - tolerance):
                consolidation_start_idx = i + 1
                break

        consolidation_start_date = df.iloc[consolidation_start_idx]['date']
        days_in_box = (df['date'].iloc[-1] - consolidation_start_date).days

        # Count how many times support was tested
        # Support test = when low is within 2% of support level
        support_tolerance = support_level * 0.02
        support_tests = 0

        for i in range(consolidation_start_idx, len(df)):
            if abs(df.iloc[i]['low'] - support_level) <= support_tolerance:
                support_tests += 1

        # Calculate days at/near support (within 5% of support)
        days_near_support = 0
        support_near_tolerance = support_level * 0.05

        for i in range(consolidation_start_idx, len(df)):
            if df.iloc[i]['close'] <= (support_level + support_near_tolerance):
                days_near_support += 1

        return {
            'current_price': current_price,
            'peak_price': peak_price,
            'peak_date': peak_date,
            'decline_pct': decline_pct,
            'support_level': support_level,
            'support_date': support_date,
            'distance_from_support': distance_from_support,
            'is_consolidating': is_consolidating,
            'near_support': near_support,
            'price_range_pct': price_range_pct,
            'price_cv': price_cv,
            'recovery_potential': recovery_potential,
            'days_since_peak': (df['date'].iloc[-1] - peak_date).days,
            # New consolidation metrics
            'days_in_box': days_in_box,
            'consolidation_start_date': consolidation_start_date,
            'box_high': box_high,
            'box_low': box_low,
            'box_range_pct': box_range_pct,
            'support_tests': support_tests,
            'days_near_support': days_near_support
        }

    def find_bottomed_out_stocks(self,
                                  min_market_cap: float = 1000,  # In crores
                                  graham_filter: str = None,  # 'undervalued', 'average', or None
                                  min_decline_pct: float = 15.0,
                                  max_distance_from_support: float = 10.0,
                                  filter_ma_crossover: bool = False) -> pd.DataFrame:
        """
        Find all bottomed out stocks based on criteria

        Args:
            min_market_cap: Minimum market cap in crores (default 1000)
            graham_filter: Filter by Graham Score ('undervalued', 'average', or None for all)
            min_decline_pct: Minimum decline from peak percentage
            max_distance_from_support: Maximum distance from support level
            filter_ma_crossover: If True, only show stocks that crossed 50MA with 2 green candles
        """
        # Get all symbols with market cap filter
        symbols_query = f"""
            SELECT DISTINCT symbol, market_cap
            FROM yahoo_current_fundamentals
            WHERE market_cap >= {min_market_cap * 10000000}
            ORDER BY market_cap DESC
        """
        symbols_df = self.fund_conn.execute(symbols_query).fetchdf()

        print(f"📊 Analyzing {len(symbols_df)} symbols...")
        print(f"   Min Market Cap: ₹{min_market_cap} Cr")
        print(f"   Min Decline: {min_decline_pct}%")
        print(f"   Max Distance from Support: {max_distance_from_support}%")
        if graham_filter:
            print(f"   Graham Filter: {graham_filter.upper()}")
        if filter_ma_crossover:
            print(f"   🚀 MA CROSSOVER FILTER: ON (Crossed 50MA + 2 Green Candles)")
        print()

        results = []

        for idx, row in symbols_df.iterrows():
            symbol = row['symbol']

            try:
                # Get price data
                df = self.get_price_data(symbol, days=365)
                if df.empty or len(df) < 90:
                    continue

                # Analyze price pattern
                pattern = self.analyze_price_pattern(df)
                if not pattern:
                    continue

                # Check if meets decline criteria
                if pattern['decline_pct'] < min_decline_pct:
                    continue

                # Check if consolidating near support
                if not pattern['is_consolidating']:
                    continue

                if pattern['distance_from_support'] > max_distance_from_support:
                    continue

                # Check MA crossover filter if enabled
                ma_signal = None
                if filter_ma_crossover:
                    ma_signal = self.check_ma_crossover_and_green_candles(df)
                    if not ma_signal:
                        continue  # Skip if no MA crossover signal

                # Get fundamental data
                fundamental = self.get_fundamental_data(symbol)
                graham_score, graham_rating = self.calculate_graham_score(fundamental)

                # Apply Graham filter if specified
                if graham_filter:
                    if graham_filter.lower() == 'undervalued' and graham_rating != 'Undervalued':
                        continue
                    elif graham_filter.lower() == 'average' and graham_rating not in ['Average', 'Undervalued']:
                        continue

                # Compile results
                result = {
                    'Symbol': symbol,
                    'Current Price': round(pattern['current_price'], 2),
                    'Peak Price': round(pattern['peak_price'], 2),
                    'Decline %': round(pattern['decline_pct'], 2),
                    'Support Level': round(pattern['support_level'], 2),
                    'Distance from Support %': round(pattern['distance_from_support'], 2),
                    'Days in Box': pattern['days_in_box'],
                    'Support Tests': pattern['support_tests'],
                    'Days Near Support': pattern['days_near_support'],
                    'Box Range %': round(pattern['box_range_pct'], 2),
                    'Days Since Peak': pattern['days_since_peak'],
                    'Recovery Potential %': round(pattern['recovery_potential'], 2),
                    'Volatility (CV%)': round(pattern['price_cv'], 2),
                    'PE Ratio': round(fundamental.get('trailing_pe', 0), 2) if fundamental else 0,
                    'P/B Ratio': round(fundamental.get('price_to_book', 0), 2) if fundamental else 0,
                    'Graham Score': round(graham_score, 2),
                    'Graham Rating': graham_rating,
                    'Market Cap (Cr)': round(row['market_cap'] / 10000000, 2)
                }

                # Add MA crossover data if available
                if ma_signal:
                    result['50MA'] = round(ma_signal['ma50_value'], 2)
                    result['% Above MA'] = round(ma_signal['distance_from_ma_pct'], 2)
                    result['Crossed MA Days Ago'] = ma_signal['crossed_ma_days_ago']
                    result['Signal'] = '🚀 BUY'

                results.append(result)

                # Enhanced print output
                if ma_signal:
                    print(f"🚀 {symbol}: Decline {pattern['decline_pct']:.1f}%, Crossed 50MA {ma_signal['crossed_ma_days_ago']} days ago, "
                          f"{ma_signal['distance_from_ma_pct']:+.1f}% above MA, Graham: {graham_rating}")
                else:
                    print(f"✅ {symbol}: Decline {pattern['decline_pct']:.1f}%, {pattern['days_in_box']} days in box (Range {pattern['box_range_pct']:.1f}%), {pattern['support_tests']} support tests, Graham: {graham_rating}")

            except Exception as e:
                print(f"⚠️  {symbol}: {str(e)}")
                continue

        if not results:
            print("\n❌ No bottomed out stocks found matching criteria")
            return pd.DataFrame()

        df_results = pd.DataFrame(results)
        df_results = df_results.sort_values('Graham Score', ascending=False)

        return df_results

    def close(self):
        """Close database connections"""
        self.eod_conn.close()
        self.fund_conn.close()


def main():
    """Main execution"""
    print("=" * 80)
    print("🚀 BOTTOMED OUT STOCKS - TURNAROUND BUY SIGNALS")
    print("=" * 80)
    print()

    finder = BottomedOutStockFinder()

    # Find bottomed out stocks with MA crossover filter
    # Set filter_ma_crossover=True to only get stocks crossing 50MA with 2 green candles
    results = finder.find_bottomed_out_stocks(
        min_market_cap=500,  # Min 500 Cr market cap (relaxed)
        graham_filter=None,  # None, 'undervalued', or 'average'
        min_decline_pct=10.0,  # Minimum 10% decline from peak (relaxed)
        max_distance_from_support=15.0,  # Within 15% of support (relaxed)
        filter_ma_crossover=True  # 🚀 FILTER: Only stocks crossing 50MA + 2 green candles
    )

    if not results.empty:
        print("\n" + "=" * 80)
        print(f"🚀 FOUND {len(results)} TURNAROUND BUY SIGNALS")
        print("=" * 80)
        print()

        # Display with nice formatting
        pd.set_option('display.max_columns', None)
        pd.set_option('display.width', None)
        pd.set_option('display.max_colwidth', 20)

        print(results.to_string(index=False))

        print("\n" + "=" * 80)
        print("📊 SUMMARY BY GRAHAM RATING")
        print("=" * 80)
        print(results['Graham Rating'].value_counts())

        print("\n" + "=" * 80)
        print("🎯 TOP 10 TURNAROUND BUYS (Sorted by Graham Score)")
        print("=" * 80)
        # Check if MA columns exist
        if '50MA' in results.columns:
            top10 = results.head(10)[['Symbol', 'Signal', 'Current Price', '50MA', '% Above MA',
                                      'Crossed MA Days Ago', 'Decline %', 'Recovery Potential %',
                                      'Graham Score', 'Graham Rating']]
        else:
            top10 = results.head(10)[['Symbol', 'Current Price', 'Decline %', 'Days in Box',
                                      'Box Range %', 'Support Tests', 'Recovery Potential %',
                                      'Graham Score', 'Graham Rating']]
        print(top10.to_string(index=False))

        print("\n" + "=" * 80)
        print("💪 STRONGEST SIGNALS (Closest to 50MA)")
        print("=" * 80)
        if '% Above MA' in results.columns:
            strongest = results.nsmallest(10, '% Above MA')[['Symbol', 'Current Price', '50MA',
                                                              '% Above MA', 'Crossed MA Days Ago',
                                                              'Decline %', 'Graham Rating']]
            print(strongest.to_string(index=False))
        else:
            print("No MA crossover data available")

        print("\n" + "=" * 80)
        print("📦 LONGEST CONSOLIDATION (Days in Box)")
        print("=" * 80)
        if '% Above MA' in results.columns:
            longest_box = results.nlargest(10, 'Days in Box')[['Symbol', 'Days in Box', 'Box Range %',
                                                                 'Support Tests', '% Above MA',
                                                                 'Decline %', 'Graham Rating']]
        else:
            longest_box = results.nlargest(10, 'Days in Box')[['Symbol', 'Days in Box', 'Box Range %',
                                                                 'Support Tests', 'Days Near Support',
                                                                 'Decline %', 'Graham Rating']]
        print(longest_box.to_string(index=False))

    finder.close()
    print("\n✅ Done!")


if __name__ == '__main__':
    main()
