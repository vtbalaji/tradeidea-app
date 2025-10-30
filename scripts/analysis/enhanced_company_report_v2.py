#!/usr/bin/env python3
"""
Enhanced Company Analysis Report V2
Comprehensive institutional-grade investment analysis with 15+ deep insights

New Features Added:
✅ Tier 1: Peer Comparison, Management Quality, Dividend Analysis, Growth Trajectory, Earnings Quality
✅ Tier 2: Credit Quality, Institutional Holdings, Operational Efficiency, Segment Performance, Red Flags
✅ Tier 3: Scenario Analysis, Seasonality, Corporate Actions, Competitive Moat, Sector Context

Original sections:
1. Company Overview
2. Forensic Scores (M, Z, F, J)
3. Technical Analysis
4. Valuation
5. Final Recommendation
"""

import sys
import os
import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from collections import defaultdict

# Add forensics and shared directories to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
forensics_dir = os.path.join(parent_dir, 'forensics')
shared_dir = os.path.join(parent_dir, 'shared')
sys.path.insert(0, forensics_dir)
sys.path.insert(0, shared_dir)
sys.path.insert(0, parent_dir)

from forensics.multi_source_loader import MultiSourceDataLoader
from forensics.forensic_analyzer import ForensicAnalyzer
from shared.valuation import ValuationModels
from reports.quarterly_financial_report import QuarterlyFinancialReport
from analysis.report_displays import ReportDisplays

# Import sector analyzers
from sectors.banking_sector import BankingSectorAnalyzer
try:
    from sectors.it_sector import ITSectorAnalyzer
except ImportError:
    ITSectorAnalyzer = None  # Will be created

try:
    from sectors.capital_goods_sector import CapitalGoodsSectorAnalyzer
except ImportError:
    CapitalGoodsSectorAnalyzer = None


