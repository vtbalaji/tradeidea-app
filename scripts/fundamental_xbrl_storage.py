#!/usr/bin/env -S venv/bin/python3
"""
DuckDB Storage for XBRL Fundamental Data

Stores XBRL fundamental data (raw + calculated) in a single consolidated table.
This is separate from Yahoo fundamentals and does not disturb existing tables.

Schema:
    - xbrl_data: Single table with raw values + calculated ratios
    - xbrl_processed_files: File tracking to prevent duplicate processing

Usage:
    from fundamental_xbrl_storage import XBRLStorage

    storage = XBRLStorage()
    storage.store_data(symbol, fy, quarter, statement_type, xbrl_data, fundamentals, period_info, filename)
    storage.close()
"""

import duckdb
import os
from datetime import datetime


class XBRLStorage:
    """Store and retrieve XBRL fundamental data from DuckDB"""

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
        """Create tables if they don't exist (does not touch existing Yahoo tables)"""

        # Main XBRL data table - single consolidated table with raw + calculated
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS xbrl_data (
                -- ===== PRIMARY KEY =====
                symbol VARCHAR NOT NULL,
                fy VARCHAR NOT NULL,
                quarter VARCHAR NOT NULL,
                statement_type VARCHAR NOT NULL,

                -- ===== PERIOD INFO =====
                end_date DATE NOT NULL,
                start_date DATE,
                is_annual BOOLEAN,

                -- ===== RAW DATA: BALANCE SHEET - ASSETS (₹) =====
                raw_assets BIGINT,
                raw_current_assets BIGINT,
                raw_non_current_assets BIGINT,
                raw_fixed_assets BIGINT,
                raw_investments BIGINT,
                raw_cash_and_equivalents BIGINT,
                raw_trade_receivables BIGINT,
                raw_inventories BIGINT,

                -- ===== RAW DATA: BALANCE SHEET - LIABILITIES & EQUITY (₹) =====
                raw_equity_and_liabilities BIGINT,
                raw_equity BIGINT,
                raw_share_capital BIGINT,
                raw_reserves BIGINT,
                raw_total_debt BIGINT,
                raw_current_liabilities BIGINT,
                raw_non_current_liabilities BIGINT,
                raw_trade_payables BIGINT,

                -- ===== RAW DATA: P&L STATEMENT (₹) =====
                raw_revenue BIGINT,
                raw_other_income BIGINT,
                raw_total_income BIGINT,
                raw_operating_expenses BIGINT,
                raw_employee_benefits BIGINT,
                raw_depreciation BIGINT,
                raw_finance_costs BIGINT,
                raw_operating_profit BIGINT,
                raw_ebitda BIGINT,
                raw_profit_before_tax BIGINT,
                raw_tax_expense BIGINT,
                raw_net_profit BIGINT,

                -- ===== RAW DATA: CASH FLOW STATEMENT (₹) =====
                raw_operating_cash_flow BIGINT,
                raw_investing_cash_flow BIGINT,
                raw_financing_cash_flow BIGINT,

                -- ===== RAW DATA: PER SHARE & SHARES =====
                raw_eps DOUBLE,
                raw_dividend_per_share DOUBLE,
                raw_number_of_shares BIGINT,

                -- ===== CALCULATED: VALUES IN CRORES =====
                revenue_cr DOUBLE,
                net_profit_cr DOUBLE,
                ebitda_cr DOUBLE,
                operating_profit_cr DOUBLE,
                total_assets_cr DOUBLE,
                total_equity_cr DOUBLE,
                total_debt_cr DOUBLE,
                cash_cr DOUBLE,
                shares_outstanding_cr DOUBLE,

                -- ===== CALCULATED: MARKET DATA =====
                current_price DOUBLE,
                market_cap DOUBLE,
                market_cap_cr DOUBLE,
                enterprise_value_cr DOUBLE,

                -- ===== CALCULATED: VALUATION RATIOS =====
                pe DOUBLE,
                pb DOUBLE,
                ps DOUBLE,
                ev_ebitda DOUBLE,

                -- ===== CALCULATED: PROFITABILITY RATIOS (%) =====
                roe DOUBLE,
                roa DOUBLE,
                roce DOUBLE,
                net_profit_margin DOUBLE,
                operating_profit_margin DOUBLE,
                ebitda_margin DOUBLE,

                -- ===== CALCULATED: LIQUIDITY RATIOS =====
                current_ratio DOUBLE,
                quick_ratio DOUBLE,

                -- ===== CALCULATED: LEVERAGE RATIOS =====
                debt_to_equity DOUBLE,
                debt_to_assets DOUBLE,
                equity_multiplier DOUBLE,
                interest_coverage DOUBLE,

                -- ===== CALCULATED: EFFICIENCY RATIOS =====
                receivables_turnover DOUBLE,
                inventory_turnover DOUBLE,
                payables_turnover DOUBLE,
                cash_conversion_cycle DOUBLE,
                asset_turnover DOUBLE,

                -- ===== CALCULATED: QUALITY METRICS =====
                other_income_pct DOUBLE,
                effective_tax_rate DOUBLE,
                employee_cost_pct DOUBLE,

                -- ===== CALCULATED: PER SHARE METRICS (₹) =====
                eps DOUBLE,
                book_value_per_share DOUBLE,
                revenue_per_share DOUBLE,
                cash_per_share DOUBLE,
                dividend_per_share DOUBLE,

                -- ===== CALCULATED: DIVIDEND METRICS =====
                dividend_yield DOUBLE,
                dividend_payout_ratio DOUBLE,

                -- ===== METADATA =====
                source VARCHAR DEFAULT 'xbrl',
                source_file VARCHAR,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY (symbol, fy, quarter, statement_type)
            )
        """)

        # Create indexes for faster queries
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_xbrl_symbol ON xbrl_data(symbol)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_xbrl_end_date ON xbrl_data(end_date)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_xbrl_statement_type ON xbrl_data(statement_type)
        """)

        # File tracking table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS xbrl_processed_files (
                file_name VARCHAR PRIMARY KEY,
                file_path VARCHAR NOT NULL,
                symbol VARCHAR NOT NULL,
                statement_type VARCHAR,
                fy VARCHAR,
                quarter VARCHAR,
                end_date DATE,
                file_size_bytes BIGINT,
                status VARCHAR,
                error_message VARCHAR,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes for file tracking
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_pf_symbol ON xbrl_processed_files(symbol)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_pf_status ON xbrl_processed_files(status)
        """)

        print('✅ XBRL database schema initialized')

    def store_data(self, symbol, fy, quarter, statement_type, xbrl_data, fundamentals, period_info, source_file):
        """
        Store complete XBRL data (raw + calculated) in single table

        Args:
            symbol: Stock symbol (e.g., 'RELIANCE')
            fy: Financial year (e.g., 'FY2024')
            quarter: Quarter (e.g., 'Q1', 'Q2', 'Q3', 'Q4')
            statement_type: 'standalone' or 'consolidated'
            xbrl_data: Dict of raw XBRL extracted data
            fundamentals: Dict of calculated fundamental ratios
            period_info: Dict with endDate, startDate, isAnnual
            source_file: Filename that was processed
        """

        # Helper to safely convert to int
        def to_int(value, default=None):
            try:
                return int(value) if value is not None else default
            except (ValueError, TypeError):
                return default

        # Helper to safely convert to float
        def to_float(value, default=None):
            try:
                return float(value) if value is not None else default
            except (ValueError, TypeError):
                return default

        # Store complete data (raw + calculated)
        self.conn.execute("""
            INSERT OR REPLACE INTO xbrl_data VALUES (
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?, CURRENT_TIMESTAMP
            )
        """, [
            # Primary key
            symbol, fy, quarter, statement_type,

            # Period info
            period_info['endDate'], period_info.get('startDate'), period_info.get('isAnnual', False),

            # Raw: Balance Sheet - Assets
            to_int(xbrl_data.get('Assets')),
            to_int(xbrl_data.get('CurrentAssets')),
            to_int(xbrl_data.get('NonCurrentAssets')),
            to_int(xbrl_data.get('FixedAssets')),
            to_int(xbrl_data.get('Investments')),
            to_int(xbrl_data.get('CashAndCashEquivalents')),
            to_int(xbrl_data.get('TradeReceivables')),
            to_int(xbrl_data.get('Inventories')),

            # Raw: Balance Sheet - Liabilities & Equity
            to_int(xbrl_data.get('EquityAndLiabilities')),
            to_int(xbrl_data.get('Equity')),
            to_int(xbrl_data.get('ShareCapital')),
            to_int(xbrl_data.get('Reserves')),
            to_int(xbrl_data.get('TotalDebt')),
            to_int(xbrl_data.get('CurrentLiabilities')),
            to_int(xbrl_data.get('NonCurrentLiabilities')),
            to_int(xbrl_data.get('TradePayables')),

            # Raw: P&L Statement
            to_int(xbrl_data.get('Revenue')),
            to_int(xbrl_data.get('OtherIncome')),
            to_int(xbrl_data.get('TotalIncome')),
            to_int(xbrl_data.get('OperatingExpenses')),
            to_int(xbrl_data.get('EmployeeBenefits')),
            to_int(xbrl_data.get('Depreciation')),
            to_int(xbrl_data.get('FinanceCosts')),
            to_int(xbrl_data.get('OperatingProfit')),
            to_int(xbrl_data.get('EBITDA')),
            to_int(xbrl_data.get('ProfitBeforeTax')),
            to_int(xbrl_data.get('TaxExpense')),
            to_int(xbrl_data.get('NetProfit')),

            # Raw: Cash Flow
            to_int(xbrl_data.get('OperatingCashFlow')),
            to_int(xbrl_data.get('InvestingCashFlow')),
            to_int(xbrl_data.get('FinancingCashFlow')),

            # Raw: Per Share & Shares
            to_float(xbrl_data.get('EPS')),
            to_float(xbrl_data.get('DividendPerShare')),
            to_int(xbrl_data.get('NumberOfShares')),

            # Calculated: Values in Crores
            to_float(fundamentals.get('revenueCr')),
            to_float(fundamentals.get('netProfitCr')),
            to_float(fundamentals.get('ebitdaCr')),
            to_float(fundamentals.get('operatingProfitCr')),
            to_float(fundamentals.get('totalAssetsCr')),
            to_float(fundamentals.get('totalEquityCr')),
            to_float(fundamentals.get('totalDebtCr')),
            to_float(fundamentals.get('cashCr')),
            to_float(fundamentals.get('sharesOutstandingCr')),

            # Calculated: Market Data
            to_float(fundamentals.get('currentPrice')),
            to_float(fundamentals.get('marketCap')),
            to_float(fundamentals.get('marketCapCr')),
            to_float(fundamentals.get('enterpriseValueCr')),

            # Calculated: Valuation Ratios
            to_float(fundamentals.get('PE')),
            to_float(fundamentals.get('PB')),
            to_float(fundamentals.get('PS')),
            to_float(fundamentals.get('EVEBITDA')),

            # Calculated: Profitability Ratios
            to_float(fundamentals.get('ROE')),
            to_float(fundamentals.get('ROA')),
            to_float(fundamentals.get('ROCE')),
            to_float(fundamentals.get('netProfitMargin')),
            to_float(fundamentals.get('operatingProfitMargin')),
            to_float(fundamentals.get('EBITDAMargin')),

            # Calculated: Liquidity Ratios
            to_float(fundamentals.get('currentRatio')),
            to_float(fundamentals.get('quickRatio')),

            # Calculated: Leverage Ratios
            to_float(fundamentals.get('debtToEquity')),
            to_float(fundamentals.get('debtToAssets')),
            to_float(fundamentals.get('equityMultiplier')),
            to_float(fundamentals.get('interestCoverage')),

            # Calculated: Efficiency Ratios
            to_float(fundamentals.get('receivablesTurnover')),
            to_float(fundamentals.get('inventoryTurnover')),
            to_float(fundamentals.get('payablesTurnover')),
            to_float(fundamentals.get('cashConversionCycle')),
            to_float(fundamentals.get('assetTurnover')),

            # Calculated: Quality Metrics
            to_float(fundamentals.get('otherIncomePct')),
            to_float(fundamentals.get('effectiveTaxRate')),
            to_float(fundamentals.get('employeeCostPct')),

            # Calculated: Per Share Metrics
            to_float(fundamentals.get('EPS')),
            to_float(fundamentals.get('bookValuePerShare')),
            to_float(fundamentals.get('revenuePerShare')),
            to_float(fundamentals.get('cashPerShare')),
            to_float(fundamentals.get('dividendPerShare')),

            # Calculated: Dividend Metrics
            to_float(fundamentals.get('dividendYield')),
            to_float(fundamentals.get('dividendPayoutRatio')),

            # Metadata
            'xbrl',
            source_file,
        ])

        print(f'  ✅ Stored in xbrl_data: {symbol} {fy} {quarter} ({statement_type})')

    def mark_file_processed(self, file_name, file_path, symbol, statement_type, fy, quarter, end_date,
                           file_size_bytes, status='success', error_message=None):
        """Mark a file as processed in the tracking table"""

        self.conn.execute("""
            INSERT OR REPLACE INTO xbrl_processed_files
            (file_name, file_path, symbol, statement_type, fy, quarter, end_date, file_size_bytes, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            file_name,
            file_path,
            symbol,
            statement_type,
            fy,
            quarter,
            end_date,
            file_size_bytes,
            status,
            error_message
        ])

    def is_file_processed(self, file_name):
        """Check if a file has already been processed successfully"""
        result = self.conn.execute("""
            SELECT status, processed_at FROM xbrl_processed_files
            WHERE file_name = ?
        """, [file_name]).fetchone()

        if result:
            status, processed_at = result
            return status == 'success', processed_at

        return False, None

    def get_failed_files(self):
        """Get list of files that failed processing"""
        result = self.conn.execute("""
            SELECT file_name, file_path, symbol, error_message, processed_at
            FROM xbrl_processed_files
            WHERE status = 'failed'
            ORDER BY processed_at DESC
        """).fetchall()

        columns = ['file_name', 'file_path', 'symbol', 'error_message', 'processed_at']
        return [dict(zip(columns, row)) for row in result]

    def get_latest_quarter(self, symbol, statement_type='consolidated'):
        """Get the most recent quarter data for a symbol"""
        result = self.conn.execute("""
            SELECT * FROM xbrl_data
            WHERE symbol = ? AND statement_type = ?
            ORDER BY end_date DESC
            LIMIT 1
        """, [symbol, statement_type]).fetchone()

        if not result:
            return None

        # Convert to dict
        columns = [desc[0] for desc in self.conn.description]
        return dict(zip(columns, result))

    def get_historical_data(self, symbol, statement_type='consolidated', limit=8):
        """Get historical fundamental data for a symbol (last N quarters)"""
        result = self.conn.execute("""
            SELECT * FROM xbrl_data
            WHERE symbol = ? AND statement_type = ?
            ORDER BY end_date DESC
            LIMIT ?
        """, [symbol, statement_type, limit]).fetchall()

        if not result:
            return []

        # Convert to list of dicts
        columns = [desc[0] for desc in self.conn.description]
        return [dict(zip(columns, row)) for row in result]

    def get_all_symbols(self):
        """Get list of all symbols with XBRL data"""
        result = self.conn.execute("""
            SELECT DISTINCT symbol
            FROM xbrl_data
            ORDER BY symbol
        """).fetchall()

        return [row[0] for row in result]

    def get_symbol_summary(self, symbol):
        """Get summary of available data for a symbol"""
        result = self.conn.execute("""
            SELECT statement_type, fy, quarter, end_date, is_annual
            FROM xbrl_data
            WHERE symbol = ?
            ORDER BY statement_type, end_date DESC
        """, [symbol]).fetchall()

        if not result:
            return None

        return {
            'symbol': symbol,
            'quarters': [
                {
                    'statementType': row[0],
                    'fy': row[1],
                    'quarter': row[2],
                    'endDate': row[3],
                    'isAnnual': row[4]
                } for row in result
            ],
            'totalQuarters': len(result)
        }

    def get_processed_files_summary(self, symbol=None):
        """Get summary of processed files"""
        if symbol:
            result = self.conn.execute("""
                SELECT file_name, statement_type, fy, quarter, status, processed_at
                FROM xbrl_processed_files
                WHERE symbol = ?
                ORDER BY processed_at DESC
            """, [symbol]).fetchall()
        else:
            result = self.conn.execute("""
                SELECT file_name, symbol, statement_type, fy, quarter, status, processed_at
                FROM xbrl_processed_files
                ORDER BY processed_at DESC
            """).fetchall()

        if symbol:
            columns = ['file_name', 'statement_type', 'fy', 'quarter', 'status', 'processed_at']
        else:
            columns = ['file_name', 'symbol', 'statement_type', 'fy', 'quarter', 'status', 'processed_at']

        return [dict(zip(columns, row)) for row in result]

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print('✅ Database connection closed')


# Example usage
if __name__ == '__main__':
    storage = XBRLStorage()

    # Example: Get all symbols
    symbols = storage.get_all_symbols()
    print(f'\nSymbols with XBRL data: {len(symbols)}')
    if symbols:
        print(f'Symbols: {", ".join(symbols[:10])}{"..." if len(symbols) > 10 else ""}')

        # Get summary for first symbol
        if symbols:
            summary = storage.get_symbol_summary(symbols[0])
            print(f'\n{summary["symbol"]} - {summary["totalQuarters"]} quarters available:')
            for q in summary['quarters'][:4]:
                print(f'  {q["fy"]} {q["quarter"]} ({q["statementType"]}) - {q["endDate"]}')

    # Check processed files
    processed = storage.get_processed_files_summary()
    print(f'\nProcessed files: {len(processed)}')

    storage.close()
