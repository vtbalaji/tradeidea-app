#!/usr/bin/env -S venv/bin/python3
"""
XBRL Parser for Indian Company Financial Statements

Parses XBRL files (XML format) downloaded from MCA/NSE to extract:
- Balance Sheet data
- Profit & Loss (Income Statement) data
- Cash Flow Statement data
- Key financial metrics

Usage:
    from xbrl_parser import XBRLParser

    parser = XBRLParser('company_financials.xml')
    data = parser.extract_all()
"""

import xml.etree.ElementTree as ET
from datetime import datetime
import re

class XBRLParser:
    """Parse XBRL files and extract financial data"""

    # Common XBRL element mappings (Indian taxonomy + BSE format)
    ELEMENT_MAPPING = {
        # Balance Sheet - Assets
        'Assets': ['Assets', 'TotalAssets', 'AssetsCurrent'],
        'CurrentAssets': ['CurrentAssets', 'TotalCurrentAssets'],
        'NonCurrentAssets': ['NoncurrentAssets', 'NonCurrentAssets', 'TotalNonCurrentAssets'],
        'FixedAssets': ['PropertyPlantAndEquipment', 'FixedAssets', 'TangibleAssets'],
        'Investments': ['Investments', 'TotalInvestments'],
        'CashAndCashEquivalents': ['CashAndCashEquivalents', 'Cash'],
        'TradeReceivables': ['TradeReceivables', 'Receivables', 'Debtors'],
        'Inventories': ['Inventories', 'Inventory'],

        # Balance Sheet - Liabilities & Equity
        'EquityAndLiabilities': ['EquityAndLiabilities', 'TotalEquityAndLiabilities'],
        'Equity': ['Equity', 'ShareholdersFunds', 'TotalShareholdersFunds'],
        'ShareCapital': ['ShareCapital', 'EquityShareCapital'],
        'Reserves': ['ReservesAndSurplus', 'Reserves', 'OtherEquity'],
        'TotalDebt': ['Borrowings', 'TotalBorrowings'],
        'CurrentLiabilities': ['CurrentLiabilities', 'TotalCurrentLiabilities'],
        'NonCurrentLiabilities': ['NoncurrentLiabilities', 'NonCurrentLiabilities'],
        'TradePayables': ['TradePayables', 'Payables', 'Creditors'],

        # P&L Statement - Standard names first, then BSE-specific
        'Revenue': ['RevenueFromOperations', 'Revenue', 'TotalRevenue'],
        'OtherIncome': ['OtherIncome'],
        'TotalIncome': ['TotalIncome', 'TotalRevenue', 'Income'],
        'OperatingExpenses': ['TotalExpenses', 'CostOfGoodsSold', 'OperatingExpenses', 'Expenses'],
        'EmployeeBenefits': ['EmployeeBenefitExpense', 'EmployeeCosts'],
        'Depreciation': ['DepreciationAndAmortisation', 'Depreciation', 'DepreciationDepletionAndAmortisationExpense'],
        'FinanceCosts': ['FinanceCosts', 'InterestExpense', 'FinanceCost'],
        'ProfitBeforeTax': ['ProfitBeforeTax', 'PBT', 'ProfitBeforeExceptionalItemsAndTax'],
        'TaxExpense': ['TaxExpense', 'IncomeTaxExpense', 'TaxExpenseRelatingToContinuingOperations'],

        # NetProfit - BSE uses very specific names
        'NetProfit': [
            'ProfitLoss',
            'NetProfit',
            'ProfitForPeriod',
            'ProfitLossForPeriod',  # BSE format
            'ProfitLossForPeriodFromContinuingOperations',  # BSE quarterly format
        ],

        # EPS - BSE uses very specific names
        'EPS': [
            'BasicEarningsPerShare',
            'EarningsPerShare',
            'BasicEPS',
            'BasicEarningsLossPerShareFromContinuingOperations',  # BSE quarterly format
            'BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations',  # BSE annual format
        ],

        # Cash Flow
        'OperatingCashFlow': ['CashFlowFromOperatingActivities', 'OperatingCashFlow'],
        'InvestingCashFlow': ['CashFlowFromInvestingActivities', 'InvestingCashFlow'],
        'FinancingCashFlow': ['CashFlowFromFinancingActivities', 'FinancingCashFlow'],

        # Other
        'NumberOfShares': ['NumberOfShares', 'WeightedAverageNumberOfEquityShares'],
        'DividendPerShare': ['DividendPerShare', 'DividendDeclared'],
    }

    def __init__(self, xbrl_file_path):
        """Initialize parser with XBRL file path"""
        self.file_path = xbrl_file_path
        self.tree = None
        self.root = None
        self.namespaces = {}
        self.facts = {}
        self.contexts = {}

    def parse(self):
        """Parse the XBRL XML file"""
        try:
            self.tree = ET.parse(self.file_path)
            self.root = self.tree.getroot()

            # Extract namespaces
            self._extract_namespaces()

            # Extract contexts (periods)
            self._extract_contexts()

            # Extract facts (financial data)
            self._extract_facts()

            return True

        except Exception as e:
            print(f"Error parsing XBRL file: {str(e)}")
            return False

    def _extract_namespaces(self):
        """Extract XML namespaces from XBRL file"""
        # Get all namespaces from root element
        for prefix, uri in self.root.attrib.items():
            if prefix.startswith('{http://www.w3.org/2000/xmlns/}'):
                ns_prefix = prefix.split('}')[1]
                self.namespaces[ns_prefix] = uri

    def _extract_contexts(self):
        """Extract context information (reporting periods)"""
        # Find all context elements
        for context in self.root.findall('.//{http://www.xbrl.org/2003/instance}context'):
            context_id = context.get('id')

            # Extract period information
            period = context.find('{http://www.xbrl.org/2003/instance}period')
            if period is not None:
                instant = period.find('{http://www.xbrl.org/2003/instance}instant')
                start_date = period.find('{http://www.xbrl.org/2003/instance}startDate')
                end_date = period.find('{http://www.xbrl.org/2003/instance}endDate')

                self.contexts[context_id] = {
                    'instant': instant.text if instant is not None else None,
                    'startDate': start_date.text if start_date is not None else None,
                    'endDate': end_date.text if end_date is not None else None,
                }

    def _extract_facts(self):
        """Extract all facts (financial data points) from XBRL"""
        # Iterate through all elements in the document
        for elem in self.root.iter():
            # Skip non-numeric elements
            if elem.text is None or elem.text.strip() == '':
                continue

            # Get element name (remove namespace)
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

            # Get context reference
            context_ref = elem.get('contextRef')

            # Get unit reference (for currency)
            unit_ref = elem.get('unitRef')

            # Get decimals (for scaling)
            decimals = elem.get('decimals')

            # Try to parse as number
            try:
                value = float(elem.text.replace(',', ''))

                # Store fact
                if tag not in self.facts:
                    self.facts[tag] = []

                self.facts[tag].append({
                    'value': value,
                    'contextRef': context_ref,
                    'unitRef': unit_ref,
                    'decimals': decimals,
                    'context': self.contexts.get(context_ref, {}),
                })
            except (ValueError, AttributeError):
                # Not a numeric value, skip
                pass

    def _get_latest_value(self, element_names):
        """Get the most recent value for given element names"""
        for element_name in element_names:
            if element_name in self.facts:
                # Get the latest fact (assume sorted by date)
                fact_list = self.facts[element_name]
                if fact_list:
                    # Try to find the most recent one by end date
                    latest_fact = None
                    latest_date = None

                    for fact in fact_list:
                        context = fact.get('context', {})
                        end_date = context.get('endDate') or context.get('instant')

                        if end_date:
                            try:
                                date_obj = datetime.strptime(end_date, '%Y-%m-%d')
                                if latest_date is None or date_obj > latest_date:
                                    latest_date = date_obj
                                    latest_fact = fact
                            except:
                                pass

                    if latest_fact:
                        return latest_fact['value']
                    else:
                        # Fallback to first value
                        return fact_list[0]['value']

        return None

    def extract_all(self):
        """Extract all financial data in a structured format"""
        if not self.root:
            if not self.parse():
                return None

        data = {}

        # Extract all mapped elements
        for key, element_names in self.ELEMENT_MAPPING.items():
            value = self._get_latest_value(element_names)
            if value is not None:
                data[key] = value

        # Calculate derived metrics if base values are available

        # EBITDA = Operating Profit + Depreciation
        if 'ProfitBeforeTax' in data and 'FinanceCosts' in data and 'Depreciation' in data:
            data['EBITDA'] = data['ProfitBeforeTax'] + data['FinanceCosts'] + data['Depreciation']

        # Operating Profit
        if 'Revenue' in data and 'OperatingExpenses' in data:
            data['OperatingProfit'] = data['Revenue'] - data['OperatingExpenses']

        # Total Borrowings (if not directly available)
        if 'TotalDebt' not in data:
            # Try to sum up different types of borrowings
            short_term = self._get_latest_value(['ShortTermBorrowings', 'CurrentBorrowings'])
            long_term = self._get_latest_value(['LongTermBorrowings', 'NonCurrentBorrowings'])
            if short_term and long_term:
                data['TotalDebt'] = short_term + long_term

        return data

    def get_reporting_period(self):
        """Get the reporting period from contexts"""
        latest_date = None
        start_date = None

        for context in self.contexts.values():
            end_date_str = context.get('endDate') or context.get('instant')
            start_date_str = context.get('startDate')

            if end_date_str:
                try:
                    date_obj = datetime.strptime(end_date_str, '%Y-%m-%d')
                    if latest_date is None or date_obj > latest_date:
                        latest_date = date_obj
                        if start_date_str:
                            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                except:
                    pass

        return {
            'endDate': latest_date.strftime('%Y-%m-%d') if latest_date else None,
            'startDate': start_date.strftime('%Y-%m-%d') if start_date else None,
        }

    def get_financial_year_and_quarter(self):
        """
        Determine financial year and quarter from reporting period
        Indian FY runs from April 1 to March 31
        """
        period = self.get_reporting_period()
        if not period or not period['endDate']:
            return None

        end_date = datetime.strptime(period['endDate'], '%Y-%m-%d')
        start_date = None
        if period['startDate']:
            start_date = datetime.strptime(period['startDate'], '%Y-%m-%d')

        # Determine Financial Year (FY ends in March)
        # If end date is in Jan-Mar, FY is current year
        # If end date is in Apr-Dec, FY is next year
        if end_date.month <= 3:
            fy_year = end_date.year
        else:
            fy_year = end_date.year + 1

        fy = f'FY{fy_year}'

        # Determine Quarter based on end date
        month = end_date.month
        if month in [6]:  # June end = Q1
            quarter = 'Q1'
        elif month in [9]:  # September end = Q2
            quarter = 'Q2'
        elif month in [12]:  # December end = Q3
            quarter = 'Q3'
        elif month in [3]:  # March end = Q4 (full year)
            quarter = 'Q4'
        else:
            # Try to infer from start and end dates
            if start_date:
                months_diff = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
                if months_diff >= 11:  # Full year report
                    quarter = 'Q4'
                else:
                    quarter = 'Q' + str((month - 1) // 3 + 1)
            else:
                quarter = 'Q' + str((month - 1) // 3 + 1)

        # Check if it's a full year report (12 months)
        is_annual = False
        if start_date and end_date:
            months_diff = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
            if months_diff >= 11:
                is_annual = True
                quarter = 'Q4'  # Full year = Q4

        return {
            'fy': fy,
            'quarter': quarter,
            'isAnnual': is_annual,
            'endDate': period['endDate'],
            'startDate': period['startDate'],
        }

    def display_summary(self, data):
        """Display extracted data in a readable format"""
        print('\n' + '='*70)
        print('📄 XBRL Financial Data Summary')
        print('='*70)

        period_info = self.get_financial_year_and_quarter()
        if period_info:
            print(f'\n📅 Reporting Period: {period_info["fy"]} {period_info["quarter"]}')
            print(f'    Period: {period_info["startDate"]} to {period_info["endDate"]}')
            if period_info["isAnnual"]:
                print(f'    Type: Annual Report')

        print(f'\n💰 Balance Sheet (₹ Crores):')
        print(f'  Total Assets:     {data.get("Assets", 0)/10000000:>15,.2f}')
        print(f'  Current Assets:   {data.get("CurrentAssets", 0)/10000000:>15,.2f}')
        print(f'  Fixed Assets:     {data.get("FixedAssets", 0)/10000000:>15,.2f}')
        print(f'  Total Equity:     {data.get("Equity", 0)/10000000:>15,.2f}')
        print(f'  Total Debt:       {data.get("TotalDebt", 0)/10000000:>15,.2f}')

        print(f'\n📊 Income Statement (₹ Crores):')
        print(f'  Revenue:          {data.get("Revenue", 0)/10000000:>15,.2f}')
        print(f'  Operating Profit: {data.get("OperatingProfit", 0)/10000000:>15,.2f}')
        print(f'  EBITDA:           {data.get("EBITDA", 0)/10000000:>15,.2f}')
        print(f'  Net Profit:       {data.get("NetProfit", 0)/10000000:>15,.2f}')

        print(f'\n💵 Per Share Data (₹):')
        print(f'  EPS:              {data.get("EPS", 0):>15,.2f}')
        print(f'  Dividend/Share:   {data.get("DividendPerShare", 0):>15,.2f}')

        print('='*70)


# Example usage
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 xbrl_parser.py <xbrl_file.xml>")
        sys.exit(1)

    xbrl_file = sys.argv[1]

    print(f"Parsing XBRL file: {xbrl_file}")

    parser = XBRLParser(xbrl_file)
    data = parser.extract_all()

    if data:
        parser.display_summary(data)
        print(f"\n✅ Extracted {len(data)} financial metrics")
    else:
        print("❌ Failed to parse XBRL file")
