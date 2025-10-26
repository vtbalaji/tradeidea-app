#!/usr/bin/env python3
"""
Yahoo Finance XBRL Data Enricher

Enriches XBRL data in DuckDB with missing fields from Yahoo Finance
needed for forensic calculations.

Key missing fields in XBRL data:
- market_cap (for Altman Z-Score X4 component)
- current_price (for valuations)
- receivables growth metrics
- Additional balance sheet details

This module ONLY updates DuckDB and does NOT touch Firebase.

Usage:
    from yahoo_xbrl_enricher import YahooXBRLEnricher

    enricher = YahooXBRLEnricher()
    enricher.enrich_symbol('TCS')
    enricher.close()
"""

import yfinance as yf
import duckdb
import os
from datetime import datetime, timedelta
import pandas as pd


class YahooXBRLEnricher:
    """Enrich XBRL data with Yahoo Finance data for forensic calculations"""

    def __init__(self, db_path=None):
        """Initialize with DuckDB connection"""
        if db_path is None:
            db_path = os.path.join(os.getcwd(), 'data', 'fundamentals.duckdb')

        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Database not found: {db_path}")

        self.db_path = db_path
        self.conn = duckdb.connect(db_path)
        self._ensure_enrichment_columns()

    def _ensure_enrichment_columns(self):
        """Add enrichment columns to xbrl_data table if they don't exist"""
        try:
            # Check if columns already exist
            result = self.conn.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'xbrl_data'
            """).fetchall()

            existing_columns = [row[0] for row in result]

            # Add missing columns
            columns_to_add = {
                'market_cap': 'DOUBLE',
                'current_price': 'DOUBLE',
                'yahoo_enriched_at': 'TIMESTAMP',
            }

            for col_name, col_type in columns_to_add.items():
                if col_name not in existing_columns:
                    self.conn.execute(f"""
                        ALTER TABLE xbrl_data
                        ADD COLUMN {col_name} {col_type}
                    """)
                    print(f"  ✅ Added column: {col_name}")

            # Create Yahoo quarterly enrichment table for fallback data
            self._create_yahoo_quarterly_table()

        except Exception as e:
            print(f"  ⚠️  Column creation check: {str(e)}")

    def _create_yahoo_quarterly_table(self):
        """Create table to store comprehensive Yahoo quarterly data"""
        try:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS yahoo_quarterly_enrichment (
                    symbol VARCHAR,
                    fy VARCHAR,
                    quarter VARCHAR,
                    end_date DATE,

                    -- P&L from Yahoo
                    yahoo_total_revenue DOUBLE,
                    yahoo_gross_profit DOUBLE,
                    yahoo_operating_income DOUBLE,
                    yahoo_net_income DOUBLE,
                    yahoo_ebitda DOUBLE,
                    yahoo_ebit DOUBLE,
                    yahoo_operating_expense DOUBLE,
                    yahoo_interest_expense DOUBLE,
                    yahoo_tax_provision DOUBLE,

                    -- Cash Flow from Yahoo
                    yahoo_operating_cf DOUBLE,
                    yahoo_investing_cf DOUBLE,
                    yahoo_financing_cf DOUBLE,
                    yahoo_free_cashflow DOUBLE,
                    yahoo_capex DOUBLE,

                    -- Balance Sheet from Yahoo
                    yahoo_total_assets DOUBLE,
                    yahoo_current_assets DOUBLE,
                    yahoo_total_liabilities DOUBLE,
                    yahoo_current_liabilities DOUBLE,
                    yahoo_stockholders_equity DOUBLE,
                    yahoo_total_debt DOUBLE,
                    yahoo_cash DOUBLE,
                    yahoo_receivables DOUBLE,
                    yahoo_inventory DOUBLE,

                    -- Market Data
                    yahoo_shares_outstanding DOUBLE,
                    yahoo_market_cap DOUBLE,

                    -- Metadata
                    yahoo_fetched_at TIMESTAMP,
                    data_quality_score DOUBLE,

                    PRIMARY KEY (symbol, fy, quarter)
                )
            """)
        except Exception as e:
            # Table might already exist
            pass

    def enrich_symbol(self, symbol, verbose=True, use_stored_yahoo=True):
        """
        Enrich XBRL data for a symbol with Yahoo Finance data

        Args:
            symbol: Stock symbol (e.g., 'TCS')
            verbose: Print progress messages
            use_stored_yahoo: Try to use data from yahoo_current_fundamentals table first

        Returns:
            Dict with enrichment statistics
        """
        try:
            if verbose:
                print(f'\n📊 Enriching XBRL data for {symbol} with Yahoo Finance...')

            # Try to get data from yahoo_current_fundamentals table first (faster)
            current_price = None
            market_cap = None
            info = {}

            if use_stored_yahoo:
                stored_yahoo = self.conn.execute("""
                    SELECT current_price, market_cap
                    FROM yahoo_current_fundamentals
                    WHERE symbol = ?
                """, [symbol]).fetchone()

                if stored_yahoo:
                    current_price, market_cap = stored_yahoo
                    if verbose:
                        print(f'  ✓ Using stored Yahoo data from DuckDB')

            # If no stored data, fetch fresh from Yahoo Finance
            if not current_price:
                ticker = yf.Ticker(f"{symbol}.NS")
                info = ticker.info

                if not info or 'symbol' not in info:
                    if verbose:
                        print(f'  ⚠️  No Yahoo Finance data available for {symbol}')
                    return {'success': False, 'error': 'No data'}

                # Get current market data
                current_price = info.get('currentPrice') or info.get('regularMarketPrice')
                market_cap = info.get('marketCap')

            if not current_price:
                if verbose:
                    print(f'  ⚠️  No price data available for {symbol}')
                return {'success': False, 'error': 'No price'}

            # Get historical quarterly balance sheets for missing fields
            # Only fetch if we have a ticker object (not using stored data)
            quarterly_balance = None
            quarterly_income = None
            yahoo_shares = None

            if info:  # We have fresh data from yfinance
                if not hasattr(self, '_ticker_cache'):
                    self._ticker_cache = {}

                if symbol not in self._ticker_cache:
                    self._ticker_cache[symbol] = yf.Ticker(f"{symbol}.NS")

                ticker = self._ticker_cache[symbol]
                quarterly_balance = ticker.quarterly_balance_sheet
                quarterly_income = ticker.quarterly_income_stmt

                # Get shares outstanding from Yahoo Finance
                yahoo_shares = info.get('sharesOutstanding')
                if not yahoo_shares and quarterly_balance is not None and not quarterly_balance.empty:
                    # Try to get from most recent quarter
                    latest_date = quarterly_balance.columns[0]
                    yahoo_shares = quarterly_balance[latest_date].get('Ordinary Shares Number')
            else:
                # Using stored data - try to get shares from yahoo_quarterly_fundamentals
                stored_shares = self.conn.execute("""
                    SELECT shares_outstanding_cr
                    FROM yahoo_quarterly_fundamentals
                    WHERE symbol = ?
                    ORDER BY end_date DESC
                    LIMIT 1
                """, [symbol]).fetchone()

                if stored_shares and stored_shares[0]:
                    yahoo_shares = stored_shares[0] * 10_000_000  # Convert from crores to actual number

            # Get all XBRL records for this symbol
            xbrl_records = self.conn.execute("""
                SELECT symbol, fy, quarter, end_date,
                       raw_revenue, raw_assets, raw_equity,
                       raw_number_of_shares
                FROM xbrl_data
                WHERE symbol = ?
                ORDER BY end_date DESC
            """, [symbol]).fetchall()

            if not xbrl_records:
                if verbose:
                    print(f'  ⚠️  No XBRL records found for {symbol}')
                return {'success': False, 'error': 'No XBRL data'}

            enriched_count = 0

            # For each XBRL record, try to enrich with Yahoo data
            for record in xbrl_records:
                xbrl_symbol, fy, quarter, end_date, revenue, assets, equity, shares = record

                # Use XBRL shares if available, otherwise use Yahoo shares
                effective_shares = shares if shares and shares > 0 else yahoo_shares

                # Calculate market cap
                calc_market_cap = None
                if effective_shares and current_price:
                    calc_market_cap = effective_shares * current_price

                # Use Yahoo's market cap for most recent quarter, calculated for older ones
                if enriched_count == 0 and market_cap:
                    final_market_cap = market_cap
                else:
                    final_market_cap = calc_market_cap

                # Try to get period-specific data from Yahoo quarterly data
                period_price = current_price  # Default to current price
                period_market_cap = final_market_cap
                period_shares = effective_shares

                if quarterly_balance is not None and not quarterly_balance.empty:
                    # Try to find matching quarter in Yahoo data
                    for yahoo_date in quarterly_balance.columns:
                        # Match within 45 days
                        if abs((yahoo_date.date() - end_date).days) <= 45:
                            # Found a matching quarter - use Yahoo data for this period
                            yahoo_period_shares = quarterly_balance[yahoo_date].get('Ordinary Shares Number')
                            yahoo_equity = quarterly_balance[yahoo_date].get('Stockholders Equity')

                            if yahoo_period_shares and yahoo_equity:
                                # Use Yahoo shares for this specific period
                                period_shares = yahoo_period_shares

                                # Calculate book value per share
                                book_value_per_share = yahoo_equity / yahoo_period_shares

                                # Estimate historical price using P/B ratio
                                pb_ratio = info.get('priceToBook', 1.5)
                                if pb_ratio and pb_ratio > 0:
                                    period_price = book_value_per_share * pb_ratio
                                    period_market_cap = period_price * period_shares
                            break

                # Update the XBRL record
                self.conn.execute("""
                    UPDATE xbrl_data
                    SET market_cap = ?,
                        current_price = ?,
                        yahoo_enriched_at = CURRENT_TIMESTAMP
                    WHERE symbol = ? AND fy = ? AND quarter = ?
                """, [period_market_cap, period_price, xbrl_symbol, fy, quarter])

                enriched_count += 1

            if verbose:
                print(f'  ✅ Enriched {enriched_count} XBRL records with Yahoo data')
                print(f'     Market Cap: ₹{market_cap/10000000:.0f} Cr' if market_cap else '     Market Cap: Calculated')
                print(f'     Price: ₹{current_price:.2f}' if current_price else '     Price: N/A')

            return {
                'success': True,
                'enriched_count': enriched_count,
                'market_cap': market_cap,
                'current_price': current_price
            }

        except Exception as e:
            if verbose:
                print(f'  ❌ Enrichment error for {symbol}: {str(e)}')
            return {'success': False, 'error': str(e)}

    def enrich_all_symbols(self, verbose=True):
        """
        Enrich all symbols in the xbrl_data table

        Returns:
            Dict with summary statistics
        """
        try:
            # Get all unique symbols
            symbols = self.conn.execute("""
                SELECT DISTINCT symbol
                FROM xbrl_data
                ORDER BY symbol
            """).fetchall()

            symbols = [row[0] for row in symbols]

            if verbose:
                print(f'\n🔄 Enriching {len(symbols)} symbols...')

            success_count = 0
            fail_count = 0
            total_records = 0

            for i, symbol in enumerate(symbols):
                if verbose:
                    print(f'\n[{i+1}/{len(symbols)}] {symbol}')

                result = self.enrich_symbol(symbol, verbose=verbose)

                if result['success']:
                    success_count += 1
                    total_records += result.get('enriched_count', 0)
                else:
                    fail_count += 1

            if verbose:
                print('\n' + '=' * 60)
                print('📊 Enrichment Complete!')
                print('=' * 60)
                print(f'✅ Success: {success_count} symbols')
                print(f'❌ Failed: {fail_count} symbols')
                print(f'📝 Total records enriched: {total_records}')
                print('=' * 60)

            return {
                'success_count': success_count,
                'fail_count': fail_count,
                'total_records': total_records
            }

        except Exception as e:
            print(f'❌ Enrichment error: {str(e)}')
            return {'error': str(e)}

    def store_yahoo_quarterly_data(self, symbol, verbose=True):
        """
        Fetch and store comprehensive Yahoo Finance quarterly data
        for use as fallback when XBRL data is missing/incomplete
        """
        try:
            if verbose:
                print(f'\n📥 Fetching comprehensive Yahoo data for {symbol}...')

            ticker = yf.Ticker(f"{symbol}.NS")
            info = ticker.info

            if not info or 'symbol' not in info:
                if verbose:
                    print(f'  ⚠️  No Yahoo data available')
                return {'success': False, 'error': 'No data'}

            # Get quarterly data
            quarterly_income = ticker.quarterly_income_stmt
            quarterly_balance = ticker.quarterly_balance_sheet
            quarterly_cashflow = ticker.quarterly_cashflow

            if quarterly_income is None or quarterly_income.empty:
                if verbose:
                    print(f'  ⚠️  No quarterly financial data available')
                return {'success': False, 'error': 'No quarterly data'}

            stored_count = 0

            # Process each quarter
            for yahoo_date in quarterly_income.columns:
                end_date = yahoo_date.date()

                # Determine FY and Quarter
                fy, quarter = self._date_to_fy_quarter(end_date)

                # Extract P&L data
                income_data = quarterly_income[yahoo_date]
                yahoo_total_revenue = income_data.get('Total Revenue')
                yahoo_gross_profit = income_data.get('Gross Profit')
                yahoo_operating_income = income_data.get('Operating Income')
                yahoo_net_income = income_data.get('Net Income')
                yahoo_ebitda = income_data.get('EBITDA')
                yahoo_ebit = income_data.get('EBIT')
                yahoo_operating_expense = income_data.get('Operating Expense')
                yahoo_interest_expense = income_data.get('Interest Expense')
                yahoo_tax_provision = income_data.get('Tax Provision')

                # Extract Cash Flow data
                yahoo_operating_cf = None
                yahoo_investing_cf = None
                yahoo_financing_cf = None
                yahoo_free_cashflow = None
                yahoo_capex = None

                if quarterly_cashflow is not None and yahoo_date in quarterly_cashflow.columns:
                    cf_data = quarterly_cashflow[yahoo_date]
                    yahoo_operating_cf = cf_data.get('Operating Cash Flow')
                    yahoo_investing_cf = cf_data.get('Investing Cash Flow')
                    yahoo_financing_cf = cf_data.get('Financing Cash Flow')
                    yahoo_free_cashflow = cf_data.get('Free Cash Flow')
                    yahoo_capex = cf_data.get('Capital Expenditure')

                # Extract Balance Sheet data
                yahoo_total_assets = None
                yahoo_current_assets = None
                yahoo_total_liabilities = None
                yahoo_current_liabilities = None
                yahoo_stockholders_equity = None
                yahoo_total_debt = None
                yahoo_cash = None
                yahoo_receivables = None
                yahoo_inventory = None
                yahoo_shares_outstanding = None

                if quarterly_balance is not None and yahoo_date in quarterly_balance.columns:
                    bs_data = quarterly_balance[yahoo_date]
                    yahoo_total_assets = bs_data.get('Total Assets')
                    yahoo_current_assets = bs_data.get('Current Assets')
                    yahoo_total_liabilities = bs_data.get('Total Liabilities Net Minority Interest')
                    yahoo_current_liabilities = bs_data.get('Current Liabilities')
                    yahoo_stockholders_equity = bs_data.get('Stockholders Equity')
                    yahoo_total_debt = bs_data.get('Total Debt')
                    yahoo_cash = bs_data.get('Cash And Cash Equivalents')
                    yahoo_receivables = bs_data.get('Receivables')
                    yahoo_inventory = bs_data.get('Inventory')
                    yahoo_shares_outstanding = bs_data.get('Ordinary Shares Number')

                # Calculate data quality score
                quality_score = self._calculate_yahoo_quality_score({
                    'revenue': yahoo_total_revenue,
                    'net_income': yahoo_net_income,
                    'assets': yahoo_total_assets,
                    'operating_cf': yahoo_operating_cf
                })

                # Store in database
                self.conn.execute("""
                    INSERT OR REPLACE INTO yahoo_quarterly_enrichment VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?,
                        ?, ?,
                        CURRENT_TIMESTAMP, ?
                    )
                """, [
                    symbol, fy, quarter, end_date,
                    yahoo_total_revenue, yahoo_gross_profit, yahoo_operating_income,
                    yahoo_net_income, yahoo_ebitda, yahoo_ebit, yahoo_operating_expense,
                    yahoo_interest_expense, yahoo_tax_provision,
                    yahoo_operating_cf, yahoo_investing_cf, yahoo_financing_cf,
                    yahoo_free_cashflow, yahoo_capex,
                    yahoo_total_assets, yahoo_current_assets, yahoo_total_liabilities,
                    yahoo_current_liabilities, yahoo_stockholders_equity, yahoo_total_debt,
                    yahoo_cash, yahoo_receivables, yahoo_inventory,
                    yahoo_shares_outstanding, info.get('marketCap'),
                    quality_score
                ])

                stored_count += 1

            if verbose:
                print(f'  ✅ Stored {stored_count} quarters of Yahoo data')

            return {
                'success': True,
                'quarters_stored': stored_count
            }

        except Exception as e:
            if verbose:
                print(f'  ❌ Error storing Yahoo data: {str(e)}')
            return {'success': False, 'error': str(e)}

    def _date_to_fy_quarter(self, end_date):
        """Convert date to Indian FY and Quarter"""
        month = end_date.month
        year = end_date.year

        # Indian FY runs Apr-Mar
        if month <= 3:
            fy = f'FY{year}'
        else:
            fy = f'FY{year + 1}'

        # Determine quarter
        if month in [6]:
            quarter = 'Q1'
        elif month in [9]:
            quarter = 'Q2'
        elif month in [12]:
            quarter = 'Q3'
        elif month in [3]:
            quarter = 'Q4'
        else:
            # Approximate to nearest quarter
            quarter = f'Q{(month - 1) // 3 + 1}'

        return fy, quarter

    def _calculate_yahoo_quality_score(self, data):
        """Calculate quality score for Yahoo data (0-100)"""
        score = 100

        # Penalize missing critical fields
        if not data.get('revenue'): score -= 30
        if not data.get('net_income'): score -= 30
        if not data.get('assets'): score -= 20
        if not data.get('operating_cf'): score -= 10

        # Yahoo data is generally complete, so this should usually be 100
        return max(0, score)

    def get_enrichment_status(self, symbol):
        """Check enrichment status for a symbol"""
        try:
            result = self.conn.execute("""
                SELECT
                    COUNT(*) as total_records,
                    SUM(CASE WHEN market_cap IS NOT NULL THEN 1 ELSE 0 END) as enriched_records,
                    MAX(yahoo_enriched_at) as last_enriched
                FROM xbrl_data
                WHERE symbol = ?
            """, [symbol]).fetchone()

            if result:
                total, enriched, last_enriched = result
                return {
                    'total_records': total,
                    'enriched_records': enriched,
                    'enrichment_percentage': round((enriched / total * 100) if total > 0 else 0, 1),
                    'last_enriched': last_enriched
                }
            else:
                return None

        except Exception as e:
            print(f'Error checking status: {e}')
            return None

    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()


# Example usage and testing
if __name__ == '__main__':
    import sys

    enricher = YahooXBRLEnricher()

    if len(sys.argv) > 1:
        # Enrich specific symbols
        for symbol in sys.argv[1:]:
            enricher.enrich_symbol(symbol.upper())

            # Show status
            status = enricher.get_enrichment_status(symbol.upper())
            if status:
                print(f'\n📊 Enrichment Status for {symbol.upper()}:')
                print(f'   Total records: {status["total_records"]}')
                print(f'   Enriched: {status["enriched_records"]} ({status["enrichment_percentage"]}%)')
                print(f'   Last enriched: {status["last_enriched"]}')
    else:
        # Enrich all symbols
        enricher.enrich_all_symbols()

    enricher.close()
