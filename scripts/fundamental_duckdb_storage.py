#!/usr/bin/env -S venv/bin/python3
"""
DuckDB Storage for Fundamental Data

Stores historical fundamental data (from XBRL) in DuckDB for efficient querying.
This allows tracking of fundamental metrics over time (quarterly/annual data).

Schema:
    - fundamentals table: All fundamental ratios by symbol, FY, quarter
    - xbrl_raw table: Raw XBRL data for reference

Usage:
    from fundamental_duckdb_storage import FundamentalStorage

    storage = FundamentalStorage()
    storage.store_fundamental_data(symbol, fy, quarter, fundamentals, xbrl_data)
    storage.close()
"""

import duckdb
import os
from datetime import datetime


class FundamentalStorage:
    """Store and retrieve fundamental data from DuckDB"""

    def __init__(self, db_path=None):
        """Initialize storage with DuckDB connection"""
        if db_path is None:
            db_path = os.path.join(os.getcwd(), 'data', 'fundamentals.duckdb')

        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

        self.db_path = db_path
        self.conn = duckdb.connect(db_path)

        # Initialize schema
        self._init_schema()

    def _init_schema(self):
        """Create tables if they don't exist"""

        # Fundamentals table - stores all calculated ratios
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS fundamentals (
                symbol VARCHAR NOT NULL,
                fy VARCHAR NOT NULL,
                quarter VARCHAR NOT NULL,
                end_date DATE NOT NULL,
                start_date DATE,
                is_annual BOOLEAN,

                -- Market Data
                current_price DOUBLE,
                market_cap DOUBLE,
                market_cap_cr DOUBLE,

                -- Valuation Ratios
                pe DOUBLE,
                pb DOUBLE,
                ps DOUBLE,
                ev_ebitda DOUBLE,

                -- Profitability Ratios (%)
                roe DOUBLE,
                roa DOUBLE,
                roce DOUBLE,
                net_profit_margin DOUBLE,
                operating_profit_margin DOUBLE,
                ebitda_margin DOUBLE,

                -- Liquidity Ratios
                current_ratio DOUBLE,
                quick_ratio DOUBLE,

                -- Leverage Ratios
                debt_to_equity DOUBLE,
                debt_to_assets DOUBLE,
                equity_multiplier DOUBLE,

                -- Per Share Metrics (₹)
                eps DOUBLE,
                book_value_per_share DOUBLE,
                revenue_per_share DOUBLE,
                cash_per_share DOUBLE,
                dividend_per_share DOUBLE,

                -- Dividend Metrics
                dividend_yield DOUBLE,
                dividend_payout_ratio DOUBLE,

                -- Absolute Values (₹ Crores)
                revenue_cr DOUBLE,
                net_profit_cr DOUBLE,
                ebitda_cr DOUBLE,
                total_assets_cr DOUBLE,
                total_equity_cr DOUBLE,
                total_debt_cr DOUBLE,
                cash_cr DOUBLE,

                -- Metadata
                shares_outstanding_cr DOUBLE,
                enterprise_value_cr DOUBLE,
                source VARCHAR DEFAULT 'xbrl',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                -- Primary key
                PRIMARY KEY (symbol, fy, quarter)
            )
        """)

        # Raw XBRL data table - stores original extracted values
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS xbrl_raw (
                symbol VARCHAR NOT NULL,
                fy VARCHAR NOT NULL,
                quarter VARCHAR NOT NULL,
                end_date DATE NOT NULL,
                start_date DATE,

                -- Balance Sheet (₹)
                assets BIGINT,
                current_assets BIGINT,
                non_current_assets BIGINT,
                fixed_assets BIGINT,
                equity BIGINT,
                current_liabilities BIGINT,
                total_debt BIGINT,
                cash BIGINT,

                -- P&L Statement (₹)
                revenue BIGINT,
                operating_profit BIGINT,
                ebitda BIGINT,
                net_profit BIGINT,
                eps DOUBLE,

                -- Other
                number_of_shares BIGINT,
                dividend_per_share DOUBLE,

                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (symbol, fy, quarter)
            )
        """)

        print('✅ Database schema initialized')

    def store_fundamental_data(self, symbol, fy, quarter, fundamentals, xbrl_data, period_info):
        """
        Store fundamental data in DuckDB

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            fy: Financial year (e.g., 'FY2024')
            quarter: Quarter (e.g., 'Q1', 'Q2', 'Q3', 'Q4')
            fundamentals: Dict of calculated fundamental ratios
            xbrl_data: Dict of raw XBRL extracted data
            period_info: Dict with endDate, startDate, isAnnual
        """

        # Store fundamentals
        self.conn.execute("""
            INSERT OR REPLACE INTO fundamentals VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, CURRENT_TIMESTAMP
            )
        """, [
            symbol, fy, quarter,
            period_info['endDate'], period_info.get('startDate'), period_info.get('isAnnual', False),

            fundamentals.get('currentPrice'), fundamentals.get('marketCap'), fundamentals.get('marketCapCr'),

            fundamentals.get('PE'), fundamentals.get('PB'), fundamentals.get('PS'), fundamentals.get('EVEBITDA'),

            fundamentals.get('ROE'), fundamentals.get('ROA'), fundamentals.get('ROCE'),
            fundamentals.get('netProfitMargin'), fundamentals.get('operatingProfitMargin'), fundamentals.get('EBITDAMargin'),

            fundamentals.get('currentRatio'), fundamentals.get('quickRatio'),

            fundamentals.get('debtToEquity'), fundamentals.get('debtToAssets'), fundamentals.get('equityMultiplier'),

            fundamentals.get('EPS'), fundamentals.get('bookValuePerShare'),
            fundamentals.get('revenuePerShare'), fundamentals.get('cashPerShare'), fundamentals.get('dividendPerShare'),

            fundamentals.get('dividendYield'), fundamentals.get('dividendPayoutRatio'),

            fundamentals.get('revenueCr'), fundamentals.get('netProfitCr'), fundamentals.get('ebitdaCr'),
            fundamentals.get('totalAssetsCr'), fundamentals.get('totalEquityCr'),
            fundamentals.get('totalDebtCr'), fundamentals.get('cashCr'),

            fundamentals.get('sharesOutstandingCr'), fundamentals.get('enterpriseValueCr'), 'xbrl'
        ])

        # Store raw XBRL data
        self.conn.execute("""
            INSERT OR REPLACE INTO xbrl_raw VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                CURRENT_TIMESTAMP
            )
        """, [
            symbol, fy, quarter,
            period_info['endDate'], period_info.get('startDate'),

            int(xbrl_data.get('Assets', 0)),
            int(xbrl_data.get('CurrentAssets', 0)),
            int(xbrl_data.get('NonCurrentAssets', 0)),
            int(xbrl_data.get('FixedAssets', 0)),
            int(xbrl_data.get('Equity', 0)),
            int(xbrl_data.get('CurrentLiabilities', 0)),
            int(xbrl_data.get('TotalDebt', 0)),
            int(xbrl_data.get('CashAndCashEquivalents', 0)),

            int(xbrl_data.get('Revenue', 0)),
            int(xbrl_data.get('OperatingProfit', 0)),
            int(xbrl_data.get('EBITDA', 0)),
            int(xbrl_data.get('NetProfit', 0)),
            xbrl_data.get('EPS', 0),

            int(xbrl_data.get('NumberOfShares', 0)),
            xbrl_data.get('DividendPerShare', 0),
        ])

        print(f'  ✅ Stored in DuckDB: {symbol} {fy} {quarter}')

    def get_latest_quarter(self, symbol):
        """Get the most recent quarter data for a symbol"""
        result = self.conn.execute("""
            SELECT * FROM fundamentals
            WHERE symbol = ?
            ORDER BY end_date DESC
            LIMIT 1
        """, [symbol]).fetchone()

        if not result:
            return None

        # Convert to dict
        columns = [desc[0] for desc in self.conn.description]
        return dict(zip(columns, result))

    def get_historical_data(self, symbol, limit=8):
        """Get historical fundamental data for a symbol (last N quarters)"""
        result = self.conn.execute("""
            SELECT * FROM fundamentals
            WHERE symbol = ?
            ORDER BY end_date DESC
            LIMIT ?
        """, [symbol, limit]).fetchall()

        if not result:
            return []

        # Convert to list of dicts
        columns = [desc[0] for desc in self.conn.description]
        return [dict(zip(columns, row)) for row in result]

    def get_all_symbols(self):
        """Get list of all symbols with fundamental data"""
        result = self.conn.execute("""
            SELECT DISTINCT symbol
            FROM fundamentals
            ORDER BY symbol
        """).fetchall()

        return [row[0] for row in result]

    def get_symbol_summary(self, symbol):
        """Get summary of available data for a symbol"""
        result = self.conn.execute("""
            SELECT fy, quarter, end_date, is_annual
            FROM fundamentals
            WHERE symbol = ?
            ORDER BY end_date DESC
        """, [symbol]).fetchall()

        if not result:
            return None

        return {
            'symbol': symbol,
            'quarters': [{'fy': row[0], 'quarter': row[1], 'endDate': row[2], 'isAnnual': row[3]} for row in result],
            'totalQuarters': len(result)
        }

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print('✅ Database connection closed')


# Example usage
if __name__ == '__main__':
    storage = FundamentalStorage()

    # Example: Get all symbols
    symbols = storage.get_all_symbols()
    print(f'\nSymbols with fundamental data: {len(symbols)}')
    if symbols:
        print(f'Symbols: {", ".join(symbols[:10])}{"..." if len(symbols) > 10 else ""}')

        # Get summary for first symbol
        if symbols:
            summary = storage.get_symbol_summary(symbols[0])
            print(f'\n{summary["symbol"]} - {summary["totalQuarters"]} quarters available:')
            for q in summary['quarters'][:4]:
                print(f'  {q["fy"]} {q["quarter"]} ({"Annual" if q["isAnnual"] else "Quarterly"}) - {q["endDate"]}')

    storage.close()
