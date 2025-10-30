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

                -- ===== RAW DATA: BANKING-SPECIFIC (₹) =====
                raw_interest_income BIGINT,
                raw_interest_on_advances BIGINT,
                raw_interest_on_investments BIGINT,
                raw_interest_on_rbi_balances BIGINT,
                raw_interest_expense BIGINT,
                raw_net_interest_income BIGINT,
                raw_non_interest_income BIGINT,
                raw_fee_income BIGINT,
                raw_trading_income BIGINT,
                raw_provisions BIGINT,
                raw_advances BIGINT,
                raw_deposits BIGINT,
                raw_cash_with_rbi BIGINT,
                raw_interbank_funds BIGINT,
                raw_investments_bank BIGINT,

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
                eps_ttm DOUBLE,  -- TTM EPS for quarterly reports (Q1-Q3)
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

        # Download tracking table (tracks NSE downloads to prevent re-downloading)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS xbrl_downloads (
                symbol VARCHAR NOT NULL,
                fy VARCHAR NOT NULL,
                quarter VARCHAR NOT NULL,
                statement_type VARCHAR NOT NULL,
                source_url VARCHAR NOT NULL,
                file_path VARCHAR NOT NULL,
                file_name VARCHAR NOT NULL,
                file_size_bytes BIGINT,
                download_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (symbol, fy, quarter, statement_type)
            )
        """)

        # Create indexes for download tracking
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_dl_symbol ON xbrl_downloads(symbol)
        """)
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_dl_date ON xbrl_downloads(download_date)
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

        # Build data dictionary with all values mapped to column names
        data_dict = {
            # Primary key
            'symbol': symbol,
            'fy': fy,
            'quarter': quarter,
            'statement_type': statement_type,

            # Period info
            'end_date': period_info['endDate'],
            'start_date': period_info.get('startDate'),
            'is_annual': period_info.get('isAnnual', False),

            # Raw: Balance Sheet - Assets
            'raw_assets': to_int(xbrl_data.get('Assets')),
            'raw_current_assets': to_int(xbrl_data.get('CurrentAssets')),
            'raw_non_current_assets': to_int(xbrl_data.get('NonCurrentAssets')),
            'raw_fixed_assets': to_int(xbrl_data.get('FixedAssets')),
            'raw_investments': to_int(xbrl_data.get('Investments')),
            'raw_cash_and_equivalents': to_int(xbrl_data.get('CashAndCashEquivalents')),
            'raw_trade_receivables': to_int(xbrl_data.get('TradeReceivables')),
            'raw_inventories': to_int(xbrl_data.get('Inventories')),

            # Raw: Balance Sheet - Liabilities & Equity
            'raw_equity_and_liabilities': to_int(xbrl_data.get('EquityAndLiabilities')),
            'raw_equity': to_int(xbrl_data.get('Equity')),
            'raw_share_capital': to_int(xbrl_data.get('ShareCapital')),
            'raw_reserves': to_int(xbrl_data.get('Reserves')),
            'raw_total_debt': to_int(xbrl_data.get('TotalDebt')),
            'raw_current_liabilities': to_int(xbrl_data.get('CurrentLiabilities')),
            'raw_non_current_liabilities': to_int(xbrl_data.get('NonCurrentLiabilities')),
            'raw_trade_payables': to_int(xbrl_data.get('TradePayables')),

            # Raw: P&L Statement
            'raw_revenue': to_int(xbrl_data.get('Revenue')),
            'raw_other_income': to_int(xbrl_data.get('OtherIncome')),
            'raw_total_income': to_int(xbrl_data.get('TotalIncome')),
            'raw_operating_expenses': to_int(xbrl_data.get('OperatingExpenses')),
            'raw_employee_benefits': to_int(xbrl_data.get('EmployeeBenefits')),
            'raw_depreciation': to_int(xbrl_data.get('Depreciation')),
            'raw_finance_costs': to_int(xbrl_data.get('FinanceCosts')),
            'raw_operating_profit': to_int(xbrl_data.get('OperatingProfit')),
            'raw_ebitda': to_int(xbrl_data.get('EBITDA')),
            'raw_profit_before_tax': to_int(xbrl_data.get('ProfitBeforeTax')),
            'raw_tax_expense': to_int(xbrl_data.get('TaxExpense')),
            'raw_net_profit': to_int(xbrl_data.get('NetProfit')),

            # Raw: Cash Flow
            'raw_operating_cash_flow': to_int(xbrl_data.get('OperatingCashFlow')),
            'raw_investing_cash_flow': to_int(xbrl_data.get('InvestingCashFlow')),
            'raw_financing_cash_flow': to_int(xbrl_data.get('FinancingCashFlow')),

            # Raw: Per Share & Shares
            'raw_eps': to_float(xbrl_data.get('EPS')),
            'raw_dividend_per_share': to_float(xbrl_data.get('DividendPerShare')),
            'raw_number_of_shares': to_int(xbrl_data.get('NumberOfShares')),

            # Raw: Banking-Specific
            'raw_interest_income': to_int(xbrl_data.get('InterestIncome')),
            'raw_interest_on_advances': to_int(xbrl_data.get('InterestOnAdvances')),
            'raw_interest_on_investments': to_int(xbrl_data.get('InterestOnInvestments')),
            'raw_interest_on_rbi_balances': to_int(xbrl_data.get('InterestOnRBIBalances')),
            'raw_interest_expense': to_int(xbrl_data.get('InterestExpense')),
            'raw_net_interest_income': to_int(xbrl_data.get('NetInterestIncome')),
            'raw_non_interest_income': to_int(xbrl_data.get('NonInterestIncome')),
            'raw_fee_income': to_int(xbrl_data.get('FeeIncome')),
            'raw_trading_income': to_int(xbrl_data.get('TradingIncome')),
            'raw_provisions': to_int(xbrl_data.get('Provisions')),
            'raw_advances': to_int(xbrl_data.get('Advances')),
            'raw_deposits': to_int(xbrl_data.get('Deposits')),
            'raw_cash_with_rbi': to_int(xbrl_data.get('CashWithRBI')),
            'raw_interbank_funds': to_int(xbrl_data.get('InterBankFunds')),
            'raw_investments_bank': to_int(xbrl_data.get('InvestmentsBank')),

            # Raw: New Banking Fields
            'raw_operating_profit_before_provisions': to_int(xbrl_data.get('OperatingProfitBeforeProvisions')),
            'raw_gross_npa': to_int(xbrl_data.get('GrossNPA')),
            'raw_net_npa': to_int(xbrl_data.get('NetNPA')),
            'raw_cet1_ratio': to_float(xbrl_data.get('CET1Ratio')),
            'raw_tier1_ratio': to_float(xbrl_data.get('Tier1Ratio')),
            'raw_cost_to_income_ratio': to_float(xbrl_data.get('CostToIncomeRatio')),
            'raw_casa_ratio': to_float(None),  # Will be calculated below

            # Raw: General Additional Fields
            'raw_extraordinary_items': to_int(xbrl_data.get('ExtraordinaryItems')),
            'raw_exceptional_items': to_int(xbrl_data.get('ExceptionalItems')),
            'raw_minority_interest': to_int(xbrl_data.get('MinorityInterest')),

            # Industry Classification
            'raw_industry': None,  # Will be set below

            # Calculated: Values in Crores
            'revenue_cr': to_float(fundamentals.get('revenueCr')),
            'net_profit_cr': to_float(fundamentals.get('netProfitCr')),
            'ebitda_cr': to_float(fundamentals.get('ebitdaCr')),
            'operating_profit_cr': to_float(fundamentals.get('operatingProfitCr')),
            'total_assets_cr': to_float(fundamentals.get('totalAssetsCr')),
            'total_equity_cr': to_float(fundamentals.get('totalEquityCr')),
            'total_debt_cr': to_float(fundamentals.get('totalDebtCr')),
            'cash_cr': to_float(fundamentals.get('cashCr')),
            'shares_outstanding_cr': to_float(fundamentals.get('sharesOutstandingCr')),

            # Calculated: Market Data
            'current_price': to_float(fundamentals.get('currentPrice')),
            'market_cap': to_float(fundamentals.get('marketCap')),
            'market_cap_cr': to_float(fundamentals.get('marketCapCr')),
            'enterprise_value_cr': to_float(fundamentals.get('enterpriseValueCr')),

            # Calculated: Valuation Ratios
            'pe': to_float(fundamentals.get('PE')),
            'pb': to_float(fundamentals.get('PB')),
            'ps': to_float(fundamentals.get('PS')),
            'ev_ebitda': to_float(fundamentals.get('EVEBITDA')),

            # Calculated: Profitability Ratios
            'roe': to_float(fundamentals.get('ROE')),
            'roa': to_float(fundamentals.get('ROA')),
            'roce': to_float(fundamentals.get('ROCE')),
            'net_profit_margin': to_float(fundamentals.get('netProfitMargin')),
            'operating_profit_margin': to_float(fundamentals.get('operatingProfitMargin')),
            'ebitda_margin': to_float(fundamentals.get('EBITDAMargin')),

            # Calculated: Liquidity Ratios
            'current_ratio': to_float(fundamentals.get('currentRatio')),
            'quick_ratio': to_float(fundamentals.get('quickRatio')),

            # Calculated: Leverage Ratios
            'debt_to_equity': to_float(fundamentals.get('debtToEquity')),
            'debt_to_assets': to_float(fundamentals.get('debtToAssets')),
            'equity_multiplier': to_float(fundamentals.get('equityMultiplier')),
            'interest_coverage': to_float(fundamentals.get('interestCoverage')),

            # Calculated: Efficiency Ratios
            'receivables_turnover': to_float(fundamentals.get('receivablesTurnover')),
            'inventory_turnover': to_float(fundamentals.get('inventoryTurnover')),
            'payables_turnover': to_float(fundamentals.get('payablesTurnover')),
            'cash_conversion_cycle': to_float(fundamentals.get('cashConversionCycle')),
            'asset_turnover': to_float(fundamentals.get('assetTurnover')),

            # Calculated: Quality Metrics
            'other_income_pct': to_float(fundamentals.get('otherIncomePct')),
            'effective_tax_rate': to_float(fundamentals.get('effectiveTaxRate')),
            'employee_cost_pct': to_float(fundamentals.get('employeeCostPct')),

            # Calculated: Per Share Metrics
            'eps': to_float(fundamentals.get('EPS')),
            'book_value_per_share': to_float(fundamentals.get('bookValuePerShare')),
            'revenue_per_share': to_float(fundamentals.get('revenuePerShare')),
            'cash_per_share': to_float(fundamentals.get('cashPerShare')),
            'dividend_per_share': to_float(fundamentals.get('dividendPerShare')),

            # Calculated: Dividend Metrics
            'dividend_yield': to_float(fundamentals.get('dividendYield')),
            'dividend_payout_ratio': to_float(fundamentals.get('dividendPayoutRatio')),

            # Metadata
            'source': 'xbrl',
            'source_file': source_file,
            'processed_at': datetime.now(),

            # TTM EPS (added later via ALTER TABLE, so it's at the end in actual DB)
            'eps_ttm': to_float(fundamentals.get('EPS_TTM')),

            # TTM calculations
            'revenue_ttm': to_float(None),  # Will be calculated in data_loader
            'net_profit_ttm': to_float(None),  # Will be calculated in data_loader
        }

        # ============================================
        # POST-PROCESSING: Calculate missing fields
        # ============================================

        # 1. FIX: Calculate Net Interest Income if missing
        if not data_dict.get('raw_net_interest_income'):
            interest_income = data_dict.get('raw_interest_income') or 0
            interest_expense = data_dict.get('raw_interest_expense') or 0
            if interest_income > 0 or interest_expense > 0:
                data_dict['raw_net_interest_income'] = interest_income - interest_expense
                print(f"  💡 Calculated NII: {interest_income:,.0f} - {interest_expense:,.0f} = {data_dict['raw_net_interest_income']:,.0f}")

        # 2. NEW: Detect and store industry classification
        data_dict['raw_industry'] = self._detect_industry(xbrl_data)

        # 3. NEW: Calculate CASA ratio for banks (Current + Savings / Total Deposits)
        current_deposits = to_int(xbrl_data.get('CurrentAccountDeposits')) or 0
        savings_deposits = to_int(xbrl_data.get('SavingsAccountDeposits')) or 0
        total_deposits = data_dict.get('raw_deposits') or 0
        if total_deposits > 0 and (current_deposits > 0 or savings_deposits > 0):
            casa = current_deposits + savings_deposits
            data_dict['raw_casa_ratio'] = round((casa / total_deposits) * 100, 2)
            print(f"  💡 Calculated CASA Ratio: {data_dict['raw_casa_ratio']:.2f}%")

        # 4. NEW: Data Validation Warnings
        self._validate_data(data_dict, symbol, fy, quarter)

        # Get column names in the order they exist in the database
        columns = list(data_dict.keys())
        values = [data_dict[col] for col in columns]

        # Build INSERT statement dynamically
        placeholders = ', '.join(['?'] * len(columns))
        columns_str = ', '.join(columns)

        # Store complete data using dynamic INSERT (order-independent)
        self.conn.execute(f"""
            INSERT OR REPLACE INTO xbrl_data ({columns_str})
            VALUES ({placeholders})
        """, values)

        print(f'  ✅ Stored in xbrl_data: {symbol} {fy} {quarter} ({statement_type})')

    def _detect_industry(self, xbrl_data):
        """
        Detect industry classification based on XBRL data

        Returns: 'BANKING', 'NBFC', 'INSURANCE', 'MANUFACTURING', 'SERVICES', or None
        """
        # Banking: Has interest income AND deposits (core banking indicator)
        has_interest_income = xbrl_data.get('InterestIncome') is not None
        has_deposits = xbrl_data.get('Deposits') is not None
        has_advances = xbrl_data.get('Advances') is not None

        if has_interest_income and has_deposits:
            return 'BANKING'

        # NBFC: Has interest income but no deposits (lends but doesn't take deposits)
        if has_interest_income and has_advances and not has_deposits:
            return 'NBFC'

        # Insurance: Check for insurance-specific fields
        # (Would need insurance-specific XBRL fields like PremiumIncome)
        # For now, skip insurance detection

        # Manufacturing: Has inventory and COGS
        has_inventory = xbrl_data.get('Inventories') is not None
        has_revenue = xbrl_data.get('Revenue') is not None

        if has_inventory and has_revenue:
            return 'MANUFACTURING'

        # Services: Everything else with revenue
        if has_revenue:
            return 'SERVICES'

        return None

    def _validate_data(self, data_dict, symbol, fy, quarter):
        """
        Validate data and print warnings for potential issues
        """
        warnings = []

        # Check for extremely high debt-to-equity
        debt_to_equity = data_dict.get('debt_to_equity')
        if debt_to_equity and debt_to_equity > 100:
            warnings.append(f"Extremely high D/E ratio: {debt_to_equity:.2f}")

        # Check for negative equity
        raw_equity = data_dict.get('raw_equity')
        if raw_equity and raw_equity < 0:
            warnings.append(f"Negative equity: {raw_equity:,.0f}")

        # Check for negative revenue (shouldn't happen)
        raw_revenue = data_dict.get('raw_revenue')
        if raw_revenue and raw_revenue < 0:
            warnings.append(f"Negative revenue: {raw_revenue:,.0f}")

        # Check for missing critical fields
        if not raw_revenue and data_dict.get('raw_industry') not in ['BANKING']:
            warnings.append("Missing revenue")

        if not data_dict.get('raw_net_profit'):
            warnings.append("Missing net profit")

        if not data_dict.get('raw_assets'):
            warnings.append("Missing assets")

        # Check sign validation: expenses should typically be positive
        # (representing money going out)
        tax_expense = data_dict.get('raw_tax_expense')
        if tax_expense and tax_expense < 0:
            warnings.append(f"Negative tax expense (unusual): {tax_expense:,.0f}")

        # Print warnings if any
        if warnings:
            print(f"  ⚠️  Data Validation Warnings for {symbol} {fy} {quarter}:")
            for warning in warnings:
                print(f"     - {warning}")

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

    def track_download(self, symbol, fy, quarter, statement_type, source_url, file_path, file_name, file_size_bytes):
        """
        Track a downloaded XBRL file to prevent re-downloading

        Args:
            symbol: Stock symbol (e.g., 'TCS')
            fy: Financial year (e.g., 'FY2025')
            quarter: Quarter (e.g., 'Q2')
            statement_type: 'standalone' or 'consolidated'
            source_url: URL where file was downloaded from
            file_path: Full path to saved file
            file_name: Filename only
            file_size_bytes: File size in bytes
        """
        self.conn.execute("""
            INSERT OR REPLACE INTO xbrl_downloads
            (symbol, fy, quarter, statement_type, source_url, file_path, file_name, file_size_bytes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            symbol,
            fy,
            quarter,
            statement_type,
            source_url,
            file_path,
            file_name,
            file_size_bytes
        ])

    def is_already_downloaded(self, symbol, fy, quarter, statement_type):
        """
        Check if a file has already been downloaded

        Args:
            symbol: Stock symbol
            fy: Financial year
            quarter: Quarter
            statement_type: 'standalone' or 'consolidated'

        Returns:
            (is_downloaded, file_name) - True if already downloaded, with filename
        """
        result = self.conn.execute("""
            SELECT file_name, download_date FROM xbrl_downloads
            WHERE symbol = ? AND fy = ? AND quarter = ? AND statement_type = ?
        """, [symbol, fy, quarter, statement_type]).fetchone()

        if result:
            return True, result[0]
        return False, None

    def get_download_history(self, symbol=None):
        """Get download history for a symbol or all symbols"""
        if symbol:
            result = self.conn.execute("""
                SELECT symbol, fy, quarter, statement_type, file_name, download_date
                FROM xbrl_downloads
                WHERE symbol = ?
                ORDER BY download_date DESC
            """, [symbol]).fetchall()
        else:
            result = self.conn.execute("""
                SELECT symbol, fy, quarter, statement_type, file_name, download_date
                FROM xbrl_downloads
                ORDER BY download_date DESC
            """).fetchall()

        columns = ['symbol', 'fy', 'quarter', 'statement_type', 'file_name', 'download_date']
        return [dict(zip(columns, row)) for row in result]

    def get_download_stats(self):
        """Get download statistics"""
        result = self.conn.execute("""
            SELECT
                COUNT(*) as total_downloads,
                COUNT(DISTINCT symbol) as unique_symbols,
                COUNT(DISTINCT fy) as unique_years,
                MIN(download_date) as first_download,
                MAX(download_date) as last_download
            FROM xbrl_downloads
        """).fetchone()

        if result:
            return {
                'total_downloads': result[0],
                'unique_symbols': result[1],
                'unique_years': result[2],
                'first_download': result[3],
                'last_download': result[4]
            }
        return None

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
