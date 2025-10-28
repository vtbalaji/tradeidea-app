#!/usr/bin/env -S venv/bin/python3
"""
Yahoo Finance Historical Fundamentals Fetcher

Fetches quarterly and annual fundamental data from Yahoo Finance for Indian stocks.
Stores all historical data in DuckDB for time-series analysis and PEG calculations.

Usage:
    from yahoo_fundamentals_fetcher import YahooFundamentalsFetcher

    fetcher = YahooFundamentalsFetcher()
    fetcher.fetch_and_store('RELIANCE')
    fetcher.close()
"""

import yfinance as yf
import duckdb
import os
from datetime import datetime
import pandas as pd


class YahooFundamentalsFetcher:
    """Fetch and store Yahoo Finance fundamental data in DuckDB"""

    def __init__(self, db_path=None):
        """Initialize with DuckDB connection"""
        if db_path is None:
            db_path = os.path.join(os.getcwd(), 'data', 'fundamentals.duckdb')

        os.makedirs(os.path.dirname(db_path), exist_ok=True)

        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        self._init_yahoo_schema()

    def _init_yahoo_schema(self):
        """Create Yahoo Finance specific tables"""

        # Yahoo quarterly fundamentals table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS yahoo_quarterly_fundamentals (
                symbol VARCHAR NOT NULL,
                end_date DATE NOT NULL,
                period VARCHAR NOT NULL,  -- e.g., '2024Q1', '2023Q4'

                -- Income Statement (₹ Crores)
                revenue_cr DOUBLE,
                operating_income_cr DOUBLE,
                ebitda_cr DOUBLE,
                net_income_cr DOUBLE,

                -- Per Share Metrics
                eps DOUBLE,
                diluted_eps DOUBLE,

                -- Balance Sheet (₹ Crores)
                total_assets_cr DOUBLE,
                total_equity_cr DOUBLE,
                total_debt_cr DOUBLE,
                cash_cr DOUBLE,
                current_assets_cr DOUBLE,
                current_liabilities_cr DOUBLE,

                -- Shares
                shares_outstanding_cr DOUBLE,

                -- Growth Metrics (YoY %)
                revenue_growth_yoy DOUBLE,
                earnings_growth_yoy DOUBLE,

                -- Metadata
                source VARCHAR DEFAULT 'yahoo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (symbol, end_date)
            )
        """)

        # Yahoo current fundamentals (latest snapshot)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS yahoo_current_fundamentals (
                symbol VARCHAR NOT NULL PRIMARY KEY,

                -- Valuation Ratios
                trailing_pe DOUBLE,
                forward_pe DOUBLE,
                peg_ratio DOUBLE,  -- Yahoo's PEG (usually unreliable for India)
                price_to_book DOUBLE,
                price_to_sales DOUBLE,
                enterprise_to_ebitda DOUBLE,

                -- Profitability (%)
                profit_margins DOUBLE,
                operating_margins DOUBLE,
                roe DOUBLE,
                roa DOUBLE,

                -- Financial Health
                debt_to_equity DOUBLE,
                current_ratio DOUBLE,
                quick_ratio DOUBLE,

                -- Growth Estimates (%)
                earnings_growth DOUBLE,       -- Yahoo's estimate
                revenue_growth DOUBLE,
                earnings_quarterly_growth DOUBLE,

                -- Market Data
                market_cap DOUBLE,
                enterprise_value DOUBLE,
                current_price DOUBLE,
                beta DOUBLE,

                -- Analyst Data
                target_mean_price DOUBLE,
                target_median_price DOUBLE,
                number_of_analyst_opinions INTEGER,

                -- Metadata
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Index for efficient queries
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_yahoo_quarterly_symbol_date
            ON yahoo_quarterly_fundamentals(symbol, end_date DESC)
        """)

        print('✅ Yahoo Finance schema initialized')

    def fetch_and_store(self, symbol: str, verbose: bool = True) -> bool:
        """
        Fetch all historical quarterly data from Yahoo Finance and store in DuckDB

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            verbose: Print progress messages

        Returns:
            True if successful, False otherwise
        """
        try:
            ticker = yf.Ticker(f"{symbol}.NS")

            # Fetch quarterly financials
            if verbose:
                print(f'\n📊 Fetching Yahoo Finance data for {symbol}...')

            # Get quarterly income statement
            quarterly_income = ticker.quarterly_income_stmt

            # Get quarterly balance sheet
            quarterly_balance = ticker.quarterly_balance_sheet

            # Get current info snapshot
            info = ticker.info

            if quarterly_income is None or quarterly_income.empty:
                print(f'  ⚠️  No quarterly data available for {symbol}')
                return False

            # Store current snapshot first
            self._store_current_snapshot(symbol, info)

            # Process each quarter
            quarters_stored = 0

            for date in quarterly_income.columns:
                try:
                    # Extract income statement data
                    income_data = quarterly_income[date]

                    # Extract balance sheet data (if available for this date)
                    balance_data = None
                    if quarterly_balance is not None and date in quarterly_balance.columns:
                        balance_data = quarterly_balance[date]

                    # Convert to crores (1 Cr = 10 million)
                    revenue_cr = self._to_crores(income_data.get('Total Revenue'))
                    operating_income_cr = self._to_crores(income_data.get('Operating Income'))
                    ebitda_cr = self._to_crores(income_data.get('EBITDA'))
                    net_income_cr = self._to_crores(income_data.get('Net Income'))

                    # Balance sheet data
                    total_assets_cr = self._to_crores(balance_data.get('Total Assets')) if balance_data is not None else None
                    total_equity_cr = self._to_crores(balance_data.get('Stockholders Equity')) if balance_data is not None else None
                    total_debt_cr = self._to_crores(balance_data.get('Total Debt')) if balance_data is not None else None
                    cash_cr = self._to_crores(balance_data.get('Cash And Cash Equivalents')) if balance_data is not None else None
                    current_assets_cr = self._to_crores(balance_data.get('Current Assets')) if balance_data is not None else None
                    current_liabilities_cr = self._to_crores(balance_data.get('Current Liabilities')) if balance_data is not None else None
                    shares_outstanding_cr = self._to_crores(balance_data.get('Ordinary Shares Number')) if balance_data is not None else None

                    # Calculate EPS if we have the data
                    eps = None
                    if net_income_cr and shares_outstanding_cr and shares_outstanding_cr > 0:
                        eps = net_income_cr / shares_outstanding_cr  # EPS in ₹

                    # Generate period identifier (e.g., '2024Q1')
                    period = self._generate_period(date)

                    # Calculate YoY growth if we have previous year data
                    revenue_growth_yoy = self._calculate_yoy_growth(symbol, date, revenue_cr, 'revenue')
                    earnings_growth_yoy = self._calculate_yoy_growth(symbol, date, net_income_cr, 'earnings')

                    # Store in DuckDB
                    self.conn.execute("""
                        INSERT OR REPLACE INTO yahoo_quarterly_fundamentals
                        (symbol, end_date, period,
                         revenue_cr, operating_income_cr, ebitda_cr, net_income_cr,
                         eps, diluted_eps,
                         total_assets_cr, total_equity_cr, total_debt_cr, cash_cr,
                         current_assets_cr, current_liabilities_cr, shares_outstanding_cr,
                         revenue_growth_yoy, earnings_growth_yoy,
                         source, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'yahoo', CURRENT_TIMESTAMP)
                    """, [
                        symbol, date.date(), period,
                        revenue_cr, operating_income_cr, ebitda_cr, net_income_cr,
                        eps, None,  # diluted_eps not readily available
                        total_assets_cr, total_equity_cr, total_debt_cr, cash_cr,
                        current_assets_cr, current_liabilities_cr, shares_outstanding_cr,
                        revenue_growth_yoy, earnings_growth_yoy
                    ])

                    quarters_stored += 1

                except Exception as e:
                    if verbose:
                        print(f'  ⚠️  Error processing quarter {date}: {e}')
                    continue

            if verbose:
                print(f'  ✅ Stored {quarters_stored} quarters in DuckDB')

            return True

        except Exception as e:
            print(f'  ❌ Error fetching Yahoo data for {symbol}: {e}')
            return False

    def _store_current_snapshot(self, symbol: str, info: dict):
        """Store current fundamental snapshot from Yahoo info"""

        try:
            self.conn.execute("""
                INSERT OR REPLACE INTO yahoo_current_fundamentals
                (symbol, trailing_pe, forward_pe, peg_ratio, price_to_book, price_to_sales,
                 enterprise_to_ebitda, profit_margins, operating_margins, roe, roa,
                 debt_to_equity, current_ratio, quick_ratio,
                 earnings_growth, revenue_growth, earnings_quarterly_growth,
                 market_cap, enterprise_value, current_price, beta,
                 target_mean_price, target_median_price, number_of_analyst_opinions,
                 last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, [
                symbol,
                info.get('trailingPE'),
                info.get('forwardPE'),
                info.get('pegRatio'),
                info.get('priceToBook'),
                info.get('priceToSalesTrailing12Months'),
                info.get('enterpriseToEbitda'),
                info.get('profitMargins'),
                info.get('operatingMargins'),
                info.get('returnOnEquity'),
                info.get('returnOnAssets'),
                info.get('debtToEquity') / 100 if info.get('debtToEquity') else None,  # Convert to ratio
                info.get('currentRatio'),
                info.get('quickRatio'),
                info.get('earningsGrowth'),
                info.get('revenueGrowth'),
                info.get('earningsQuarterlyGrowth'),
                info.get('marketCap'),
                info.get('enterpriseValue'),
                info.get('currentPrice') or info.get('regularMarketPrice'),
                info.get('beta'),
                info.get('targetMeanPrice'),
                info.get('targetMedianPrice'),
                info.get('numberOfAnalystOpinions')
            ])

        except Exception as e:
            print(f'  ⚠️  Error storing current snapshot: {e}')

    def _to_crores(self, value) -> float:
        """Convert value to crores (1 Cr = 10 million)"""
        if value is None or pd.isna(value):
            return None
        return round(float(value) / 10_000_000, 2)

    def _generate_period(self, date) -> str:
        """Generate period identifier like '2024Q1'"""
        year = date.year
        month = date.month

        # Determine quarter based on month
        if month <= 3:
            quarter = 'Q4'  # Jan-Mar (Indian FY ending)
        elif month <= 6:
            quarter = 'Q1'  # Apr-Jun
        elif month <= 9:
            quarter = 'Q2'  # Jul-Sep
        else:
            quarter = 'Q3'  # Oct-Dec

        return f'{year}{quarter}'

    def _calculate_yoy_growth(self, symbol: str, current_date, current_value: float, metric: str) -> float:
        """Calculate year-over-year growth percentage"""
        if current_value is None:
            return None

        try:
            # Get value from 1 year ago (approximately 4 quarters)
            column_name = 'revenue_cr' if metric == 'revenue' else 'net_income_cr'

            result = self.conn.execute(f"""
                SELECT {column_name}
                FROM yahoo_quarterly_fundamentals
                WHERE symbol = ?
                  AND end_date < ?
                  AND {column_name} IS NOT NULL
                ORDER BY end_date DESC
                LIMIT 1 OFFSET 3  -- 4 quarters ago
            """, [symbol, current_date.date()]).fetchone()

            if result and result[0] and result[0] > 0:
                previous_value = result[0]
                growth = ((current_value - previous_value) / previous_value) * 100
                return round(growth, 2)

        except Exception:
            pass

        return None

    def get_quarterly_data(self, symbol: str, limit: int = 12):
        """Get quarterly historical data for a symbol"""
        result = self.conn.execute("""
            SELECT * FROM yahoo_quarterly_fundamentals
            WHERE symbol = ?
            ORDER BY end_date DESC
            LIMIT ?
        """, [symbol, limit]).fetchall()

        if not result:
            return []

        columns = [desc[0] for desc in self.conn.description]
        return [dict(zip(columns, row)) for row in result]

    def get_current_fundamentals(self, symbol: str):
        """Get current fundamental snapshot for a symbol"""
        result = self.conn.execute("""
            SELECT * FROM yahoo_current_fundamentals
            WHERE symbol = ?
        """, [symbol]).fetchone()

        if not result:
            return None

        columns = [desc[0] for desc in self.conn.description]
        return dict(zip(columns, result))

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print('✅ Database connection closed')


# Example usage
if __name__ == '__main__':
    import sys

    fetcher = YahooFundamentalsFetcher()

    # Test with a few symbols
    test_symbols = ['RELIANCE', 'TCS', 'INFY'] if len(sys.argv) == 1 else sys.argv[1:]

    for symbol in test_symbols:
        success = fetcher.fetch_and_store(symbol)

        if success:
            # Show summary
            data = fetcher.get_quarterly_data(symbol, limit=4)
            print(f'\n  Latest quarters for {symbol}:')
            for q in data:
                revenue = f'₹{q["revenue_cr"]:.0f}Cr' if q["revenue_cr"] else 'N/A'
                profit = f'₹{q["net_income_cr"]:.0f}Cr' if q["net_income_cr"] else 'N/A'
                eps = f'₹{q["eps"]:.2f}' if q["eps"] else 'N/A'
                print(f'    {q["period"]} - Revenue: {revenue}, Profit: {profit}, EPS: {eps}')

    fetcher.close()