class EnhancedCompanyReportV2:
    """Generate comprehensive institutional-grade company analysis reports"""

    # Sector mapping (to be loaded from config or DB)
    SECTOR_PEERS = {
        'IT': ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'COFORGE', 'MPHASIS', 'PERSISTENT', 'LTTS'],
        'BANKING': ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK', 'SBIN', 'INDUSINDBK', 'FEDERALBNK', 'BANKBARODA'],
        'CAPITAL_GOODS': ['BHEL', 'LT', 'ABB', 'SIEMENS', 'THERMAX', 'CUMMINSIND', 'VOLTAS', 'HAVELLS', 'CROMPTON'],
        'AUTO': ['MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR', 'ASHOKLEY'],
        'PHARMA': ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'AUROPHARMA', 'LUPIN', 'BIOCON', 'TORNTPHARM'],
        'FMCG': ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR', 'MARICO', 'GODREJCP', 'COLPAL'],
    }

    def __init__(self, fundamentals_db='data/fundamentals.duckdb', eod_db='data/eod.duckdb'):
        """Initialize report generator"""
        self.fundamentals_db = fundamentals_db
        self.eod_db = eod_db

        # Connect to databases
        self.eod_conn = duckdb.connect(eod_db, read_only=True)
        self.fund_conn = duckdb.connect(fundamentals_db, read_only=True)

        # Initialize forensic analyzer
        self.analyzer = ForensicAnalyzer(fundamentals_db)

        # Initialize quarterly report generator
        self.quarterly_reporter = QuarterlyFinancialReport(fundamentals_db)

    def close(self):
        """Close connections"""
        if self.eod_conn:
            self.eod_conn.close()
        if self.fund_conn:
            self.fund_conn.close()
        if self.analyzer:
            self.analyzer.loader.close()

    # ============================================================================
    # TIER 1 FEATURES: Critical Additions
    # ============================================================================

    def get_growth_trajectory(self, historical_data):
        """
        Calculate comprehensive growth metrics (3Y CAGR)
        Returns: Dict with revenue/profit/eps growth trends
        """
        if not historical_data or len(historical_data) < 2:
            return None

        try:
            # Sort by year (newest first)
            sorted_data = sorted(historical_data, key=lambda x: x.get('fy', ''), reverse=True)

            if len(sorted_data) < 2:
                return None

            latest = sorted_data[0]

            # Use 3 years for CAGR calculation (if available)
            years = 3
            if len(sorted_data) >= 4:
                oldest = sorted_data[3]  # 3 years ago (index 3 = 4th item)
            else:
                # Fallback to all available years if less than 4 data points
                oldest = sorted_data[-1]
                years = len(sorted_data) - 1
                if years == 0:
                    years = 1

            # Helper function to calculate CAGR or absolute growth
            def calculate_growth(start_val, end_val, periods):
                """
                Returns tuple: (value, is_cagr, is_turnaround)
                - If CAGR can be calculated: (cagr_%, True, False)
                - If turnaround (negative to positive): (absolute_change, False, True)
                - Otherwise: (0, True, False)
                """
                if periods == 0:
                    return (0, True, False)

                # Check if it's a turnaround (negative to positive)
                if start_val <= 0 and end_val > 0:
                    return (end_val - start_val, False, True)

                # Cannot calculate CAGR if either value is non-positive
                if start_val <= 0 or end_val <= 0:
                    return (0, True, False)

                # Calculate CAGR
                return ((pow(end_val / start_val, 1 / periods) - 1) * 100, True, False)

            # Calculate growth metrics
            revenue_val, revenue_is_cagr, revenue_turnaround = calculate_growth(
                oldest.get('raw_revenue', 0) or 0,
                latest.get('raw_revenue', 0) or 0,
                years
            )

            profit_val, profit_is_cagr, profit_turnaround = calculate_growth(
                oldest.get('raw_net_profit', 0) or 0,
                latest.get('raw_net_profit', 0) or 0,
                years
            )

            eps_val, eps_is_cagr, eps_turnaround = calculate_growth(
                oldest.get('raw_eps', 0) or 0,
                latest.get('raw_eps', 0) or 0,
                years
            )

            book_value_val, book_value_is_cagr, book_value_turnaround = calculate_growth(
                oldest.get('raw_book_value', 0) or 0,
                latest.get('raw_book_value', 0) or 0,
                years
            )

            # Check consistency (positive growth every year)
            revenue_consistent = all(
                (sorted_data[i].get('raw_revenue', 0) or 0) >=
                (sorted_data[i+1].get('raw_revenue', 0) or 0)
                for i in range(len(sorted_data)-1)
            )

            profit_consistent = all(
                (sorted_data[i].get('raw_net_profit', 0) or 0) >= 0
                for i in range(len(sorted_data))
            )

            # Check if accelerating (compare recent 2Y vs 3Y)
            # Since we're now using 3Y, check if last 2Y growth > 3Y CAGR
            if len(sorted_data) >= 3 and profit_is_cagr:
                recent_2y_profit_val, recent_2y_is_cagr, _ = calculate_growth(
                    sorted_data[2].get('raw_net_profit', 0) or 0,
                    sorted_data[0].get('raw_net_profit', 0) or 0,
                    2
                )
                # Only compare if both are CAGR values
                is_accelerating = recent_2y_is_cagr and recent_2y_profit_val > profit_val
            else:
                is_accelerating = False

            # Margin expansion check
            latest_margin = latest.get('net_profit_margin', 0) or 0
            oldest_margin = oldest.get('net_profit_margin', 0) or 0
            margin_expansion = latest_margin > oldest_margin

            # Year-over-year growth
            yoy_growth = []
            for i in range(min(5, len(sorted_data)-1)):
                current_profit = sorted_data[i].get('raw_net_profit', 0) or 0
                previous_profit = sorted_data[i+1].get('raw_net_profit', 0) or 0

                if previous_profit > 0:
                    growth = ((current_profit - previous_profit) / previous_profit) * 100
                    yoy_growth.append({
                        'fy': sorted_data[i].get('fy', 'N/A'),
                        'revenue_growth': ((sorted_data[i].get('raw_revenue', 0) or 0) - (sorted_data[i+1].get('raw_revenue', 0) or 0)) / (sorted_data[i+1].get('raw_revenue', 0) or 1) * 100,
                        'profit_growth': growth
                    })

            return {
                'revenue_cagr': revenue_val,
                'revenue_is_cagr': revenue_is_cagr,
                'revenue_turnaround': revenue_turnaround,
                'profit_cagr': profit_val,
                'profit_is_cagr': profit_is_cagr,
                'profit_turnaround': profit_turnaround,
                'eps_cagr': eps_val,
                'eps_is_cagr': eps_is_cagr,
                'eps_turnaround': eps_turnaround,
                'book_value_cagr': book_value_val,
                'book_value_is_cagr': book_value_is_cagr,
                'revenue_consistent': revenue_consistent,
                'profit_consistent': profit_consistent,
                'is_accelerating': is_accelerating,
                'margin_expansion': margin_expansion,
                'yoy_growth': yoy_growth,
                'years_analyzed': years,
                'quality': 'High' if revenue_consistent and profit_consistent and margin_expansion else 'Medium' if profit_consistent else 'Low'
            }

        except Exception as e:
            print(f"  ⚠️ Error calculating growth trajectory: {e}")
            return None

    def get_dividend_analysis(self, historical_data):
        """
        Analyze dividend track record
        Returns: Dict with yield, payout, consistency, growth
        """
        if not historical_data or len(historical_data) < 2:
            return None

        try:
            sorted_data = sorted(historical_data, key=lambda x: x.get('fy', ''), reverse=True)

            dividends = []
            for item in sorted_data[:10]:  # Last 10 years
                dps = item.get('raw_dividend_per_share', 0) or 0
                if dps > 0:
                    dividends.append({
                        'fy': item.get('fy', 'N/A'),
                        'dps': dps,
                        'eps': item.get('raw_eps', 0) or 0,
                        'price': item.get('close_price', 0) or 0
                    })

            if len(dividends) < 2:
                return {'error': 'Insufficient dividend history'}

            latest = dividends[0]
            oldest = dividends[-1]

            # Current yield
            current_yield = (latest['dps'] / latest['price'] * 100) if latest['price'] > 0 else 0

            # 5Y average yield
            avg_yield = np.mean([d['dps'] / d['price'] * 100 for d in dividends if d['price'] > 0])

            # Payout ratio
            payout_ratio = (latest['dps'] / latest['eps'] * 100) if latest['eps'] > 0 else 0

            # Consistency (years of consecutive dividends)
            consecutive_years = len(dividends)

            # Growth rate
            years = len(dividends) - 1
            if years > 0 and oldest['dps'] > 0:
                div_growth = (pow(latest['dps'] / oldest['dps'], 1 / years) - 1) * 100
            else:
                div_growth = 0

            # Sustainability score (0-10)
            sustainability_score = 0
            if payout_ratio < 50: sustainability_score += 3  # Room to grow
            if consecutive_years >= 5: sustainability_score += 3  # Consistency
            if div_growth > 8: sustainability_score += 2  # Good growth
            if current_yield > 1.5: sustainability_score += 2  # Decent yield

            return {
                'current_yield': current_yield,
                'avg_yield_5y': avg_yield,
                'payout_ratio': payout_ratio,
                'consecutive_years': consecutive_years,
                'dividend_growth_cagr': div_growth,
                'sustainability_score': min(sustainability_score, 10),
                'dividend_history': dividends[:5],  # Last 5 years
                'quality': 'Excellent' if sustainability_score >= 8 else 'Good' if sustainability_score >= 6 else 'Fair'
            }

        except Exception as e:
            print(f"  ⚠️ Error calculating dividend analysis: {e}")
            return None

    def get_earnings_quality(self, historical_data):
        """
        Analyze earnings quality metrics
        Returns: Dict with cash conversion, accruals, DSO, quality score
        """
        if not historical_data or len(historical_data) < 1:
            return None

        try:
            latest = historical_data[0]

            # Cash Conversion Ratio (OCF / Net Profit)
            net_profit = latest.get('raw_net_profit', 0) or 0
            ocf = latest.get('raw_operating_cash_flow', 0) or 0

            cash_conversion = (ocf / net_profit * 100) if net_profit > 0 else 0

            # Accruals Ratio ((Net Income - OCF) / Total Assets)
            total_assets = latest.get('raw_total_assets', 0) or 0
            accruals_ratio = ((net_profit - ocf) / total_assets * 100) if total_assets > 0 else 0

            # Days Sales Outstanding (Receivables / Revenue * 365)
            receivables = latest.get('raw_trade_receivables', 0) or 0
            revenue = latest.get('raw_revenue', 0) or 0
            dso = (receivables / revenue * 365) if revenue > 0 else 0

            # Days Inventory Outstanding
            inventory = latest.get('raw_inventories', 0) or 0
            cogs = revenue * 0.7  # Approximate COGS (70% of revenue)
            dio = (inventory / cogs * 365) if cogs > 0 else 0

            # Working Capital Trend
            if len(historical_data) >= 3:
                wc_trend = 'Improving' if (
                    (historical_data[0].get('raw_current_assets', 0) or 0) - (historical_data[0].get('raw_current_liabilities', 0) or 0)
                ) > (
                    (historical_data[2].get('raw_current_assets', 0) or 0) - (historical_data[2].get('raw_current_liabilities', 0) or 0)
                ) else 'Declining'
            else:
                wc_trend = 'Unknown'

            # Quality Score (0-10)
            quality_score = 0
            if cash_conversion > 100: quality_score += 3  # Excellent
            elif cash_conversion > 80: quality_score += 2
            elif cash_conversion > 60: quality_score += 1

            if abs(accruals_ratio) < 3: quality_score += 2  # Low accruals
            if dso < 60: quality_score += 2  # Good collection
            if wc_trend == 'Improving': quality_score += 1
            if ocf > 0: quality_score += 2  # Positive cash flow

            return {
                'cash_conversion': cash_conversion,
                'accruals_ratio': accruals_ratio,
                'days_sales_outstanding': dso,
                'days_inventory': dio,
                'working_capital_trend': wc_trend,
                'quality_score': min(quality_score, 10),
                'assessment': 'Excellent' if quality_score >= 8 else 'Good' if quality_score >= 6 else 'Fair' if quality_score >= 4 else 'Poor'
            }

        except Exception as e:
            print(f"  ⚠️ Error calculating earnings quality: {e}")
            return None

    def get_peer_comparison(self, symbol, historical_data, sector='IT'):
        """
        Compare company with sector peers
        Returns: Dict with peer rankings and comparison metrics
        """
        if not historical_data or len(historical_data) < 1:
            return None

        try:
            # Get peers from sector mapping
            peers = self.SECTOR_PEERS.get(sector, [])
            if symbol not in peers:
                peers = [symbol] + peers[:9]  # Add symbol if not in list

            # Fetch peer data
            peer_data = []
            for peer_symbol in peers:
                try:
                    query = f"""
                        SELECT symbol, fy, quarter,
                               pe_ratio, roe, debt_to_equity,
                               revenue_growth, net_profit_margin,
                               raw_revenue, raw_net_profit
                        FROM xbrl_data
                        WHERE symbol = '{peer_symbol}'
                          AND statement_type = 'consolidated'
                          AND quarter = 'Q4'
                        ORDER BY fy DESC
                        LIMIT 1
                    """
                    result = self.fund_conn.execute(query).fetchone()

                    if result:
                        peer_data.append({
                            'symbol': result[0],
                            'pe_ratio': result[2] or 0,
                            'roe': result[3] or 0,
                            'debt_equity': result[4] or 0,
                            'revenue_growth': result[5] or 0,
                            'net_margin': result[6] or 0,
                        })
                except:
                    continue

            if len(peer_data) < 2:
                return {'error': 'Insufficient peer data'}

            # Calculate sector averages
            sector_avg = {
                'pe_ratio': np.mean([p['pe_ratio'] for p in peer_data if p['pe_ratio'] > 0]),
                'roe': np.mean([p['roe'] for p in peer_data if p['roe'] > 0]),
                'debt_equity': np.mean([p['debt_equity'] for p in peer_data]),
                'revenue_growth': np.mean([p['revenue_growth'] for p in peer_data]),
                'net_margin': np.mean([p['net_margin'] for p in peer_data if p['net_margin'] > 0]),
            }

            # Calculate rankings
            company_data = next((p for p in peer_data if p['symbol'] == symbol), None)

            if not company_data:
                return {'error': 'Company data not found'}

            rankings = {}
            for metric in ['roe', 'revenue_growth', 'net_margin']:
                sorted_peers = sorted(peer_data, key=lambda x: x[metric], reverse=True)
                rank = next((i+1 for i, p in enumerate(sorted_peers) if p['symbol'] == symbol), None)
                rankings[metric] = {'rank': rank, 'total': len(sorted_peers)}

            # For debt_equity and pe_ratio, lower is better
            for metric in ['debt_equity']:
                sorted_peers = sorted(peer_data, key=lambda x: x[metric])
                rank = next((i+1 for i, p in enumerate(sorted_peers) if p['symbol'] == symbol), None)
                rankings[metric] = {'rank': rank, 'total': len(sorted_peers)}

            return {
                'sector': sector,
                'peer_count': len(peer_data),
                'company_metrics': company_data,
                'sector_averages': sector_avg,
                'rankings': rankings,
                'peers': peer_data[:5],  # Top 5 peers for display
                'strengths': [k for k, v in rankings.items() if v['rank'] <= 3],
                'weaknesses': [k for k, v in rankings.items() if v['rank'] >= v['total'] - 2]
            }

        except Exception as e:
            print(f"  ⚠️ Error in peer comparison: {e}")
            return None

    def get_management_quality(self, historical_data):
        """
        Assess management quality based on shareholding and governance
        Returns: Dict with promoter holding, pledging, quality score
        """
        # Note: This requires shareholding pattern data
        # For now, analyze consistency and transparency from financial data
        if not historical_data or len(historical_data) < 3:
            return None

        try:
            quality_score = 5  # Base score
            indicators = []

            # Check consistent profitability
            profitable_years = sum(1 for d in historical_data[:5] if (d.get('raw_net_profit', 0) or 0) > 0)
            if profitable_years >= 4:
                quality_score += 2
                indicators.append('✅ Consistent profitability')

            # Check dividend consistency
            dividend_years = sum(1 for d in historical_data[:5] if (d.get('raw_dividend_per_share', 0) or 0) > 0)
            if dividend_years >= 3:
                quality_score += 1
                indicators.append('✅ Regular dividend payer')

            # Check ROE consistency
            avg_roe = np.mean([d.get('roe', 0) or 0 for d in historical_data[:5] if (d.get('roe', 0) or 0) > 0])
            if avg_roe > 15:
                quality_score += 2
                indicators.append(f'✅ Strong ROE ({avg_roe:.1f}%)')

            return {
                'quality_score': min(quality_score, 10),
                'indicators': indicators,
                'assessment': 'Excellent' if quality_score >= 8 else 'Good' if quality_score >= 6 else 'Fair',
                'note': 'Based on financial performance consistency (shareholding data not available)'
            }
        except Exception as e:
            print(f"  ⚠️ Error assessing management quality: {e}")
            return None

    # ============================================================================
    # TIER 2 FEATURES: High-Value Additions
    # ============================================================================

    def get_credit_quality(self, historical_data):
        """Analyze debt and credit metrics"""
        if not historical_data or len(historical_data) < 1:
            return None

        try:
            latest = historical_data[0]

            total_debt = latest.get('raw_total_debt', 0) or 0
            equity = latest.get('raw_total_equity', 0) or 0
            ebitda = latest.get('raw_ebitda', 0) or 0
            interest_expense = latest.get('raw_interest_expense', 0) or 0
            ebit = latest.get('raw_operating_profit', 0) or 0

            # Debt ratios
            debt_equity = (total_debt / equity) if equity > 0 else 0
            debt_ebitda = (total_debt / ebitda) if ebitda > 0 else 0
            interest_coverage = (ebit / interest_expense) if interest_expense > 0 else 999

            # Debt trend
            if len(historical_data) >= 3:
                debt_trend = 'Declining' if (historical_data[0].get('raw_total_debt', 0) or 0) < (historical_data[2].get('raw_total_debt', 0) or 999999999) else 'Increasing'
            else:
                debt_trend = 'Unknown'

            # Credit score (0-10)
            credit_score = 10
            if debt_equity > 1: credit_score -= 3
            elif debt_equity > 0.5: credit_score -= 1

            if interest_coverage < 2: credit_score -= 3
            elif interest_coverage < 5: credit_score -= 1

            if debt_trend == 'Increasing': credit_score -= 2

            return {
                'total_debt': total_debt,
                'debt_to_equity': debt_equity,
                'debt_to_ebitda': debt_ebitda,
                'interest_coverage': min(interest_coverage, 999),  # Cap at 999 for display
                'debt_trend': debt_trend,
                'credit_score': max(credit_score, 0),
                'assessment': 'Excellent' if credit_score >= 8 else 'Good' if credit_score >= 6 else 'Fair' if credit_score >= 4 else 'Poor'
            }

        except Exception as e:
            print(f"  ⚠️ Error calculating credit quality: {e}")
            return None

    def get_operational_efficiency(self, historical_data):
        """Calculate operational efficiency metrics"""
        if not historical_data or len(historical_data) < 1:
            return None

        try:
            latest = historical_data[0]

            revenue = latest.get('raw_revenue', 0) or 0
            total_assets = latest.get('raw_total_assets', 0) or 0
            net_profit = latest.get('raw_net_profit', 0) or 0
            capital_employed = (latest.get('raw_total_assets', 0) or 0) - (latest.get('raw_current_liabilities', 0) or 0)
            ebit = latest.get('raw_operating_profit', 0) or 0

            asset_turnover = (revenue / total_assets) if total_assets > 0 else 0
            roa = (net_profit / total_assets * 100) if total_assets > 0 else 0
            roce = (ebit / capital_employed * 100) if capital_employed > 0 else 0

            return {
                'asset_turnover': asset_turnover,
                'roa': roa,
                'roce': roce,
                'efficiency_score': min(int(asset_turnover * 5 + (roa / 5)), 10)
            }

        except Exception as e:
            print(f"  ⚠️ Error calculating operational efficiency: {e}")
            return None

    def get_institutional_holdings(self, symbol):
        """
        Analyze institutional holdings trends
        Returns: Dict with FII/DII holdings, trend analysis
        """
        # Note: This requires shareholding pattern data from NSE/BSE
        # Placeholder implementation for now
        return {
            'fii_holding_pct': 0,
            'dii_holding_pct': 0,
            'mutual_fund_holding_pct': 0,
            'trend': 'Unknown',
            'quality_score': 0,
            'note': 'Institutional holdings data integration pending'
        }

    def get_segment_performance(self, symbol):
        """
        Analyze segment-wise performance
        Returns: Dict with segment revenues, growth, margins
        """
        try:
            # Query segment data from xbrl_data (if available)
            query = f"""
                SELECT fy, quarter,
                       raw_segment_revenue, raw_segment_profit,
                       segment_name
                FROM xbrl_data
                WHERE symbol = '{symbol}'
                  AND statement_type = 'consolidated'
                  AND segment_name IS NOT NULL
                ORDER BY fy DESC, quarter DESC
                LIMIT 20
            """

            try:
                result = self.fund_conn.execute(query).fetchall()

                if result and len(result) > 0:
                    segments = defaultdict(list)
                    for row in result:
                        seg_name = row[4]
                        segments[seg_name].append({
                            'fy': row[0],
                            'revenue': row[2] or 0,
                            'profit': row[3] or 0
                        })

                    # Calculate segment metrics
                    segment_analysis = []
                    for seg_name, data in segments.items():
                        if len(data) >= 2:
                            latest = data[0]
                            previous = data[1]

                            growth = ((latest['revenue'] - previous['revenue']) / previous['revenue'] * 100) if previous['revenue'] > 0 else 0
                            margin = (latest['profit'] / latest['revenue'] * 100) if latest['revenue'] > 0 else 0

                            segment_analysis.append({
                                'name': seg_name,
                                'revenue': latest['revenue'],
                                'growth': growth,
                                'margin': margin
                            })

                    return {
                        'segments': segment_analysis,
                        'total_segments': len(segment_analysis),
                        'note': 'Segment data from XBRL filings'
                    }
            except:
                pass

            # If no segment data available
            return {
                'segments': [],
                'total_segments': 0,
                'note': 'Segment-wise data not available in XBRL filings'
            }

        except Exception as e:
            print(f"  ⚠️ Error analyzing segment performance: {e}")
            return None

    def get_red_flags(self, forensic_report, technical, historical_data):
        """Comprehensive red flags dashboard"""
        red_flags = []
        warnings = []

        try:
            # Financial red flags
            if forensic_report.get('beneish_m_score', {}).get('Risk_Category') == 'HIGH':
                red_flags.append('❌ High earnings manipulation risk (M-Score)')

            if forensic_report.get('altman_z_score', {}).get('Risk_Category') in ['Distress', 'High Risk']:
                red_flags.append('❌ High bankruptcy risk (Z-Score)')

            if forensic_report.get('piotroski_f_score', {}).get('F_Score', 0) <= 3:
                warnings.append('⚠️ Weak fundamental quality (F-Score ≤ 3)')

            # Earnings quality
            if historical_data and len(historical_data) > 0:
                latest = historical_data[0]
                ocf = latest.get('raw_operating_cash_flow', 0) or 0
                net_profit = latest.get('raw_net_profit', 0) or 0

                if net_profit > 0 and ocf < net_profit * 0.8:
                    warnings.append('⚠️ Low cash conversion (<80%)')

                # Debt check
                debt_equity = (latest.get('raw_total_debt', 0) or 0) / (latest.get('raw_total_equity', 0) or 1)
                if debt_equity > 2:
                    red_flags.append('❌ Very high leverage (D/E > 2.0)')
                elif debt_equity > 1:
                    warnings.append('⚠️ High leverage (D/E > 1.0)')

            # Technical red flags
            if technical:
                if 'Strong Downtrend' in technical.get('trend', ''):
                    warnings.append('⚠️ Strong bearish price trend')

                if technical.get('rsi', 50) > 85:
                    warnings.append('⚠️ Extremely overbought (RSI > 85)')

            return {
                'red_flags': red_flags,
                'warnings': warnings,
                'total_issues': len(red_flags) + len(warnings),
                'severity': 'HIGH' if len(red_flags) > 0 else 'MEDIUM' if len(warnings) > 2 else 'LOW'
            }

        except Exception as e:
            print(f"  ⚠️ Error generating red flags: {e}")
            return {'red_flags': [], 'warnings': [], 'total_issues': 0, 'severity': 'UNKNOWN'}

    # ============================================================================
    # TIER 3 FEATURES: Advanced
    # ============================================================================

    def get_scenario_analysis(self, historical_data, current_price):
        """Bull/Base/Bear case valuations"""
        if not historical_data or len(historical_data) < 2:
            return None

        try:
            latest = historical_data[0]
            eps = latest.get('raw_eps', 0) or 0

            growth_data = self.get_growth_trajectory(historical_data)
            if not growth_data:
                return None

            base_growth = growth_data['profit_cagr']

            # Scenarios
            bull_growth = base_growth * 1.5  # 50% higher growth
            bear_growth = base_growth * 0.5  # 50% lower growth

            # 3-year projections
            bull_eps_3y = eps * pow(1 + bull_growth/100, 3)
            base_eps_3y = eps * pow(1 + base_growth/100, 3)
            bear_eps_3y = eps * pow(1 + bear_growth/100, 3)

            # Fair P/E multiples
            bull_pe = 25  # Growth stock multiple
            base_pe = 20  # Fair multiple
            bear_pe = 15  # Value multiple

            # Target prices
            bull_target = bull_eps_3y * bull_pe
            base_target = base_eps_3y * base_pe
            bear_target = bear_eps_3y * bear_pe

            # Returns
            bull_return = ((bull_target - current_price) / current_price * 100) if current_price > 0 else 0
            base_return = ((base_target - current_price) / current_price * 100) if current_price > 0 else 0
            bear_return = ((bear_target - current_price) / current_price * 100) if current_price > 0 else 0

            return {
                'bull_case': {
                    'growth_assumption': bull_growth,
                    'target_price': bull_target,
                    'return_pct': bull_return
                },
                'base_case': {
                    'growth_assumption': base_growth,
                    'target_price': base_target,
                    'return_pct': base_return
                },
                'bear_case': {
                    'growth_assumption': bear_growth,
                    'target_price': bear_target,
                    'return_pct': bear_return
                },
                'probability_weighted': (bull_target * 0.25 + base_target * 0.5 + bear_target * 0.25),
                'risk_reward_ratio': abs(bull_return / bear_return) if bear_return != 0 else 0
            }

        except Exception as e:
            print(f"  ⚠️ Error in scenario analysis: {e}")
            return None

    def get_seasonality_analysis(self, symbol):
        """
        Analyze quarterly seasonality patterns
        Returns: Dict with seasonal trends, best/worst quarters
        """
        try:
            query = f"""
                SELECT quarter, fy,
                       raw_revenue, raw_net_profit, net_profit_margin
                FROM xbrl_data
                WHERE symbol = '{symbol}'
                  AND statement_type = 'consolidated'
                  AND quarter IN ('Q1', 'Q2', 'Q3', 'Q4')
                ORDER BY fy DESC, quarter DESC
                LIMIT 20
            """

            result = self.fund_conn.execute(query).fetchall()

            if not result or len(result) < 4:
                return {'note': 'Insufficient quarterly data for seasonality analysis'}

            # Group by quarter
            quarters = {'Q1': [], 'Q2': [], 'Q3': [], 'Q4': []}
            for row in result:
                q = row[0]
                if q in quarters:
                    quarters[q].append({
                        'revenue': row[2] or 0,
                        'profit': row[3] or 0,
                        'margin': row[4] or 0
                    })

            # Calculate averages by quarter
            quarter_stats = {}
            for q, data in quarters.items():
                if data:
                    quarter_stats[q] = {
                        'avg_revenue': np.mean([d['revenue'] for d in data]),
                        'avg_profit': np.mean([d['profit'] for d in data]),
                        'avg_margin': np.mean([d['margin'] for d in data])
                    }

            # Identify best/worst quarters
            if quarter_stats:
                best_q = max(quarter_stats.items(), key=lambda x: x[1]['avg_profit'])[0]
                worst_q = min(quarter_stats.items(), key=lambda x: x[1]['avg_profit'])[0]

                return {
                    'quarter_stats': quarter_stats,
                    'best_quarter': best_q,
                    'worst_quarter': worst_q,
                    'has_seasonality': max(quarter_stats.values(), key=lambda x: x['avg_profit'])['avg_profit'] >
                                       min(quarter_stats.values(), key=lambda x: x['avg_profit'])['avg_profit'] * 1.2
                }

            return {'note': 'Unable to calculate seasonality'}

        except Exception as e:
            print(f"  ⚠️ Error analyzing seasonality: {e}")
            return None

    def get_corporate_actions(self, symbol):
        """
        Analyze corporate actions history
        Returns: Dict with splits, bonuses, buybacks
        """
        # Note: This requires corporate actions data
        # Placeholder for now
        return {
            'splits': [],
            'bonuses': [],
            'buybacks': [],
            'note': 'Corporate actions data integration pending'
        }

    def get_competitive_moat(self, historical_data, peer_comparison):
        """
        Assess competitive moat strength
        Returns: Dict with moat indicators and score
        """
        if not historical_data or len(historical_data) < 3:
            return None

        try:
            moat_score = 0
            indicators = []

            # High ROE sustained over time
            avg_roe = np.mean([d.get('roe', 0) or 0 for d in historical_data[:5]])
            if avg_roe > 20:
                moat_score += 3
                indicators.append(f'✅ High ROE ({avg_roe:.1f}%) - pricing power')
            elif avg_roe > 15:
                moat_score += 2

            # High margins
            avg_margin = np.mean([d.get('net_profit_margin', 0) or 0 for d in historical_data[:5]])
            if avg_margin > 20:
                moat_score += 3
                indicators.append(f'✅ High margins ({avg_margin:.1f}%) - cost advantage')
            elif avg_margin > 15:
                moat_score += 2

            # Asset-light business model (high asset turnover)
            latest = historical_data[0]
            revenue = latest.get('raw_revenue', 0) or 0
            assets = latest.get('raw_total_assets', 0) or 0
            asset_turnover = (revenue / assets) if assets > 0 else 0

            if asset_turnover > 1.5:
                moat_score += 2
                indicators.append(f'✅ Asset-light model (turnover: {asset_turnover:.2f}x)')

            # Market leadership (from peer comparison)
            if peer_comparison and 'rankings' in peer_comparison:
                top_3_metrics = sum(1 for v in peer_comparison['rankings'].values() if v.get('rank', 99) <= 3)
                if top_3_metrics >= 2:
                    moat_score += 2
                    indicators.append('✅ Market leader in sector')

            return {
                'moat_score': min(moat_score, 10),
                'indicators': indicators,
                'strength': 'Wide' if moat_score >= 7 else 'Narrow' if moat_score >= 4 else 'None',
                'assessment': 'Strong competitive advantages' if moat_score >= 7 else 'Moderate advantages' if moat_score >= 4 else 'Limited advantages'
            }

        except Exception as e:
            print(f"  ⚠️ Error assessing competitive moat: {e}")
            return None

    def get_sector_context(self, sector, peer_comparison):
        """
        Provide sector-wide context and trends
        Returns: Dict with sector metrics, trends, outlook
        """
        if not peer_comparison or 'sector_averages' not in peer_comparison:
            return None

        try:
            sector_avg = peer_comparison['sector_averages']

            # Interpret sector metrics
            outlook_factors = []

            # Strong sector if avg ROE > 15%
            if sector_avg.get('roe', 0) > 15:
                outlook_factors.append('✅ Healthy sector ROE')
            else:
                outlook_factors.append('⚠️ Weak sector ROE')

            # Growth sector if avg revenue growth > 10%
            if sector_avg.get('revenue_growth', 0) > 10:
                outlook_factors.append('✅ Growing sector')
            else:
                outlook_factors.append('⚠️ Slow growth sector')

            # Leveraged sector?
            if sector_avg.get('debt_equity', 0) > 1:
                outlook_factors.append('⚠️ Highly leveraged sector')

            return {
                'sector': sector,
                'sector_averages': sector_avg,
                'outlook_factors': outlook_factors,
                'overall_outlook': 'Positive' if len([f for f in outlook_factors if '✅' in f]) >= 2 else 'Neutral'
            }

        except Exception as e:
            print(f"  ⚠️ Error generating sector context: {e}")
            return None

    # ============================================================================
    # BANKING-SPECIFIC METHODS
    # ============================================================================

    def get_banking_metrics(self, symbol):
        """Get banking-specific metrics for banks"""
        try:
            query = f"""
                SELECT
                    fy, quarter, end_date,
                    raw_interest_income, raw_interest_on_advances, raw_interest_on_investments,
                    raw_interest_on_rbi_balances, raw_interest_expense, raw_net_interest_income,
                    raw_non_interest_income, raw_fee_income, raw_provisions,
                    raw_advances, raw_deposits, raw_cash_with_rbi, raw_interbank_funds,
                    raw_revenue, raw_net_profit
                FROM xbrl_data
                WHERE symbol = '{symbol}'
                  AND is_annual = TRUE
                ORDER BY end_date DESC
                LIMIT 1
            """
            result = self.fund_conn.execute(query).fetchone()

            if not result:
                return None

            # Check if this is a banking company (has banking-specific fields)
            if not result[3]:  # raw_interest_income
                return None

            return {
                'fy': result[0],
                'quarter': result[1],
                'interest_income': result[3] / 10000000 if result[3] else 0,
                'interest_on_advances': result[4] / 10000000 if result[4] else 0,
                'interest_on_investments': result[5] / 10000000 if result[5] else 0,
                'interest_on_rbi': result[6] / 10000000 if result[6] else 0,
                'interest_expense': result[7] / 10000000 if result[7] else 0,
                'net_interest_income': result[8] / 10000000 if result[8] else 0,
                'non_interest_income': result[9] / 10000000 if result[9] else 0,
                'fee_income': result[10] / 10000000 if result[10] else 0,
                'provisions': result[11] / 10000000 if result[11] else 0,
                'advances': result[12] / 10000000 if result[12] else 0,
                'deposits': result[13] / 10000000 if result[13] else 0,
                'cash_with_rbi': result[14] / 10000000 if result[14] else 0,
                'interbank_funds': result[15] / 10000000 if result[15] else 0,
                'revenue': result[16] / 10000000 if result[16] else 0,
                'net_profit': result[17] / 10000000 if result[17] else 0,
            }
        except Exception as e:
            print(f"  ⚠️ Error getting banking metrics: {e}")
            return None

    # ============================================================================
    # EXISTING METHODS (from original enhanced_company_report.py)
    # ============================================================================

    def get_technical_analysis(self, symbol, days=252):
        """Get comprehensive technical analysis"""
        try:
            query = f"""
                SELECT date, open, high, low, close, volume
                FROM ohlcv
                WHERE symbol = '{symbol}'
                ORDER BY date DESC
                LIMIT {days}
            """
            df = self.eod_conn.execute(query).fetchdf()

            if df.empty:
                return None

            df = df.sort_values('date')
            close = df['close']
            high = df['high']
            low = df['low']
            volume = df['volume']

            # Moving Averages
            ma_20 = close.rolling(window=20).mean()
            ma_50 = close.rolling(window=50).mean()
            ma_200 = close.rolling(window=200).mean()

            # RSI
            delta = close.diff()
            gain = delta.where(delta > 0, 0).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))

            # MACD
            ema_fast = close.ewm(span=12, adjust=False).mean()
            ema_slow = close.ewm(span=26, adjust=False).mean()
            macd_line = ema_fast - ema_slow
            signal_line = macd_line.ewm(span=9, adjust=False).mean()

            # Bollinger Bands
            bb_ma = close.rolling(window=20).mean()
            bb_std = close.rolling(window=20).std()
            bb_upper = bb_ma + (2 * bb_std)
            bb_lower = bb_ma - (2 * bb_std)

            # Support and Resistance
            support_52w = low.rolling(window=252).min()
            resistance_52w = high.rolling(window=252).max()

            volume_ma_20 = volume.rolling(window=20).mean()

            latest = df.iloc[-1]
            current_price = latest['close']

            # Identify trend
            if not pd.isna(ma_20.iloc[-1]) and not pd.isna(ma_50.iloc[-1]) and not pd.isna(ma_200.iloc[-1]):
                if current_price > ma_20.iloc[-1] > ma_50.iloc[-1] > ma_200.iloc[-1]:
                    trend = 'Strong Uptrend'
                    trend_emoji = '🟢🟢🟢'
                elif current_price > ma_50.iloc[-1] > ma_200.iloc[-1]:
                    trend = 'Uptrend'
                    trend_emoji = '🟢🟢'
                elif current_price > ma_200.iloc[-1]:
                    trend = 'Weak Uptrend'
                    trend_emoji = '🟢'
                elif current_price < ma_20.iloc[-1] < ma_50.iloc[-1] < ma_200.iloc[-1]:
                    trend = 'Strong Downtrend'
                    trend_emoji = '🔴🔴🔴'
                elif current_price < ma_50.iloc[-1] < ma_200.iloc[-1]:
                    trend = 'Downtrend'
                    trend_emoji = '🔴🔴'
                elif current_price < ma_200.iloc[-1]:
                    trend = 'Weak Downtrend'
                    trend_emoji = '🔴'
                else:
                    trend = 'Sideways'
                    trend_emoji = '🟡'
            else:
                trend = 'Unknown'
                trend_emoji = '⚪'

            # Performance metrics
            price_1m_ago = close.iloc[-21] if len(close) >= 21 else close.iloc[0]
            price_3m_ago = close.iloc[-63] if len(close) >= 63 else close.iloc[0]
            price_6m_ago = close.iloc[-126] if len(close) >= 126 else close.iloc[0]
            price_1y_ago = close.iloc[0]

            perf_1m = ((current_price - price_1m_ago) / price_1m_ago * 100)
            perf_3m = ((current_price - price_3m_ago) / price_3m_ago * 100)
            perf_6m = ((current_price - price_6m_ago) / price_6m_ago * 100)
            perf_1y = ((current_price - price_1y_ago) / price_1y_ago * 100)

            # Volatility
            returns = close.pct_change()
            volatility = returns.std() * np.sqrt(252) * 100

            return {
                'current_price': float(current_price),
                'trend': trend,
                'trend_emoji': trend_emoji,
                'ma_20': float(ma_20.iloc[-1]) if not pd.isna(ma_20.iloc[-1]) else 0,
                'ma_50': float(ma_50.iloc[-1]) if not pd.isna(ma_50.iloc[-1]) else 0,
                'ma_200': float(ma_200.iloc[-1]) if not pd.isna(ma_200.iloc[-1]) else 0,
                'rsi': float(rsi.iloc[-1]) if not pd.isna(rsi.iloc[-1]) else 50,
                'macd': float(macd_line.iloc[-1]) if not pd.isna(macd_line.iloc[-1]) else 0,
                'macd_signal': float(signal_line.iloc[-1]) if not pd.isna(signal_line.iloc[-1]) else 0,
                'bb_upper': float(bb_upper.iloc[-1]) if not pd.isna(bb_upper.iloc[-1]) else 0,
                'bb_lower': float(bb_lower.iloc[-1]) if not pd.isna(bb_lower.iloc[-1]) else 0,
                'support_52w': float(support_52w.iloc[-1]) if not pd.isna(support_52w.iloc[-1]) else 0,
                'resistance_52w': float(resistance_52w.iloc[-1]) if not pd.isna(resistance_52w.iloc[-1]) else 0,
                'volume_ratio': float(latest['volume'] / volume_ma_20.iloc[-1]) if not pd.isna(volume_ma_20.iloc[-1]) and volume_ma_20.iloc[-1] > 0 else 1,
                'perf_1m': perf_1m,
                'perf_3m': perf_3m,
                'perf_6m': perf_6m,
                'perf_1y': perf_1y,
                'volatility': volatility,
                'last_updated': latest['date'].strftime('%Y-%m-%d')
            }

        except Exception as e:
            print(f"  ⚠️ Error getting technical analysis: {e}")
            return None

    def calculate_intrinsic_value(self, data, current_price=None):
        """Calculate intrinsic value using shared valuation module"""
        if not data or len(data) < 1:
            return None

        latest = data[0]
        return ValuationModels.calculate_intrinsic_value(latest, current_price)

    def detect_sector(self, symbol):
        """Auto-detect sector for a symbol"""
        # Check SECTOR_PEERS mapping
        for sector, symbols in self.SECTOR_PEERS.items():
            if symbol in symbols:
                return sector

        # Default to IT if unknown
        return 'IT'

    def get_sector_analysis(self, symbol, data, sector=None):
        """
        Get sector-specific analysis

        Args:
            symbol: Stock symbol
            data: Historical financial data
            sector: Sector name (auto-detected if None)

        Returns:
            Dict with sector analysis or None
        """
        if not data or len(data) == 0:
            return None

        if not sector:
            sector = self.detect_sector(symbol)

        try:
            if sector == 'BANKING':
                # Get peer list
                peers = [s for s in self.SECTOR_PEERS.get('BANKING', []) if s != symbol][:4]
                analyzer = BankingSectorAnalyzer(symbol, data, peers)
                return analyzer.analyze()
            elif sector == 'IT' and ITSectorAnalyzer:
                peers = [s for s in self.SECTOR_PEERS.get('IT', []) if s != symbol][:4]
                analyzer = ITSectorAnalyzer(symbol, data, peers)
                return analyzer.analyze()
            elif sector == 'CAPITAL_GOODS' and CapitalGoodsSectorAnalyzer:
                peers = [s for s in self.SECTOR_PEERS.get('CAPITAL_GOODS', []) if s != symbol][:4]
                analyzer = CapitalGoodsSectorAnalyzer(symbol, data, peers)
                return analyzer.analyze()
            else:
                return None
        except Exception as e:
            print(f'  ⚠️  Error in sector analysis: {e}')
            return None

    def generate_recommendation(self, forensic_report, technical, intrinsic_value, current_price,
                               growth_metrics, earnings_quality, credit_quality):
        """Generate enhanced BUY/HOLD/SELL recommendation"""
        score = 0
        reasons = []

        # Forensic Analysis (30 points)
        if 'beneish_m_score' in forensic_report:
            m_risk = forensic_report['beneish_m_score'].get('Risk_Category', 'Unknown')
            if m_risk == 'LOW':
                score += 8
                reasons.append('✅ Low fraud risk (M-Score)')
            elif m_risk == 'HIGH':
                score -= 10
                reasons.append('❌ High fraud risk (M-Score)')

        if 'altman_z_score' in forensic_report:
            z_risk = forensic_report['altman_z_score'].get('Risk_Category', 'Unknown')
            if z_risk == 'Safe':
                score += 8
                reasons.append('✅ Low bankruptcy risk (Z-Score)')
            elif z_risk in ['Distress', 'High Risk']:
                score -= 10
                reasons.append('❌ High bankruptcy risk (Z-Score)')

        if 'piotroski_f_score' in forensic_report:
            f_score = forensic_report['piotroski_f_score'].get('F_Score', 0)
            if f_score >= 7:
                score += 14
                reasons.append(f'✅ High quality fundamentals (F-Score: {f_score}/9)')
            elif f_score <= 3:
                score -= 5
                reasons.append(f'⚠️ Weak fundamentals (F-Score: {f_score}/9)')

        # Growth Quality (20 points)
        if growth_metrics:
            if growth_metrics['profit_cagr'] > 15:
                score += 12
                reasons.append(f'✅ Strong profit growth ({growth_metrics["profit_cagr"]:.1f}% CAGR)')
            elif growth_metrics['profit_cagr'] > 10:
                score += 8
                reasons.append(f'✅ Good profit growth ({growth_metrics["profit_cagr"]:.1f}% CAGR)')

            if growth_metrics.get('is_accelerating'):
                score += 4
                reasons.append('✅ Growth accelerating')

            if growth_metrics.get('margin_expansion'):
                score += 4
                reasons.append('✅ Margin expansion')

        # Earnings Quality (15 points)
        if earnings_quality:
            if earnings_quality['quality_score'] >= 8:
                score += 10
                reasons.append(f'✅ Excellent earnings quality ({earnings_quality["quality_score"]}/10)')
            elif earnings_quality['quality_score'] >= 6:
                score += 5
                reasons.append(f'✅ Good earnings quality ({earnings_quality["quality_score"]}/10)')

            if earnings_quality['cash_conversion'] > 100:
                score += 5
                reasons.append(f'✅ Cash conversion > 100% ({earnings_quality["cash_conversion"]:.0f}%)')

        # Credit Quality (10 points)
        if credit_quality:
            if credit_quality['credit_score'] >= 8:
                score += 10
                reasons.append('✅ Excellent financial health (low debt)')
            elif credit_quality['credit_score'] >= 6:
                score += 5

        # Technical Analysis (15 points)
        if technical:
            if 'Strong Uptrend' in technical['trend']:
                score += 10
                reasons.append(f'✅ Strong price momentum ({technical["trend"]})')
            elif 'Uptrend' in technical['trend']:
                score += 5
            elif 'Downtrend' in technical['trend']:
                score -= 8
                reasons.append(f'❌ Negative price trend ({technical["trend"]})')

            if 50 <= technical['rsi'] <= 70:
                score += 5
            elif technical['rsi'] < 30:
                score += 3
                reasons.append(f'⚠️ Oversold (RSI: {technical["rsi"]:.1f})')
            elif technical['rsi'] > 80:
                score -= 5
                reasons.append(f'⚠️ Overbought (RSI: {technical["rsi"]:.1f})')

        # Valuation (10 points)
        if intrinsic_value and intrinsic_value.get('average_intrinsic', 0) > 0:
            value_diff = ((intrinsic_value['average_intrinsic'] - current_price) / current_price * 100)

            if value_diff > 25:
                score += 10
                reasons.append(f'✅ Significantly undervalued ({value_diff:.1f}% below intrinsic)')
            elif value_diff > 10:
                score += 7
                reasons.append(f'✅ Undervalued ({value_diff:.1f}% below intrinsic)')
            elif value_diff > -10:
                score += 5
            elif value_diff > -25:
                score -= 3
                reasons.append(f'⚠️ Overvalued ({abs(value_diff):.1f}% above intrinsic)')
            else:
                score -= 10
                reasons.append(f'❌ Significantly overvalued ({abs(value_diff):.1f}% above intrinsic)')

        # Determine recommendation
        if score >= 60:
            recommendation = 'STRONG BUY'
            emoji = '🟢🟢🟢'
        elif score >= 40:
            recommendation = 'BUY'
            emoji = '🟢🟢'
        elif score >= 20:
            recommendation = 'HOLD'
            emoji = '🟡'
        elif score >= 0:
            recommendation = 'WEAK HOLD'
            emoji = '🟠'
        elif score >= -20:
            recommendation = 'SELL'
            emoji = '🔴🔴'
        else:
            recommendation = 'STRONG SELL'
            emoji = '🔴🔴🔴'

        return {
            'recommendation': recommendation,
            'emoji': emoji,
            'score': score,
            'reasons': reasons
        }

    def generate_report(self, symbol, years=5, sector='IT', peers=None):
        """Generate comprehensive institutional-grade analysis report"""
        print(f'\n{"="*80}')
        print(f'📊 INSTITUTIONAL-GRADE COMPANY ANALYSIS V2: {symbol}')
        print(f'{"="*80}\n')

        # Get forensic analysis
        print('🔍 Running forensic analysis...')
        forensic_report = self.analyzer.analyze_company(symbol, statement_type='auto', years=years)

        if not forensic_report:
            print(f'❌ No fundamental data available for {symbol}')
            return None

        # Get historical data
        fund_data = forensic_report.get('_loaded_data')
        if not fund_data:
            fund_data = self.analyzer.loader.get_annual_data_multi_source(symbol, years=years)

        # Enrich fund_data with calculated ratios and margins from DB
        if fund_data and len(fund_data) > 0:
            try:
                # Fetch calculated fields for all years in fund_data
                query = f"""
                    SELECT fy, quarter,
                           pe, pb, ps, ev_ebitda, current_price, market_cap,
                           ebitda_margin, operating_profit_margin, net_profit_margin,
                           roe, roa, roce,
                           raw_revenue, raw_operating_profit, raw_assets, raw_current_liabilities
                    FROM xbrl_data
                    WHERE symbol = '{symbol}'
                      AND statement_type = 'consolidated'
                    ORDER BY fy DESC, quarter DESC
                    LIMIT {years * 4}
                """
                db_records = self.fund_conn.execute(query).fetchall()

                # Create a lookup dict by period
                db_dict = {}
                for rec in db_records:
                    fy = rec[0]
                    if fy not in db_dict:  # Take latest quarter for each FY
                        db_dict[fy] = {
                            'pe': rec[2], 'pb': rec[3], 'ps': rec[4], 'ev_ebitda': rec[5],
                            'current_price': rec[6], 'market_cap': rec[7],
                            'ebitda_margin': rec[8], 'operating_profit_margin': rec[9],
                            'net_profit_margin': rec[10],
                            'roe': rec[11], 'roa': rec[12], 'roce': rec[13],
                            'raw_revenue': rec[14], 'raw_operating_profit': rec[15],
                            'raw_assets': rec[16], 'raw_current_liabilities': rec[17]
                        }

                # Enrich each record in fund_data
                for record in fund_data:
                    period_end = record.get('period_end', '')
                    fy = period_end[:6] if period_end else None  # Extract FY2025 from period_end

                    if fy and fy in db_dict:
                        db_data = db_dict[fy]
                        # Add calculated fields if missing
                        for key, value in db_data.items():
                            if value is not None and not record.get(key):
                                record[key] = value

                # print(f'  ✅ Enriched {len(fund_data)} records with calculated fields')
            except Exception as e:
                print(f'  ⚠️  Error enriching data: {e}')

        if not fund_data or len(fund_data) == 0:
            print('  ℹ️  No annual data found, fetching latest quarterly data from DB...')
            try:
                query = f"""
                    SELECT * FROM xbrl_data
                    WHERE symbol = '{symbol}'
                    ORDER BY end_date DESC
                    LIMIT 1
                """
                result = self.fund_conn.execute(query).fetchdf()
                if not result.empty:
                    fund_data = [result.iloc[0].to_dict()]
                    print(f'  ✅ Loaded quarterly data: {fund_data[0].get("fy")} {fund_data[0].get("quarter")} - PE: {fund_data[0].get("pe")}')
            except Exception as e:
                print(f'  ⚠️  Error fetching quarterly data: {e}')

        # Get technical analysis
        print('📈 Analyzing technical indicators...')
        technical = self.get_technical_analysis(symbol)
        current_price = technical['current_price'] if technical else 0

        # ===== TIER 1 FEATURES =====
        print('📊 Calculating growth trajectory...')
        growth_metrics = self.get_growth_trajectory(fund_data)

        print('💰 Analyzing dividend track record...')
        dividend_analysis = self.get_dividend_analysis(fund_data)

        print('💎 Evaluating earnings quality...')
        earnings_quality = self.get_earnings_quality(fund_data)

        print('🏆 Comparing with sector peers...')
        peer_comparison = self.get_peer_comparison(symbol, fund_data, sector)

        print('👔 Assessing management quality...')
        management_quality = self.get_management_quality(fund_data)

        # ===== TIER 2 FEATURES =====
        print('📊 Assessing credit quality...')
        credit_quality = self.get_credit_quality(fund_data)

        print('⚙️  Calculating operational efficiency...')
        operational_efficiency = self.get_operational_efficiency(fund_data)

        print('🏛️  Analyzing institutional holdings...')
        institutional_holdings = self.get_institutional_holdings(symbol)

        print('📦 Evaluating segment performance...')
        segment_performance = self.get_segment_performance(symbol)

        print('🚩 Scanning for red flags...')
        red_flags = self.get_red_flags(forensic_report, technical, fund_data)

        # ===== TIER 3 FEATURES =====
        print('🎭 Running scenario analysis...')
        scenario_analysis = self.get_scenario_analysis(fund_data, current_price)

        print('📅 Analyzing seasonality patterns...')
        seasonality = self.get_seasonality_analysis(symbol)

        print('📜 Checking corporate actions...')
        corporate_actions = self.get_corporate_actions(symbol)

        print('🏰 Assessing competitive moat...')
        competitive_moat = self.get_competitive_moat(fund_data, peer_comparison)

        print('🌍 Analyzing sector context...')
        sector_context = self.get_sector_context(sector, peer_comparison)

        # Banking metrics (if applicable)
        print('🏦 Checking banking-specific metrics...')
        banking_metrics = self.get_banking_metrics(symbol)

        # Sector-specific analysis
        print('🎯 Running sector-specific analysis...')
        sector_analysis = self.get_sector_analysis(symbol, fund_data, sector)

        # Intrinsic value
        print('💰 Calculating intrinsic value...')
        intrinsic_value = self.calculate_intrinsic_value(fund_data, current_price)

        # Final recommendation
        print('🎯 Generating enhanced recommendation...\n')
        recommendation = self.generate_recommendation(
            forensic_report, technical, intrinsic_value, current_price,
            growth_metrics, earnings_quality, credit_quality
        )

        # SECTION 2: Quarterly Financials
        print('\n' + '='*80)
        print('📊 SECTION 2: QUARTERLY FINANCIALS')
        print('='*80)
        quarterly_data = None
        try:
            ReportDisplays.print_quarterly_financials(self.quarterly_reporter, symbol, num_quarters=5)
            # Also capture the data for JSON output
            sector_type = self.quarterly_reporter.detect_sector(symbol)
            if sector_type == 'BANKING':
                quarterly_data = self.quarterly_reporter.get_banking_quarterly_data(symbol, num_quarters=5)
            else:
                quarterly_data = self.quarterly_reporter.get_quarterly_data(symbol, num_quarters=5)
        except Exception as e:
            print(f'⚠️  Error displaying quarterly financials: {e}')

        # SECTION 3: Peer Comparison (if peers provided)
        peer_comparison_details = None
        if peers and len(peers) > 0:
            print('\n' + '='*80)
            print('🤝 SECTION 3: PEER COMPARISON')
            print('='*80)
            try:
                ReportDisplays.print_peer_comparison(self.quarterly_reporter, symbol, peers)
                # Also capture the data for JSON output
                all_companies = [symbol] + peers
                peer_comparison_details = {}
                sector_type = self.quarterly_reporter.detect_sector(symbol)

                for company in all_companies:
                    if sector_type == 'BANKING':
                        company_data = self.quarterly_reporter.get_banking_quarterly_data(company, num_quarters=1)
                    else:
                        company_data = self.quarterly_reporter.get_quarterly_data(company, num_quarters=1)

                    if company_data and len(company_data) > 0:
                        peer_comparison_details[company] = company_data[0]
            except Exception as e:
                print(f'⚠️  Error displaying peer comparison: {e}')

        # Print comprehensive report
        self._print_comprehensive_report(
            symbol, forensic_report, technical, intrinsic_value, recommendation,
            fund_data, growth_metrics, dividend_analysis, earnings_quality,
            peer_comparison, management_quality, credit_quality, operational_efficiency,
            institutional_holdings, segment_performance, red_flags, scenario_analysis,
            seasonality, corporate_actions, competitive_moat, sector_context, banking_metrics,
            sector_analysis
        )

        return {
            'symbol': symbol,
            'timestamp': datetime.now().isoformat(),
            'forensic': forensic_report,
            'technical': technical,
            'quarterly_financials': quarterly_data,
            'peer_comparison_details': peer_comparison_details,
            'growth_metrics': growth_metrics,
            'dividend_analysis': dividend_analysis,
            'earnings_quality': earnings_quality,
            'peer_comparison': peer_comparison,
            'management_quality': management_quality,
            'credit_quality': credit_quality,
            'operational_efficiency': operational_efficiency,
            'institutional_holdings': institutional_holdings,
            'segment_performance': segment_performance,
            'red_flags': red_flags,
            'scenario_analysis': scenario_analysis,
            'seasonality': seasonality,
            'corporate_actions': corporate_actions,
            'competitive_moat': competitive_moat,
            'sector_context': sector_context,
            'sector_analysis': sector_analysis,
            'intrinsic_value': intrinsic_value,
            'recommendation': recommendation
        }

    def _print_comprehensive_report(self, symbol, forensic, technical, intrinsic, recommendation,
                                   fundamentals, growth, dividend, earnings_qual, peer_comp,
                                   management, credit, efficiency, institutional, segments,
                                   red_flags, scenarios, seasonality, corp_actions, moat, sector_ctx, banking_metrics=None,
                                   sector_analysis=None):
        """Print beautified comprehensive report"""

        print(f'\n{"="*80}')
        print(f'╔{"═"*78}╗')
        print(f'║  📊 COMPREHENSIVE INVESTMENT REPORT: {symbol:40}  ║')
        print(f'║  Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")}                                          ║')
        print(f'╚{"═"*78}╝')
        print(f'{"="*80}\n')

        # Executive Summary
        print(f'┌{"─"*78}┐')
        print(f'│  1. EXECUTIVE SUMMARY{" "*55}│')
        print(f'├{"─"*78}┤')
        print(f'│  Recommendation: {recommendation["emoji"]} {recommendation["recommendation"]:<25} Score: {recommendation["score"]}/100  │')
        if scenarios:
            target = f'₹{scenarios["base_case"]["target_price"]:.2f}'
            upside = f'{scenarios["base_case"]["return_pct"]:+.1f}%'
            print(f'│  Target Price (3Y): {target:<20} Upside: {upside:<10}     │')
            print(f'│  Risk/Reward: {scenarios["risk_reward_ratio"]:.2f}x{" "*52}│')
        print(f'└{"─"*78}┘\n')

        # Company Snapshot
        if fundamentals and len(fundamentals) > 0:
            latest = fundamentals[0]
            print(f'┌{"─"*78}┐')
            print(f'│  2. COMPANY SNAPSHOT{" "*57}│')
            print(f'├{"─"*78}┤')
            print(f'│  Market Cap: ₹{(latest.get("market_cap", 0) or 0) / 10000000:,.0f} Cr{" "*50}│')
            print(f'│  Revenue: ₹{(latest.get("raw_revenue", 0) or 0) / 10000000:,.0f} Cr ({latest.get("fy", "N/A")}){" "*40}│')
            if technical:
                print(f'│  Current Price: ₹{technical["current_price"]:.2f}{" "*55}│')
                print(f'│  52W Range: ₹{technical["support_52w"]:.2f} - ₹{technical["resistance_52w"]:.2f}{" "*45}│')
            print(f'└{"─"*78}┘\n')

        # Banking-Specific Metrics (if available)
        if banking_metrics:
            print(f'┌{"─"*78}┐')
            print(f'│  🏦 BANKING METRICS ({banking_metrics["fy"]}){" "*52}│')
            print(f'├{"─"*78}┤')
            print(f'│  Interest Income (Total): ₹{banking_metrics["interest_income"]:,.0f} Cr{" "*35}│')
            if banking_metrics["interest_on_advances"] > 0:
                print(f'│    • From Advances: ₹{banking_metrics["interest_on_advances"]:,.0f} Cr{" "*40}│')
            if banking_metrics["interest_on_investments"] > 0:
                print(f'│    • From Investments: ₹{banking_metrics["interest_on_investments"]:,.0f} Cr{" "*37}│')
            if banking_metrics["interest_on_rbi"] > 0:
                print(f'│    • From RBI Balances: ₹{banking_metrics["interest_on_rbi"]:,.0f} Cr{" "*36}│')
            print(f'│  Interest Expense: ₹{banking_metrics["interest_expense"]:,.0f} Cr{" "*38}│')
            print(f'│  Net Interest Income (NII): ₹{banking_metrics["net_interest_income"]:,.0f} Cr{" "*28}│')
            if banking_metrics["net_interest_income"] > 0 and banking_metrics["revenue"] > 0:
                nim = (banking_metrics["net_interest_income"] / banking_metrics["revenue"]) * 100
                print(f'│  Net Interest Margin: {nim:.2f}%{" "*50}│')
            print(f'│{" "*78}│')
            print(f'│  Advances (Loans): ₹{banking_metrics["advances"]:,.0f} Cr{" "*38}│')
            print(f'│  Deposits: ₹{banking_metrics["deposits"]:,.0f} Cr{" "*48}│')
            if banking_metrics["cash_with_rbi"] > 0:
                print(f'│  Cash with RBI: ₹{banking_metrics["cash_with_rbi"]:,.0f} Cr{" "*42}│')
            if banking_metrics["provisions"] > 0:
                print(f'│  Provisions: ₹{banking_metrics["provisions"]:,.0f} Cr{" "*45}│')
            print(f'└{"─"*78}┘\n')

        # Growth Trajectory
        if growth:
            print(f'┌{"─"*78}┐')
            print(f'│  3. GROWTH TRAJECTORY (3 Years){" "*46}│')
            print(f'├{"─"*78}┤')

            # Revenue line
            if growth.get('revenue_is_cagr'):
                rev_display = f"{growth['revenue_cagr']:.1f}%"
                rev_icon = "✅" if growth["revenue_cagr"] > 12 else "⚠️"
            elif growth.get('revenue_turnaround'):
                # Convert from rupees to crores (1 crore = 10,000,000 rupees)
                rev_cr = growth['revenue_cagr'] / 10000000
                rev_display = f"+₹{rev_cr:,.0f} Cr (Turnaround)"
                rev_icon = "🔄"
            else:
                rev_display = "N/A"
                rev_icon = "⚠️"
            print(f'│  Revenue CAGR: {rev_display:<30} {rev_icon}{" "*(46-len(rev_display))}│')

            # Profit line
            if growth.get('profit_is_cagr'):
                profit_display = f"{growth['profit_cagr']:.1f}%"
                profit_icon = "✅" if growth["profit_cagr"] > 15 else "⚠️"
            elif growth.get('profit_turnaround'):
                # Convert from rupees to crores (1 crore = 10,000,000 rupees)
                profit_cr = growth['profit_cagr'] / 10000000
                profit_display = f"+₹{profit_cr:,.0f} Cr (Turnaround)"
                profit_icon = "🔄"
            else:
                profit_display = "N/A"
                profit_icon = "⚠️"
            print(f'│  Profit CAGR: {profit_display:<30} {profit_icon}{" "*(47-len(profit_display))}│')

            # EPS line
            if growth.get('eps_is_cagr'):
                eps_display = f"{growth['eps_cagr']:.1f}%"
                eps_icon = "✅" if growth["eps_cagr"] > 15 else "⚠️"
            elif growth.get('eps_turnaround'):
                # EPS is already in rupees per share, no conversion needed
                eps_display = f"+₹{growth['eps_cagr']:.2f} (Turnaround)"
                eps_icon = "🔄"
            else:
                eps_display = "N/A"
                eps_icon = "⚠️"
            print(f'│  EPS CAGR: {eps_display:<30} {eps_icon}{" "*(50-len(eps_display))}│')

            print(f'│  Quality: {growth["quality"]:<20} {"✅" if growth["quality"] == "High" else "⚠️"}{" "*43}│')
            if growth.get('is_accelerating'):
                print(f'│  🚀 Growth accelerating (last 2Y > 3Y CAGR){" "*33}│')
            if growth.get('margin_expansion'):
                print(f'│  📈 Margin expansion observed{" "*46}│')
            print(f'└{"─"*78}┘\n')

        # Peer Comparison
        if peer_comp and 'error' not in peer_comp:
            print(f'┌{"─"*78}┐')
            print(f'│  4. PEER COMPARISON (Sector: {peer_comp["sector"]}){" "*46}│')
            print(f'├{"─"*78}┤')
            rankings = peer_comp['rankings']
            print(f'│  ROE: Rank #{rankings.get("roe", {}).get("rank", "N/A")}/{rankings.get("roe", {}).get("total", "N/A")}{" "*60}│')
            print(f'│  Revenue Growth: Rank #{rankings.get("revenue_growth", {}).get("rank", "N/A")}/{rankings.get("revenue_growth", {}).get("total", "N/A")}{" "*51}│')
            print(f'│  Net Margin: Rank #{rankings.get("net_margin", {}).get("rank", "N/A")}/{rankings.get("net_margin", {}).get("total", "N/A")}{" "*54}│')
            if peer_comp.get('strengths'):
                print(f'│  💪 Strengths: {", ".join(peer_comp["strengths"])}{" "*50}│')
            print(f'└{"─"*78}┘\n')

        # Forensic Analysis Section - ENHANCED
        print(f'\n{"="*80}')
        print('🔍 SECTION 5: COMPREHENSIVE FORENSIC ANALYSIS')
        print(f'{"="*80}')

        try:
            ReportDisplays.print_detailed_forensics(forensic)
        except Exception as e:
            print(f'⚠️  Error displaying detailed forensics: {e}')
            # Fallback to basic display
            if 'M_Score' in forensic:
                print(f"   M-Score: {forensic['M_Score'].get('M_Score', 'N/A')}")
            if 'Z_Score' in forensic:
                print(f"   Z-Score: {forensic['Z_Score'].get('Z_Score', 'N/A')}")
            if 'F_Score' in forensic:
                print(f"   F-Score: {forensic['F_Score'].get('F_Score', 'N/A')}")

        print()  # Add newline for spacing

        # Earnings Quality
        if earnings_qual:
            print(f'┌{"─"*78}┐')
            print(f'│  6. EARNINGS QUALITY{" "*57}│')
            print(f'├{"─"*78}┤')
            print(f'│  Cash Conversion: {earnings_qual["cash_conversion"]:.0f}% {"✅" if earnings_qual["cash_conversion"] > 100 else "⚠️"}{" "*48}│')
            print(f'│  Accruals Ratio: {earnings_qual["accruals_ratio"]:.1f}% {"✅" if abs(earnings_qual["accruals_ratio"]) < 3 else "⚠️"}{" "*49}│')
            print(f'│  DSO: {earnings_qual["days_sales_outstanding"]:.0f} days {"✅" if earnings_qual["days_sales_outstanding"] < 60 else "⚠️"}{" "*56}│')
            print(f'│  Quality Score: {earnings_qual["quality_score"]}/10 ({earnings_qual["assessment"]}){" "*45}│')
            print(f'└{"─"*78}┘\n')

        # Dividend Analysis
        if dividend and 'error' not in dividend:
            print(f'┌{"─"*78}┐')
            print(f'│  7. DIVIDEND ANALYSIS{" "*56}│')
            print(f'├{"─"*78}┤')
            print(f'│  Current Yield: {dividend["current_yield"]:.2f}%{" "*55}│')
            print(f'│  5Y Avg Yield: {dividend["avg_yield_5y"]:.2f}%{" "*56}│')
            print(f'│  Payout Ratio: {dividend["payout_ratio"]:.1f}%{" "*55}│')
            print(f'│  Consecutive Years: {dividend["consecutive_years"]}{" "*52}│')
            print(f'│  Dividend Growth (CAGR): {dividend["dividend_growth_cagr"]:.1f}%{" "*47}│')
            print(f'│  Sustainability: {dividend["sustainability_score"]}/10 ({dividend["quality"]}){" "*43}│')
            print(f'└{"─"*78}┘\n')

        # Credit Quality
        if credit:
            print(f'┌{"─"*78}┐')
            print(f'│  8. CREDIT QUALITY{" "*59}│')
            print(f'├{"─"*78}┤')
            print(f'│  Debt/Equity: {credit["debt_to_equity"]:.2f} {"✅" if credit["debt_to_equity"] < 0.5 else "⚠️" if credit["debt_to_equity"] < 1 else "❌"}{" "*51}│')
            print(f'│  Interest Coverage: {credit["interest_coverage"]:.1f}x {"✅" if credit["interest_coverage"] > 5 else "⚠️"}{" "*47}│')
            print(f'│  Debt Trend: {credit["debt_trend"]}{" "*58}│')
            print(f'│  Credit Score: {credit["credit_score"]}/10 ({credit["assessment"]}){" "*46}│')
            print(f'└{"─"*78}┘\n')

        # Technical Analysis (Compact)
        if technical:
            print(f'┌{"─"*78}┐')
            print(f'│  9. TECHNICAL ANALYSIS{" "*55}│')
            print(f'├{"─"*78}┤')
            print(f'│  Trend: {technical["trend_emoji"]} {technical["trend"]}{" "*55}│')
            print(f'│  RSI: {technical["rsi"]:.1f} {"(Overbought)" if technical["rsi"] > 70 else "(Oversold)" if technical["rsi"] < 30 else "(Neutral)"}{" "*50}│')
            print(f'│  1Y Return: {technical["perf_1y"]:+.1f}%{" "*58}│')
            print(f'└{"─"*78}┘\n')

        # Red Flags
        if red_flags:
            print(f'┌{"─"*78}┐')
            print(f'│  10. RED FLAGS DASHBOARD{" "*53}│')
            print(f'├{"─"*78}┤')
            print(f'│  Total Issues: {red_flags["total_issues"]}  |  Severity: {red_flags["severity"]}{" "*45}│')
            if red_flags['red_flags']:
                for flag in red_flags['red_flags'][:3]:
                    print(f'│  {flag}{" "*(76-len(flag))}│')
            if red_flags['warnings']:
                for warning in red_flags['warnings'][:3]:
                    print(f'│  {warning}{" "*(76-len(warning))}│')
            if red_flags["total_issues"] == 0:
                print(f'│  ✅ No major red flags detected{" "*45}│')
            print(f'└{"─"*78}┘\n')

        # Scenario Analysis
        if scenarios:
            print(f'┌{"─"*78}┐')
            print(f'│  11. SCENARIO ANALYSIS (3-Year Horizon){" "*38}│')
            print(f'├{"─"*78}┤')
            print(f'│  🐂 Bull Case: ₹{scenarios["bull_case"]["target_price"]:.2f}  (+{scenarios["bull_case"]["return_pct"]:.0f}%){" "*48}│')
            print(f'│  📊 Base Case: ₹{scenarios["base_case"]["target_price"]:.2f}  (+{scenarios["base_case"]["return_pct"]:.0f}%){" "*48}│')
            print(f'│  🐻 Bear Case: ₹{scenarios["bear_case"]["target_price"]:.2f}  ({scenarios["bear_case"]["return_pct"]:.0f}%){" "*48}│')
            print(f'│  Probability-Weighted: ₹{scenarios["probability_weighted"]:.2f}{" "*45}│')
            print(f'└{"─"*78}┘\n')

        # Valuation
        if intrinsic or (fundamentals and len(fundamentals) > 0):
            print(f'┌{"─"*78}┐')
            print(f'│  12. VALUATION{" "*63}│')
            print(f'├{"─"*78}┤')

            # Show valuation ratios from fundamentals
            if fundamentals and len(fundamentals) > 0:
                latest = fundamentals[0]
                pe = latest.get('pe')
                pb = latest.get('pb')
                ps = latest.get('ps')
                ev_ebitda = latest.get('ev_ebitda')

                if technical:
                    print(f'│  Current Price: ₹{technical["current_price"]:.2f}{" "*54}│')

                # Debug: Check what we have
                # print(f"DEBUG: pe={pe}, pb={pb}, ps={ps}, ev_ebitda={ev_ebitda}, has_fundamentals={len(fundamentals)}")

                if pe and pe > 0 and pe < 999:
                    pe_status = "✅" if pe < 25 else "⚠️" if pe < 40 else "❌"
                    print(f'│  P/E Ratio: {pe:.2f}x  {pe_status}{" "*58}│')

                if pb and pb > 0 and pb < 999:
                    pb_status = "✅" if pb < 3 else "⚠️" if pb < 5 else "❌"
                    print(f'│  P/B Ratio: {pb:.2f}x  {pb_status}{" "*58}│')

                if ps and ps > 0 and ps < 999:
                    ps_status = "✅" if ps < 3 else "⚠️" if ps < 6 else "❌"
                    print(f'│  P/S Ratio: {ps:.2f}x  {ps_status}{" "*58}│')

                if ev_ebitda and ev_ebitda > 0 and ev_ebitda < 999:
                    ev_status = "✅" if ev_ebitda < 12 else "⚠️" if ev_ebitda < 20 else "❌"
                    print(f'│  EV/EBITDA: {ev_ebitda:.2f}x  {ev_status}{" "*57}│')

                if pe or pb or ps or ev_ebitda:
                    print(f'│{" "*78}│')

            # Show intrinsic value if available
            if intrinsic and 'error' not in intrinsic and intrinsic.get('average_intrinsic', 0) > 0:
                print(f'│  Intrinsic Value: ₹{intrinsic["average_intrinsic"]:.2f}{" "*50}│')
                if technical:
                    margin = ((intrinsic["average_intrinsic"] - technical["current_price"]) / technical["current_price"] * 100)
                    print(f'│  Margin of Safety: {margin:+.1f}%{" "*52}│')
                    status = "UNDERVALUED ✅" if margin > 10 else "FAIRLY VALUED 🟡" if margin > -10 else "OVERVALUED ❌"
                    print(f'│  Status: {status}{" "*60}│')
            print(f'└{"─"*78}┘\n')

        # Management Quality
        if management and management.get('quality_score', 0) > 0:
            print(f'┌{"─"*78}┐')
            print(f'│  13. MANAGEMENT QUALITY{" "*54}│')
            print(f'├{"─"*78}┤')
            print(f'│  Quality Score: {management["quality_score"]}/10 ({management["assessment"]}){" "*46}│')
            if management.get('indicators'):
                for indicator in management['indicators'][:3]:
                    print(f'│  {indicator}{" "*(76-len(indicator))}│')
            print(f'└{"─"*78}┘\n')

        # Competitive Moat
        if moat and moat.get('moat_score', 0) > 0:
            print(f'┌{"─"*78}┐')
            print(f'│  14. COMPETITIVE MOAT{" "*56}│')
            print(f'├{"─"*78}┤')
            print(f'│  Moat Strength: {moat["strength"]} ({moat["moat_score"]}/10){" "*48}│')
            print(f'│  {moat["assessment"]}{" "*(76-len(moat["assessment"]))}│')
            if moat.get('indicators'):
                for indicator in moat['indicators'][:3]:
                    print(f'│  {indicator}{" "*(76-len(indicator))}│')
            print(f'└{"─"*78}┘\n')

        # Seasonality
        if seasonality and 'quarter_stats' in seasonality:
            print(f'┌{"─"*78}┐')
            print(f'│  15. SEASONALITY ANALYSIS{" "*52}│')
            print(f'├{"─"*78}┤')
            print(f'│  Best Quarter: {seasonality["best_quarter"]}{" "*60}│')
            print(f'│  Worst Quarter: {seasonality["worst_quarter"]}{" "*59}│')
            has_season = "Yes" if seasonality.get("has_seasonality") else "No"
            print(f'│  Significant Seasonality: {has_season}{" "*51}│')
            print(f'└{"─"*78}┘\n')

        # Segment Performance
        if segments and segments.get('total_segments', 0) > 0:
            print(f'┌{"─"*78}┐')
            print(f'│  16. SEGMENT PERFORMANCE{" "*53}│')
            print(f'├{"─"*78}┤')
            print(f'│  Total Segments: {segments["total_segments"]}{" "*58}│')
            for seg in segments.get('segments', [])[:3]:
                name = seg['name'][:25]  # Truncate long names
                print(f'│  {name}: Growth {seg["growth"]:+.1f}%, Margin {seg["margin"]:.1f}%{" "*40}│')
            print(f'└{"─"*78}┘\n')

        # Sector Context
        if sector_ctx and 'sector' in sector_ctx:
            print(f'┌{"─"*78}┐')
            print(f'│  17. SECTOR CONTEXT ({sector_ctx["sector"]}){" "*54}│')
            print(f'├{"─"*78}┤')
            print(f'│  Overall Outlook: {sector_ctx["overall_outlook"]}{" "*55}│')
            for factor in sector_ctx.get('outlook_factors', [])[:3]:
                print(f'│  {factor}{" "*(76-len(factor))}│')
            print(f'└{"─"*78}┘\n')

        # Final Recommendation
        print(f'╔{"═"*78}╗')
        print(f'║  18. FINAL VERDICT{" "*59}║')
        print(f'╠{"═"*78}╣')
        print(f'║  {recommendation["emoji"]} {recommendation["recommendation"]:<25} (Score: {recommendation["score"]}/100){" "*32}║')
        print(f'╠{"═"*78}╣')
        print(f'║  Key Reasons:{" "*65}║')
        for i, reason in enumerate(recommendation['reasons'][:5]):
            print(f'║  {i+1}. {reason}{" "*(73-len(reason))}║')
        if len(recommendation['reasons']) > 5:
            print(f'║     ... and {len(recommendation["reasons"]) - 5} more reasons{" "*48}║')
        print(f'╚{"═"*78}╝\n')

        print(f'{"="*80}')
        print(f'✅ Institutional-grade report generation complete!')
        print(f'{"="*80}\n')


