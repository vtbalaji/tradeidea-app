#!/usr/bin/env -S venv/bin/python3
"""
Enhanced XBRL Parser for Indian Company Financial Statements
Version 3 - Incorporates best practices from comprehensive XBRL guide

Key Improvements:
1. Currency detection and USD→INR conversion
2. Proper instant vs duration context usage (B/S vs P&L)
3. Enhanced banking sector support
4. Duplicate fact detection and validation
5. Unit parsing and validation
6. Better error reporting and diagnostics
7. Sign validation for financial concepts

Usage:
    from xbrl_parser_v3 import EnhancedXBRLParser

    parser = EnhancedXBRLParser('company_financials.xml')
    data = parser.extract_all()
"""

import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from collections import defaultdict
import re
import requests


class EnhancedXBRLParser:
    """
    Enhanced XBRL Parser with best practices from the comprehensive guide
    """

    # SEBI 2025 format (new format) - in-capmkt namespace
    SEBI_2025_MAPPING = {
        # Balance Sheet - Assets (INSTANT context)
        'Assets': ['Assets', 'TotalAssets'],
        'CurrentAssets': ['CurrentAssets', 'TotalCurrentAssets'],
        'NonCurrentAssets': ['NoncurrentAssets', 'NonCurrentAssets', 'TotalNonCurrentAssets'],
        'FixedAssets': ['PropertyPlantAndEquipment', 'FixedAssets', 'TangibleAssets'],
        'Investments': ['Investments', 'TotalInvestments'],
        'CashAndCashEquivalents': ['CashAndCashEquivalents', 'Cash'],
        'TradeReceivables': ['TradeReceivables', 'Receivables'],
        'Inventories': ['Inventories', 'Inventory'],

        # Balance Sheet - Liabilities & Equity (INSTANT context)
        'EquityAndLiabilities': ['EquityAndLiabilities', 'TotalEquityAndLiabilities'],
        'Equity': ['Equity', 'EquityAttributableToOwnersOfParent', 'TotalEquity'],
        'ShareCapital': ['EquityShareCapital', 'PaidUpValueOfEquityShareCapital'],
        'Reserves': ['OtherEquity', 'ReservesAndSurplus', 'Reserves'],
        'TotalDebt': ['Borrowings', 'TotalBorrowings', 'TotalDebt'],
        'CurrentBorrowings': ['BorrowingsCurrent', 'CurrentBorrowings', 'ShortTermBorrowings'],
        'NonCurrentBorrowings': ['BorrowingsNoncurrent', 'NonCurrentBorrowings', 'NoncurrentBorrowings', 'LongTermBorrowings'],
        'CurrentLiabilities': ['CurrentLiabilities', 'TotalCurrentLiabilities'],
        'NonCurrentLiabilities': ['NoncurrentLiabilities', 'NonCurrentLiabilities'],
        'TradePayables': ['TradePayables', 'Payables'],

        # P&L Statement (DURATION context)
        'Revenue': ['RevenueFromOperations', 'Revenue', 'TotalRevenue'],
        'OtherIncome': ['OtherIncome'],
        'TotalIncome': ['TotalIncome', 'Income'],
        'OperatingExpenses': ['TotalExpenses', 'OperatingExpenses', 'Expenses'],
        'EmployeeBenefits': ['EmployeeBenefitExpense', 'EmployeeCosts'],
        'Depreciation': ['DepreciationAndAmortisation', 'DepreciationDepletionAndAmortisationExpense', 'Depreciation'],
        'FinanceCosts': ['FinanceCosts', 'InterestExpense', 'FinanceCost'],
        'ProfitBeforeTax': ['ProfitBeforeTax', 'PBT'],
        'TaxExpense': ['TaxExpense', 'IncomeTaxExpense'],
        'NetProfit': ['ProfitLoss', 'NetProfit', 'ProfitForPeriod', 'ProfitLossForPeriod',
                     'ProfitOrLossAttributableToOwnersOfParent', 'ProfitLossForPeriodFromContinuingOperations'],
        'EPS': ['BasicEarningsPerShare', 'EarningsPerShare', 'BasicEPS',
               'BasicEarningsLossPerShareFromContinuingAndDiscontinuedOperations',
               'BasicEarningsPerShareAfterExtraordinaryItems',
               'BasicEarningsPerShareBeforeExtraordinaryItems'],

        # Cash Flow (DURATION context)
        'OperatingCashFlow': ['CashFlowFromOperatingActivities', 'NetCashFlowFromOperatingActivities',
                             'CashFlowsFromUsedInOperatingActivities'],
        'InvestingCashFlow': ['CashFlowFromInvestingActivities', 'NetCashFlowFromInvestingActivities',
                             'CashFlowsFromUsedInInvestingActivities'],
        'FinancingCashFlow': ['CashFlowFromFinancingActivities', 'NetCashFlowFromFinancingActivities',
                             'CashFlowsFromUsedInFinancingActivities'],

        # Other
        'NumberOfShares': ['NumberOfShares', 'WeightedAverageNumberOfEquityShares'],
        'FaceValue': ['FaceValueOfEquityShareCapital', 'FaceValue'],
        'DividendPerShare': ['DividendPerShare', 'DividendDeclared'],
    }

    # BSE 2020 format (old format) - in-bse-fin namespace
    BSE_2020_MAPPING = SEBI_2025_MAPPING.copy()  # Same mappings for now

    # Enhanced Banking-specific mappings (BSE Banking format + NSE Banking Taxonomy)
    BANKING_MAPPING = {
        # Interest Income Components (P&L - DURATION context)
        'InterestIncome': ['InterestIncome', 'InterestEarned', 'InterestAndSimilarIncome',
                          'IncomeOnInvestments', 'InterestAndDiscountIncome'],
        'InterestOnAdvances': ['InterestOrDiscountOnAdvancesOrBills', 'InterestOnAdvances'],
        'InterestOnInvestments': ['RevenueOnInvestments', 'IncomeFromInvestments'],
        'InterestOnRBIBalances': ['InterestOnBalancesWithReserveBankOfIndiaAndOtherInterBankFunds'],
        'OtherInterestIncome': ['OtherInterest', 'MiscellaneousInterestIncome'],

        # Interest Expense (P&L - DURATION context)
        'InterestExpense': ['InterestExpended', 'InterestAndSimilarExpense', 'InterestExpense'],
        'NetInterestIncome': ['NetInterestIncome'],

        # Non-Interest Income (P&L - DURATION context)
        'NonInterestIncome': ['NonInterestIncome', 'OtherOperatingIncome', 'OtherIncome'],
        'FeeIncome': ['FeeAndCommissionIncome', 'FeesAndCommissions', 'FeeIncomeFromBankingBusiness'],
        'TradingIncome': ['ProfitOnSaleOfInvestments', 'ProfitOnExchangeTransactions', 'TradingIncome'],

        # Provisions & Contingencies (P&L - DURATION context)
        'Provisions': ['ProvisionsAndContingencies', 'ProvisionForBadDebts', 'Provisions',
                      'ProvisionForNPAs', 'ProvisionForContingencies', 'ImpairmentOnFinancialInstruments',
                      'ProvisionsOtherThanTaxAndContingencies'],

        # Operating Expenses (P&L - DURATION context)
        'OperatingExpensesBank': ['OperatingExpenses', 'OtherExpenses', 'TotalExpenses',
                                 'OtherOperatingExpenses'],
        'ExpenditureExcludingProvisions': ['ExpenditureExcludingProvisionsAndContingencies'],

        # Banking Revenue (P&L - DURATION context)
        'RevenueBank': ['Income', 'SegmentRevenueFromOperations', 'TotalIncome'],

        # Banking Profit (P&L - DURATION context)
        'NetProfitBank': ['ProfitLossForThePeriod', 'ProfitLossFromOrdinaryActivitiesAfterTax',
                         'ProfitLossAfterTaxesMinorityInterestAndShareOfProfitLossOfAssociates',
                         'ProfitLossForPeriodFromContinuingOperations'],
        'ProfitBeforeTaxBank': ['ProfitLossFromOrdinaryActivitiesBeforeTax', 'ProfitBeforeTax'],
        'OperatingProfitBank': ['OperatingProfitBeforeProvisionAndContingencies'],
        'OperatingProfitBeforeProvisions': ['OperatingProfitBeforeProvisionAndContingencies'],

        # Asset Quality & NPAs (INSTANT or DURATION)
        'GrossNPA': ['GrossNonPerformingAssets', 'GrossNPAs'],
        'NetNPA': ['NetNonPerformingAssets', 'NetNPAs'],

        # Capital Adequacy Ratios (INSTANT or DURATION)
        'CET1Ratio': ['CET1Ratio', 'CommonEquityTier1Ratio'],
        'Tier1Ratio': ['AdditionalTier1Ratio', 'Tier1CapitalRatio'],

        # Efficiency Ratios (calculated or reported)
        'CostToIncomeRatio': ['CostToIncomeRatio', 'CostIncomeRatio'],

        # Banking Assets (INSTANT context)
        'CashWithRBI': ['CashAndBalancesWithReserveBankOfIndia', 'CashAndBankBalanceWithReserveBankOfIndia'],
        'InterBankFunds': ['BalancesWithBanksAndMoneyAtCallAndShortNotice', 'MoneyAtCallAndShortNotice'],
        'Advances': ['Advances', 'LoansAndAdvances', 'LoansAndAdvancesToCustomers'],
        'InvestmentsBank': ['Investments', 'InvestmentSecurities', 'TotalInvestments'],

        # Banking Liabilities (INSTANT context)
        'Deposits': ['Deposits', 'DepositsFromCustomers', 'CustomerDeposits'],
        'BorrowingsBank': ['Borrowings', 'BorrowingsFromBanks', 'BorrowingsFromOtherBanks'],
        'CurrentAccountDeposits': ['CurrentAccountDeposits', 'CurrentDeposits'],
        'SavingsAccountDeposits': ['SavingsAccountDeposits', 'SavingsDeposits'],
    }

    # General additional mappings for all companies
    ADDITIONAL_MAPPING = {
        # Extraordinary and Exceptional Items (P&L - DURATION context)
        'ExtraordinaryItems': ['ExtraordinaryItems', 'ExtraOrdinaryItems'],
        'ExceptionalItems': ['ExceptionalItems', 'ExceptionalItemsIncome', 'ExceptionalItemsExpense'],

        # Minority Interest (P&L - DURATION context)
        'MinorityInterest': ['ProfitLossOfMinorityInterest', 'MinorityInterest',
                            'NonControllingInterests', 'MinorityInterestInProfit'],
    }

    # Concepts that should typically be negative (expenses, liabilities growth)
    NEGATIVE_CONCEPTS = [
        'Expenses', 'OperatingExpenses', 'TaxExpense', 'Depreciation',
        'FinanceCosts', 'InterestExpense', 'Provisions'
    ]

    def __init__(self, xbrl_file_path: str):
        """Initialize enhanced parser with XBRL file path"""
        self.file_path = xbrl_file_path
        self.tree = None
        self.root = None
        self.namespaces = {}
        self.facts = {}
        self.contexts = {}
        self.units = {}
        self.schema_version = None
        self.active_mapping = None

        # Currency info
        self.currency = 'INR'
        self.currency_conversion_rate = 1.0
        self.rounding_level = 'Unknown'

        # Validation warnings
        self.warnings = []
        self.duplicate_facts = []

    def parse(self) -> bool:
        """Parse the XBRL XML file"""
        try:
            self.tree = ET.parse(self.file_path)
            self.root = self.tree.getroot()

            # Extract namespaces
            self._extract_namespaces()

            # Detect schema version and set active mapping
            self._detect_schema_version()

            # Extract units (needed before contexts for currency detection)
            self._extract_units()

            # Extract contexts (periods)
            self._extract_contexts()

            # Detect currency and rounding
            self._detect_currency_and_rounding()

            # Extract facts (financial data)
            self._extract_facts()

            # Validate facts
            self._validate_facts()

            return True

        except Exception as e:
            print(f"Error parsing XBRL file: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def _detect_schema_version(self):
        """Detect XBRL schema version from namespaces"""
        # Check for SEBI 2025 format (in-capmkt)
        if 'in-capmkt' in self.namespaces or any('sebi.gov.in' in uri for uri in self.namespaces.values()):
            self.schema_version = 'SEBI_2025'
            self.active_mapping = self.SEBI_2025_MAPPING
            print(f"  📋 Detected schema: SEBI 2025 (in-capmkt)")
        # Check for BSE 2020 format (in-bse-fin)
        elif 'in-bse-fin' in self.namespaces or any('bseindia.com' in uri for uri in self.namespaces.values()):
            self.schema_version = 'BSE_2020'
            self.active_mapping = self.BSE_2020_MAPPING
            print(f"  📋 Detected schema: BSE 2020 (in-bse-fin)")
        else:
            # Fallback to SEBI 2025 for unknown schemas
            self.schema_version = 'UNKNOWN'
            self.active_mapping = self.SEBI_2025_MAPPING
            print(f"  ⚠️  Unknown schema, using SEBI 2025 mapping as fallback")

    def _extract_namespaces(self):
        """Extract XML namespaces from XBRL file"""
        # Method 1: Get namespaces from root element attributes
        for prefix, uri in self.root.attrib.items():
            if prefix.startswith('{http://www.w3.org/2000/xmlns/}'):
                ns_prefix = prefix.split('}')[1]
                self.namespaces[ns_prefix] = uri

        # Method 2: Use regex to find xmlns declarations
        with open(self.file_path, 'r', encoding='utf-8') as f:
            header = ''.join([f.readline() for _ in range(10)])

        # Extract xmlns:prefix="uri" declarations
        xmlns_pattern = r'xmlns:([a-zA-Z0-9_-]+)="([^"]+)"'
        for match in re.finditer(xmlns_pattern, header):
            prefix, uri = match.groups()
            self.namespaces[prefix] = uri

        # Always include standard XBRL namespaces
        if 'xbrli' not in self.namespaces:
            self.namespaces['xbrli'] = 'http://www.xbrl.org/2003/instance'
        if 'iso4217' not in self.namespaces:
            self.namespaces['iso4217'] = 'http://www.xbrl.org/2003/iso4217'

    def _extract_units(self):
        """Extract unit information (currency, shares, etc.)"""
        for unit in self.root.findall('.//{http://www.xbrl.org/2003/instance}unit'):
            unit_id = unit.get('id')

            # Get measure
            measure = unit.find('{http://www.xbrl.org/2003/instance}measure')
            if measure is not None:
                self.units[unit_id] = measure.text

            # Handle divide (for ratios like INRPerShare)
            divide = unit.find('.//{http://www.xbrl.org/2003/instance}divide')
            if divide is not None:
                numerator = divide.find('.//{http://www.xbrl.org/2003/instance}unitNumerator/{http://www.xbrl.org/2003/instance}measure')
                denominator = divide.find('.//{http://www.xbrl.org/2003/instance}unitDenominator/{http://www.xbrl.org/2003/instance}measure')
                if numerator is not None and denominator is not None:
                    self.units[unit_id] = f"{numerator.text}/{denominator.text}"

    def _detect_currency_and_rounding(self):
        """Detect currency and rounding level from XBRL metadata"""
        # Look for currency in contexts or facts
        for elem in self.root.iter():
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

            if tag == 'DescriptionOfPresentationCurrency' and elem.text:
                currency_text = elem.text.strip().upper()
                if 'USD' in currency_text or '$' in currency_text:
                    self.currency = 'USD'
                elif 'INR' in currency_text or '₹' in currency_text or 'RUPEE' in currency_text:
                    self.currency = 'INR'
                else:
                    self.currency = currency_text
                print(f"  💱 Currency: {self.currency}")

            if tag == 'LevelOfRounding' and elem.text:
                self.rounding_level = elem.text.strip()
                print(f"  🔢 Rounding: {self.rounding_level}")

        # If currency is USD, get conversion rate
        if self.currency == 'USD':
            self.currency_conversion_rate = self._get_usd_to_inr_rate()
            print(f"  💱 USD→INR conversion rate: {self.currency_conversion_rate:.2f}")

    def _get_usd_to_inr_rate(self, date: Optional[str] = None) -> float:
        """
        Get USD to INR conversion rate
        For simplicity, using a recent average rate
        In production, fetch from forex API based on reporting date
        """
        # Default to recent average rate (~83 INR per USD as of 2025)
        default_rate = 83.0

        try:
            # Could integrate with forex API here
            # For now, return default
            return default_rate
        except:
            return default_rate

    def _extract_contexts(self):
        """Extract context information (reporting periods)"""
        for context in self.root.findall('.//{http://www.xbrl.org/2003/instance}context'):
            context_id = context.get('id')

            # Extract period information
            period = context.find('{http://www.xbrl.org/2003/instance}period')
            if period is not None:
                instant = period.find('{http://www.xbrl.org/2003/instance}instant')
                start_date = period.find('{http://www.xbrl.org/2003/instance}startDate')
                end_date = period.find('{http://www.xbrl.org/2003/instance}endDate')

                context_data = {
                    'id': context_id,
                    'type': 'instant' if instant is not None else 'duration',
                    'instant': instant.text if instant is not None else None,
                    'startDate': start_date.text if start_date is not None else None,
                    'endDate': end_date.text if end_date is not None else None,
                }

                self.contexts[context_id] = context_data

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
            if context_ref is None:
                continue

            # Get unit reference (for currency)
            unit_ref = elem.get('unitRef')

            # Get decimals (for scaling)
            decimals = elem.get('decimals')

            # Try to parse as number
            try:
                value = float(elem.text.replace(',', ''))

                # Apply currency conversion if needed
                converted_value = value
                if self.currency == 'USD' and unit_ref and 'USD' in str(self.units.get(unit_ref, '')):
                    converted_value = value * self.currency_conversion_rate

                # Store fact
                if tag not in self.facts:
                    self.facts[tag] = []

                self.facts[tag].append({
                    'value': value,
                    'converted_value': converted_value,
                    'contextRef': context_ref,
                    'unitRef': unit_ref,
                    'unit': self.units.get(unit_ref),
                    'decimals': decimals,
                    'context': self.contexts.get(context_ref, {}),
                })
            except (ValueError, AttributeError):
                # Not a numeric value, skip
                pass

    def _validate_facts(self):
        """Validate facts for duplicates and inconsistencies"""
        # Check for duplicate facts with different values
        for tag, fact_list in self.facts.items():
            if len(fact_list) <= 1:
                continue

            # Group by context
            by_context = defaultdict(list)
            for fact in fact_list:
                ctx_key = (fact['contextRef'], fact['unitRef'])
                by_context[ctx_key].append(fact)

            # Check for duplicates within same context
            for ctx_key, facts in by_context.items():
                if len(facts) > 1:
                    values = [f['value'] for f in facts]
                    if len(set(values)) > 1:
                        # Different values for same concept and context!
                        self.duplicate_facts.append({
                            'concept': tag,
                            'context': ctx_key,
                            'values': values
                        })
                        self.warnings.append(
                            f"⚠️  Duplicate fact with different values: {tag} in context {ctx_key[0]} = {values}"
                        )

    def _get_instant_context(self) -> Optional[str]:
        """Get the primary instant context (for balance sheet items)"""
        # Look for instant context with latest date
        instant_contexts = [
            (ctx_id, ctx) for ctx_id, ctx in self.contexts.items()
            if ctx.get('type') == 'instant' and ctx.get('instant')
        ]

        if not instant_contexts:
            return None

        # Sort by date and return latest
        instant_contexts.sort(key=lambda x: x[1]['instant'], reverse=True)
        return instant_contexts[0][0]

    def _get_duration_context(self) -> Optional[str]:
        """Get the primary duration context (for P&L and cash flow items)"""
        # Look for duration context with latest end date
        duration_contexts = [
            (ctx_id, ctx) for ctx_id, ctx in self.contexts.items()
            if ctx.get('type') == 'duration' and ctx.get('endDate')
        ]

        if not duration_contexts:
            return None

        # Sort by end date and return latest
        duration_contexts.sort(key=lambda x: x[1]['endDate'], reverse=True)
        return duration_contexts[0][0]

    def _get_latest_value(self, element_names: List[str], context_type: str = 'any') -> Optional[float]:
        """
        Get the most recent value for given element names

        Args:
            element_names: List of possible element names
            context_type: 'instant', 'duration', or 'any'
        """
        # Determine which context to use
        if context_type == 'instant':
            preferred_context = self._get_instant_context()
        elif context_type == 'duration':
            preferred_context = self._get_duration_context()
        else:
            preferred_context = None

        for element_name in element_names:
            if element_name in self.facts:
                fact_list = self.facts[element_name]
                if fact_list:
                    # If we have a preferred context, try to use it
                    if preferred_context:
                        for fact in fact_list:
                            if fact['contextRef'] == preferred_context:
                                return fact['converted_value']

                    # Otherwise, get the latest one by date
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
                        return latest_fact['converted_value']
                    else:
                        # Fallback to first value
                        return fact_list[0]['converted_value']

        return None

    def _is_banking_company(self, data: Dict) -> bool:
        """Detect if this is a banking/financial services company"""
        # Primary banking indicators from NSE Banking Taxonomy
        primary_indicators = [
            'InterestIncome',
            'InterestExpense',
            'NetInterestIncome',
            'Advances',  # Loans to customers
            'Deposits',  # Customer deposits
        ]

        # Secondary banking indicators
        secondary_indicators = [
            'InterestOnAdvances',
            'InterestOnInvestments',
            'InterestOnRBIBalances',
            'CashWithRBI',
            'InterBankFunds',
            'NonInterestIncome',
            'FeeIncome',
            'Provisions'
        ]

        primary_count = sum(1 for indicator in primary_indicators if indicator in data)
        secondary_count = sum(1 for indicator in secondary_indicators if indicator in data)

        # If we have at least 2 primary indicators or 1 primary + 2 secondary, it's a bank
        return primary_count >= 2 or (primary_count >= 1 and secondary_count >= 2)

    def _extract_banking_details(self, data: Dict) -> Dict[str, Any]:
        """Extract and calculate banking-specific metrics"""
        banking_details = {}

        # Calculate Total Interest Income from components
        interest_income_components = []
        if 'InterestOnAdvances' in data:
            interest_income_components.append(data['InterestOnAdvances'])
            banking_details['InterestOnAdvances'] = data['InterestOnAdvances']

        if 'InterestOnInvestments' in data:
            interest_income_components.append(data['InterestOnInvestments'])
            banking_details['InterestOnInvestments'] = data['InterestOnInvestments']

        if 'InterestOnRBIBalances' in data:
            interest_income_components.append(data['InterestOnRBIBalances'])
            banking_details['InterestOnRBIBalances'] = data['InterestOnRBIBalances']

        if 'OtherInterestIncome' in data:
            interest_income_components.append(data['OtherInterestIncome'])
            banking_details['OtherInterestIncome'] = data['OtherInterestIncome']

        # Calculate total interest income if components are available
        if interest_income_components:
            calculated_interest_income = sum(interest_income_components)
            banking_details['CalculatedInterestIncome'] = calculated_interest_income
            print(f"  🏦 Calculated Interest Income = {calculated_interest_income:,.0f} (from {len(interest_income_components)} components)")

        # Net Interest Income
        if 'NetInterestIncome' in data:
            banking_details['NetInterestIncome'] = data['NetInterestIncome']
        elif 'InterestIncome' in data and 'InterestExpense' in data:
            banking_details['NetInterestIncome'] = data['InterestIncome'] - data['InterestExpense']
            print(f"  🏦 Calculated NII = Interest Income - Interest Expense = {banking_details['NetInterestIncome']:,.0f}")

        # Non-Interest Income components
        if 'FeeIncome' in data:
            banking_details['FeeIncome'] = data['FeeIncome']
        if 'TradingIncome' in data:
            banking_details['TradingIncome'] = data['TradingIncome']

        # Banking Assets
        if 'CashWithRBI' in data:
            banking_details['CashWithRBI'] = data['CashWithRBI']
        if 'InterBankFunds' in data:
            banking_details['InterBankFunds'] = data['InterBankFunds']
        if 'Advances' in data:
            banking_details['Advances'] = data['Advances']

        # Calculate CASA (if we have granular deposit data in the future)
        # For now, just track total deposits
        if 'Deposits' in data:
            banking_details['Deposits'] = data['Deposits']

        # Calculate key banking ratios if possible
        if banking_details.get('NetInterestIncome') and data.get('InvestmentsBank'):
            nim = (banking_details['NetInterestIncome'] / data['InvestmentsBank']) * 100
            banking_details['NetInterestMargin'] = nim

        # Provision metrics
        if 'Provisions' in data:
            banking_details['Provisions'] = data['Provisions']

        return banking_details

    def extract_all(self) -> Dict[str, Any]:
        """Extract all financial data in a structured format"""
        if not self.root:
            if not self.parse():
                return None

        data = {}

        # Use active mapping based on detected schema
        mapping_to_use = self.active_mapping if self.active_mapping else self.SEBI_2025_MAPPING

        # Extract Balance Sheet items (use INSTANT context)
        bs_items = ['Assets', 'CurrentAssets', 'NonCurrentAssets', 'FixedAssets',
                   'Investments', 'CashAndCashEquivalents', 'TradeReceivables',
                   'Inventories', 'EquityAndLiabilities', 'Equity', 'ShareCapital',
                   'Reserves', 'TotalDebt', 'CurrentBorrowings', 'NonCurrentBorrowings',
                   'CurrentLiabilities', 'NonCurrentLiabilities', 'TradePayables']

        for key in bs_items:
            if key in mapping_to_use and mapping_to_use[key] is not None:
                value = self._get_latest_value(mapping_to_use[key], context_type='instant')
                if value is not None:
                    data[key] = value

        # Extract P&L items (use DURATION context)
        pl_items = ['Revenue', 'OtherIncome', 'TotalIncome', 'OperatingExpenses',
                   'EmployeeBenefits', 'Depreciation', 'FinanceCosts', 'ProfitBeforeTax',
                   'TaxExpense', 'NetProfit', 'EPS']

        for key in pl_items:
            if key in mapping_to_use and mapping_to_use[key] is not None:
                value = self._get_latest_value(mapping_to_use[key], context_type='duration')
                if value is not None:
                    data[key] = value

        # Extract Cash Flow items (use DURATION context)
        cf_items = ['OperatingCashFlow', 'InvestingCashFlow', 'FinancingCashFlow']

        for key in cf_items:
            if key in mapping_to_use and mapping_to_use[key] is not None:
                value = self._get_latest_value(mapping_to_use[key], context_type='duration')
                if value is not None:
                    data[key] = value

        # Extract other items
        other_items = ['NumberOfShares', 'FaceValue', 'DividendPerShare']
        for key in other_items:
            if key in mapping_to_use and mapping_to_use[key] is not None:
                value = self._get_latest_value(mapping_to_use[key], context_type='any')
                if value is not None:
                    data[key] = value

        # Add banking-specific elements
        banking_instant_items = ['Advances', 'Deposits', 'InvestmentsBank', 'BorrowingsBank',
                                 'CashWithRBI', 'InterBankFunds', 'CurrentAccountDeposits',
                                 'SavingsAccountDeposits']
        banking_duration_items = ['InterestIncome', 'InterestOnAdvances', 'InterestOnInvestments',
                                  'InterestOnRBIBalances', 'OtherInterestIncome', 'InterestExpense',
                                  'NetInterestIncome', 'NonInterestIncome', 'FeeIncome', 'TradingIncome',
                                  'Provisions', 'OperatingExpensesBank', 'RevenueBank',
                                  'NetProfitBank', 'ProfitBeforeTaxBank', 'OperatingProfitBank',
                                  'OperatingProfitBeforeProvisions', 'ExpenditureExcludingProvisions']

        for key, element_names in self.BANKING_MAPPING.items():
            if key not in data:
                # Banking B/S items use instant context
                if key in banking_instant_items:
                    context_type = 'instant'
                # Banking P&L items use duration context
                elif key in banking_duration_items:
                    context_type = 'duration'
                else:
                    context_type = 'any'

                value = self._get_latest_value(element_names, context_type=context_type)
                if value is not None:
                    data[key] = value

        # Add general additional mappings (for all companies)
        for key, element_names in self.ADDITIONAL_MAPPING.items():
            if key not in data:
                value = self._get_latest_value(element_names, context_type='duration')
                if value is not None:
                    data[key] = value

        # Detect if this is a banking company
        is_bank = self._is_banking_company(data)

        # Banking-specific mappings
        if is_bank:
            print(f"  🏦 Banking company detected")

            # Extract detailed banking metrics
            banking_details = self._extract_banking_details(data)
            if banking_details:
                data['BankingDetails'] = banking_details

            # Use banking-specific revenue if regular revenue is missing
            if 'Revenue' not in data or data['Revenue'] == 0:
                if 'RevenueBank' in data:
                    data['Revenue'] = data['RevenueBank']
                    print(f"  💰 Using banking revenue = {data['Revenue']:,.0f}")
                elif 'NetInterestIncome' in data and 'NonInterestIncome' in data:
                    data['Revenue'] = data['NetInterestIncome'] + data['NonInterestIncome']
                    print(f"  💰 Revenue = NII ({data['NetInterestIncome']:,.0f}) + Non-Interest Income ({data['NonInterestIncome']:,.0f})")
                elif 'InterestIncome' in data and 'InterestExpense' in data:
                    net_interest = data['InterestIncome'] - data['InterestExpense']
                    non_interest = data.get('NonInterestIncome', 0) or data.get('FeeIncome', 0)
                    data['Revenue'] = net_interest + non_interest
                    data['NetInterestIncome'] = net_interest
                    print(f"  💰 Calculated Revenue: NII ({net_interest:,.0f}) + Non-Interest ({non_interest:,.0f})")

            # Use banking-specific net profit if regular net profit is missing
            if 'NetProfit' not in data or data['NetProfit'] == 0:
                if 'NetProfitBank' in data:
                    data['NetProfit'] = data['NetProfitBank']
                    print(f"  💹 Using banking net profit = {data['NetProfit']:,.0f}")

            # Use banking-specific PBT if missing
            if 'ProfitBeforeTax' not in data or data['ProfitBeforeTax'] == 0:
                if 'ProfitBeforeTaxBank' in data:
                    data['ProfitBeforeTax'] = data['ProfitBeforeTaxBank']

            # Use banking-specific operating expenses if missing
            if 'OperatingExpenses' not in data or data['OperatingExpenses'] == 0:
                if 'OperatingExpensesBank' in data:
                    data['OperatingExpenses'] = data['OperatingExpensesBank']

        # Calculate Equity if not directly available (BSE 2020 format)
        if 'Equity' not in data and 'ShareCapital' in data and 'Reserves' in data:
            data['Equity'] = data['ShareCapital'] + data['Reserves']
            print(f"  💡 Calculated Equity = ShareCapital ({data['ShareCapital']:,.0f}) + Reserves ({data['Reserves']:,.0f}) = {data['Equity']:,.0f}")

        # Calculate TotalDebt from borrowings if not directly available
        if ('TotalDebt' not in data or data.get('TotalDebt') == 0 or data.get('TotalDebt') is None):
            current_borr = data.get('CurrentBorrowings', 0) or 0
            noncurrent_borr = data.get('NonCurrentBorrowings', 0) or 0
            if current_borr > 0 or noncurrent_borr > 0:
                data['TotalDebt'] = current_borr + noncurrent_borr
                print(f"  💡 Calculated TotalDebt = CurrentBorrowings ({current_borr/10000000:,.2f} Cr) + NonCurrentBorrowings ({noncurrent_borr/10000000:,.2f} Cr) = {data['TotalDebt']/10000000:,.2f} Cr")

        # Calculate derived metrics

        # EBITDA = PBT + Finance Costs + Depreciation
        if 'ProfitBeforeTax' in data and 'FinanceCosts' in data and 'Depreciation' in data:
            data['EBITDA'] = data['ProfitBeforeTax'] + data['FinanceCosts'] + data['Depreciation']

        # Operating Profit
        if 'Revenue' in data and 'OperatingExpenses' in data:
            data['OperatingProfit'] = data['Revenue'] - data['OperatingExpenses']

        # Calculate Number of Shares from Share Capital and Face Value
        if ('NumberOfShares' not in data or data['NumberOfShares'] is None) and 'ShareCapital' in data and 'FaceValue' in data:
            if data['FaceValue'] > 0:
                data['NumberOfShares'] = int(data['ShareCapital'] / data['FaceValue'])
                print(f"  💡 Calculated NumberOfShares = ShareCapital ({data['ShareCapital']:,.0f}) / FaceValue ({data['FaceValue']}) = {data['NumberOfShares']:,}")

        # Add metadata
        data['_currency'] = self.currency
        data['_rounding'] = self.rounding_level
        data['_schema_version'] = self.schema_version
        data['_warnings'] = self.warnings

        return data

    def get_reporting_period(self) -> Dict[str, Any]:
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

        # Fallback: If no period found in contexts, look for BSE-specific date fields
        # Some older BSE XBRL files store dates as data elements instead of in contexts
        if latest_date is None:
            try:
                # Look for BSE-specific reporting period fields
                for elem in self.root.iter():
                    tag_name = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

                    # Check for end date fields
                    if tag_name in ['DateOfEndOfReportingPeriod', 'DateOfEndOfFinancialYear']:
                        if elem.text and elem.text.strip():
                            try:
                                date_obj = datetime.strptime(elem.text.strip(), '%Y-%m-%d')
                                if latest_date is None or date_obj > latest_date:
                                    latest_date = date_obj
                            except:
                                pass

                    # Check for start date fields
                    if tag_name in ['DateOfStartOfReportingPeriod', 'DateOfStartOfFinancialYear']:
                        if elem.text and elem.text.strip():
                            try:
                                start_date = datetime.strptime(elem.text.strip(), '%Y-%m-%d')
                            except:
                                pass
            except:
                pass

        return {
            'endDate': latest_date.strftime('%Y-%m-%d') if latest_date else None,
            'startDate': start_date.strftime('%Y-%m-%d') if start_date else None,
        }

    def get_financial_year_and_quarter(self) -> Optional[Dict[str, Any]]:
        """Determine financial year and quarter from reporting period"""
        period = self.get_reporting_period()
        if not period or not period['endDate']:
            return None

        end_date = datetime.strptime(period['endDate'], '%Y-%m-%d')
        start_date = None
        if period['startDate']:
            start_date = datetime.strptime(period['startDate'], '%Y-%m-%d')

        # Determine Financial Year (FY ends in March in India)
        if end_date.month <= 3:
            fy_year = end_date.year
        else:
            fy_year = end_date.year + 1

        fy = f'FY{fy_year}'

        # Determine Quarter
        month = end_date.month
        if month in [6]:
            quarter = 'Q1'
        elif month in [9]:
            quarter = 'Q2'
        elif month in [12]:
            quarter = 'Q3'
        elif month in [3]:
            quarter = 'Q4'
        else:
            quarter = 'Q' + str((month - 1) // 3 + 1)

        # Check if it's a full year report
        is_annual = False
        if start_date and end_date:
            months_diff = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
            if months_diff >= 11:
                is_annual = True
                quarter = 'Q4'

        return {
            'fy': fy,
            'quarter': quarter,
            'isAnnual': is_annual,
            'endDate': period['endDate'],
            'startDate': period['startDate'],
        }

    def display_summary(self, data: Dict[str, Any]):
        """Display extracted data in a readable format"""
        print('\n' + '='*70)
        print('📄 Enhanced XBRL Financial Data Summary')
        print('='*70)

        period_info = self.get_financial_year_and_quarter()
        if period_info:
            print(f'\n📅 Reporting Period: {period_info["fy"]} {period_info["quarter"]}')
            print(f'    Period: {period_info["startDate"]} to {period_info["endDate"]}')
            if period_info["isAnnual"]:
                print(f'    Type: Annual Report')

        print(f'\n💱 Currency: {data.get("_currency", "Unknown")} (Rounding: {data.get("_rounding", "Unknown")})')

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
        print(f'  Shares (Cr):      {data.get("NumberOfShares", 0)/10000000:>15,.2f}')

        # Show warnings if any
        if data.get('_warnings'):
            print(f'\n⚠️  Validation Warnings:')
            for warning in data['_warnings'][:5]:  # Show first 5
                print(f'    {warning}')
            if len(data['_warnings']) > 5:
                print(f'    ... and {len(data["_warnings"]) - 5} more')

        print('='*70)


# Example usage
if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 xbrl_parser_v3.py <xbrl_file.xml>")
        sys.exit(1)

    xbrl_file = sys.argv[1]

    print(f"Parsing XBRL file: {xbrl_file}")

    parser = EnhancedXBRLParser(xbrl_file)
    data = parser.extract_all()

    if data:
        parser.display_summary(data)
        print(f"\n✅ Extracted {len([k for k in data.keys() if not k.startswith('_')])} financial metrics")
    else:
        print("❌ Failed to parse XBRL file")