def main():
    """Main function"""
    import argparse

    parser = argparse.ArgumentParser(description='Enhanced Company Analysis Report V2 (Institutional-Grade)')
    parser.add_argument('symbol', type=str, help='Stock symbol (e.g., TCS, INFY)')
    parser.add_argument('--years', type=int, default=5, help='Number of years to analyze (default: 5)')
    parser.add_argument('--sector', type=str, default='IT', help='Sector for peer comparison (default: IT)')
    parser.add_argument('--peers', nargs='+', help='Peer companies to compare (e.g., --peers TCS INFY WIPRO)')
    parser.add_argument('--compare-sector', action='store_true', help='Auto-compare with sector peers')
    parser.add_argument('--output', choices=['text', 'json'], default='text', help='Output format')

    args = parser.parse_args()

    report_gen = EnhancedCompanyReportV2()

    try:
        # Determine peers list
        peers = args.peers if args.peers else None
        if args.compare_sector and not peers:
            # Auto-detect sector and get peers
            sector_peers = report_gen.SECTOR_PEERS.get(args.sector.upper(), [])
            peers = [p for p in sector_peers if p != args.symbol.upper()][:3]  # Top 3 peers

        result = report_gen.generate_report(args.symbol.upper(), years=args.years, sector=args.sector.upper(), peers=peers)

        if result and args.output == 'json':
            filename = f'enhanced_report_v2_{args.symbol.upper()}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(filename, 'w') as f:
                json.dump(result, f, indent=2, default=str)
            print(f'📄 JSON report saved to: {filename}')

    finally:
        report_gen.close()


if __name__ == '__main__':
    main()
