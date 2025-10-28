#!/usr/bin/env python3
"""
Report Display Utilities for Enhanced Company Report

Modular display methods for:
- Quarterly Financials
- Peer Comparison
- Detailed Forensics

This module keeps display logic separate from analysis logic for better maintainability.
"""


class ReportDisplays:
    """Display utilities for comprehensive company reports"""

    @staticmethod
    def print_quarterly_financials(quarterly_reporter, symbol, num_quarters=5):
        """
        Display quarterly financial metrics

        Args:
            quarterly_reporter: Instance of QuarterlyFinancialReport
            symbol: Stock symbol
            num_quarters: Number of quarters to display
        """
        print(f'\n📊 QUARTERLY FINANCIALS - {symbol}')
        print('=' * 120)

        # Detect sector
        sector = quarterly_reporter.detect_sector(symbol)

        # Fetch appropriate data based on sector
        if sector == 'BANKING':
            data = quarterly_reporter.get_banking_quarterly_data(symbol, num_quarters)
        else:
            data = quarterly_reporter.get_quarterly_data(symbol, num_quarters)

        if not data:
            print(f'❌ No quarterly data available for {symbol}')
            return

        # Display based on sector
        if sector == 'BANKING':
            ReportDisplays._print_banking_quarterly(data)
        else:
            ReportDisplays._print_general_quarterly(data)

    @staticmethod
    def _print_general_quarterly(data):
        """Print quarterly data for non-banking companies"""
        print(f'\n{"Period":<12} {"Revenue":<12} {"Op Profit":<12} {"Net Profit":<12} {"OPM %":<8} {"NPM %":<8} {"EPS":<8} {"YoY %":<8}')
        print('-' * 120)

        for record in data:
            period = f"{record.get('quarter', 'N/A')} {record.get('fy', 'N/A')}"
            revenue = record.get('revenue_cr', 0)
            op_profit = record.get('operating_profit_cr', 0)
            net_profit = record.get('net_profit_cr', 0)
            opm = record.get('operating_profit_margin', 0)
            npm = record.get('net_profit_margin', 0)
            eps = record.get('eps', 0)
            yoy = record.get('revenue_growth_yoy')

            yoy_str = f"{yoy:>6.1f}%" if yoy is not None else "N/A"

            print(f'{period:<12} {revenue:>10.2f}  {op_profit:>10.2f}  {net_profit:>10.2f}  {opm:>6.2f}  {npm:>6.2f}  {eps:>6.2f}  {yoy_str}')

        print('-' * 120)
        print('Figures in Crores | YoY = Year-over-Year growth | OPM = Operating Profit Margin | NPM = Net Profit Margin')

    @staticmethod
    def _print_banking_quarterly(data):
        """Print quarterly data for banking companies"""
        print(f'\n{"Period":<12} {"NII":<10} {"NIM %":<8} {"Adv":<10} {"Deps":<10} {"CD %":<8} {"Prov":<10} {"Profit":<10}')
        print('-' * 120)

        for record in data:
            period = f"{record.get('quarter', 'N/A')} {record.get('fy', 'N/A')}"
            nii = record.get('net_interest_income_cr', 0)
            nim = record.get('net_interest_margin', 0)
            advances = record.get('advances_cr', 0)
            deposits = record.get('deposits_cr', 0)
            cd_ratio = record.get('cd_ratio', 0)
            provisions = record.get('provisions_cr', 0)
            profit = record.get('net_profit_cr', 0)

            print(f'{period:<12} {nii:>8.2f}  {nim:>6.2f}  {advances:>8.2f}  {deposits:>8.2f}  {cd_ratio:>6.2f}  {provisions:>8.2f}  {profit:>8.2f}')

        print('-' * 120)
        print('Figures in Crores | NII = Net Interest Income | NIM = Net Interest Margin')
        print('Adv = Advances | Deps = Deposits | CD = Credit-Deposit Ratio | Prov = Provisions')

    @staticmethod
    def print_peer_comparison(quarterly_reporter, symbol, peers, num_quarters=1):
        """
        Display peer comparison table

        Args:
            quarterly_reporter: Instance of QuarterlyFinancialReport
            symbol: Primary stock symbol
            peers: List of peer symbols
            num_quarters: Number of quarters to compare (default: 1 = latest)
        """
        print(f'\n🤝 PEER COMPARISON - {symbol} vs Peers')
        print('=' * 120)

        # Fetch data for primary company
        all_companies = [symbol] + peers
        comparison_data = {}

        for company in all_companies:
            sector = quarterly_reporter.detect_sector(company)
            if sector == 'BANKING':
                data = quarterly_reporter.get_banking_quarterly_data(company, num_quarters)
            else:
                data = quarterly_reporter.get_quarterly_data(company, num_quarters)

            if data and len(data) > 0:
                comparison_data[company] = data[0]  # Latest quarter

        if not comparison_data:
            print(f'❌ No comparison data available')
            return

        # Display comparison
        sector = quarterly_reporter.detect_sector(symbol)
        if sector == 'BANKING':
            ReportDisplays._print_banking_comparison(comparison_data, symbol)
        else:
            ReportDisplays._print_general_comparison(comparison_data, symbol)

    @staticmethod
    def _print_general_comparison(data, primary_symbol):
        """Print peer comparison for non-banking companies"""
        print(f'\n{"Company":<12} {"Revenue":<12} {"Net Profit":<12} {"OPM %":<8} {"NPM %":<8} {"EPS":<8} {"YoY %":<8}')
        print('-' * 120)

        # Print primary company first
        if primary_symbol in data:
            record = data[primary_symbol]
            revenue = record.get('revenue_cr', 0)
            profit = record.get('net_profit_cr', 0)
            opm = record.get('operating_profit_margin', 0)
            npm = record.get('net_profit_margin', 0)
            eps = record.get('eps', 0)
            yoy = record.get('revenue_growth_yoy')
            yoy_str = f"{yoy:>6.1f}%" if yoy is not None else "N/A"

            print(f'{primary_symbol:<12} {revenue:>10.2f}  {profit:>10.2f}  {opm:>6.2f}  {npm:>6.2f}  {eps:>6.2f}  {yoy_str}  ⭐')

        # Print peers
        for company, record in data.items():
            if company == primary_symbol:
                continue

            revenue = record.get('revenue_cr', 0)
            profit = record.get('net_profit_cr', 0)
            opm = record.get('operating_profit_margin', 0)
            npm = record.get('net_profit_margin', 0)
            eps = record.get('eps', 0)
            yoy = record.get('revenue_growth_yoy')
            yoy_str = f"{yoy:>6.1f}%" if yoy is not None else "N/A"

            print(f'{company:<12} {revenue:>10.2f}  {profit:>10.2f}  {opm:>6.2f}  {npm:>6.2f}  {eps:>6.2f}  {yoy_str}')

        print('-' * 120)
        print('Latest Quarter | ⭐ = Primary Company | Figures in Crores')

    @staticmethod
    def _print_banking_comparison(data, primary_symbol):
        """Print peer comparison for banking companies"""
        print(f'\n{"Company":<12} {"NII":<10} {"NIM %":<8} {"Profit":<10} {"NPM %":<8} {"CD %":<8} {"Prov":<10}')
        print('-' * 120)

        # Print primary company first
        if primary_symbol in data:
            record = data[primary_symbol]
            nii = record.get('net_interest_income_cr', 0)
            nim = record.get('net_interest_margin', 0)
            profit = record.get('net_profit_cr', 0)
            npm = record.get('net_profit_margin', 0)
            cd = record.get('cd_ratio', 0)
            prov = record.get('provisions_cr', 0)

            print(f'{primary_symbol:<12} {nii:>8.2f}  {nim:>6.2f}  {profit:>8.2f}  {npm:>6.2f}  {cd:>6.2f}  {prov:>8.2f}  ⭐')

        # Print peers
        for company, record in data.items():
            if company == primary_symbol:
                continue

            nii = record.get('net_interest_income_cr', 0)
            nim = record.get('net_interest_margin', 0)
            profit = record.get('net_profit_cr', 0)
            npm = record.get('net_profit_margin', 0)
            cd = record.get('cd_ratio', 0)
            prov = record.get('provisions_cr', 0)

            print(f'{company:<12} {nii:>8.2f}  {nim:>6.2f}  {profit:>8.2f}  {npm:>6.2f}  {cd:>6.2f}  {prov:>8.2f}')

        print('-' * 120)
        print('Latest Quarter | ⭐ = Primary Company | Figures in Crores')

    @staticmethod
    def print_detailed_forensics(forensic_report):
        """
        Display comprehensive forensic analysis with full details

        Args:
            forensic_report: Full forensic report dict from ForensicAnalyzer
        """
        print(f'\n🔍 COMPREHENSIVE FORENSIC ANALYSIS')
        print('=' * 120)

        if not forensic_report:
            print('❌ No forensic data available')
            return

        # M-Score Details (using actual key name from forensic analyzer)
        if 'beneish_m_score' in forensic_report:
            ReportDisplays._print_m_score_details(forensic_report['beneish_m_score'])

        # Z-Score Details (using actual key name from forensic analyzer)
        if 'altman_z_score' in forensic_report:
            ReportDisplays._print_z_score_details(forensic_report['altman_z_score'])

        # F-Score Details (using actual key name from forensic analyzer)
        if 'piotroski_f_score' in forensic_report:
            ReportDisplays._print_f_score_details(forensic_report['piotroski_f_score'])

        # J-Score Details (using actual key name from forensic analyzer)
        if 'j_score' in forensic_report:
            ReportDisplays._print_j_score_details(forensic_report['j_score'])

        # Red Flags Summary (using actual key name from forensic analyzer)
        if 'red_flags' in forensic_report:
            ReportDisplays._print_red_flags(forensic_report['red_flags'])

        # Overall Assessment
        ReportDisplays._print_overall_assessment(forensic_report)

    @staticmethod
    def _print_m_score_details(m_score_data):
        """Print detailed M-Score breakdown"""
        print('\n📋 Beneish M-Score (Earnings Manipulation Detection)')
        print('-' * 120)

        if not m_score_data or m_score_data.get('M_Score') is None:
            print('   ⚠️  Insufficient data for M-Score calculation')
            return

        score = m_score_data['M_Score']
        category = m_score_data.get('Manipulation_Likelihood', 'Unknown')

        print(f'   M-Score: {score:.3f}')
        print(f'   Risk: {category}')
        print(f'   Threshold: -2.22 (scores > -2.22 indicate possible manipulation)')

        # Component ratios if available
        if 'Components' in m_score_data:
            print('\n   Component Ratios:')
            for component, value in m_score_data['Components'].items():
                print(f'      {component}: {value:.3f}')

    @staticmethod
    def _print_z_score_details(z_score_data):
        """Print detailed Z-Score breakdown"""
        print('\n📋 Altman Z-Score (Bankruptcy Prediction)')
        print('-' * 120)

        if not z_score_data or z_score_data.get('Z_Score') is None:
            print('   ⚠️  Insufficient data for Z-Score calculation')
            return

        score = z_score_data['Z_Score']
        category = z_score_data.get('Risk_Category', 'Unknown')

        print(f'   Z-Score: {score:.2f}')
        print(f'   Zone: {category}')
        print(f'   Interpretation: > 2.99 = Safe | 1.81-2.99 = Grey | < 1.81 = Distress')

        # Component analysis if available
        if 'Components' in z_score_data:
            print('\n   Component Analysis:')
            for component, value in z_score_data['Components'].items():
                print(f'      {component}: {value:.3f}')

    @staticmethod
    def _print_f_score_details(f_score_data):
        """Print detailed F-Score breakdown"""
        print('\n📋 Piotroski F-Score (Financial Strength)')
        print('-' * 120)

        if not f_score_data or f_score_data.get('F_Score') is None:
            print('   ⚠️  Insufficient data for F-Score calculation')
            return

        score = f_score_data['F_Score']
        interpretation = f_score_data.get('Interpretation', 'Unknown')

        print(f'   F-Score: {score}/9')
        print(f'   Strength: {interpretation}')
        print(f'   Interpretation: 8-9 = Strong | 5-7 = Moderate | 0-4 = Weak')

        # Detailed criteria if available
        if 'Criteria' in f_score_data:
            print('\n   Criteria Breakdown:')
            for criterion, passed in f_score_data['Criteria'].items():
                status = '✓' if passed else '✗'
                print(f'      {status} {criterion}')

    @staticmethod
    def _print_j_score_details(j_score_data):
        """Print detailed J-Score breakdown"""
        print('\n📋 J-Score (Cash Flow Quality)')
        print('-' * 120)

        if not j_score_data or j_score_data.get('J_Score') is None:
            print('   ⚠️  Insufficient data for J-Score calculation')
            return

        score = j_score_data['J_Score']
        category = j_score_data.get('Risk_Category', 'Unknown')
        flags_count = j_score_data.get('Flags_Count', 0)

        print(f'   J-Score: {score}')
        print(f'   Risk: {category}')
        print(f'   Flags: {flags_count}')
        print(f'   Interpretation: 0-5 = Low | 6-10 = Medium | 11+ = High Risk')

        # Detailed flags
        if 'Flags' in j_score_data and j_score_data['Flags']:
            print(f'\n   📋 J-Score Flags:')
            for flag in j_score_data['Flags']:
                severity = flag.get('severity', 'UNKNOWN')
                flag_type = flag.get('type', 'Unknown')
                description = flag.get('description', 'No description')
                year = flag.get('year', 'N/A')

                emoji = '🔴' if severity == 'HIGH' else '⚠️ '
                print(f'      {emoji} {flag_type} [{severity}] - {year}')
                print(f'         {description}')

    @staticmethod
    def _print_red_flags(red_flags_data):
        """Print red flags summary"""
        print('\n🚩 RED FLAGS DETECTION')
        print('-' * 120)

        if not red_flags_data:
            print('   ✅ No red flags detected')
            return

        total_flags = red_flags_data.get('Total_Flags', 0)
        high_severity = red_flags_data.get('High_Severity', 0)
        medium_severity = red_flags_data.get('Medium_Severity', 0)

        print(f'   Total Flags: {total_flags}')
        print(f'   High Severity: {high_severity}')
        print(f'   Medium Severity: {medium_severity}')

        if 'Flags' in red_flags_data and red_flags_data['Flags']:
            print('\n   Detailed Flags:')
            for flag in red_flags_data['Flags']:
                severity = flag.get('severity', 'UNKNOWN')
                description = flag.get('description', 'No description')
                emoji = '🔴' if severity == 'HIGH' else '⚠️ '
                print(f'      {emoji} [{severity}] {description}')

    @staticmethod
    def _print_overall_assessment(forensic_report):
        """Print overall forensic assessment"""
        print('\n🎯 OVERALL FORENSIC ASSESSMENT')
        print('-' * 120)

        # Composite risk
        if 'Composite_Risk' in forensic_report:
            risk = forensic_report['Composite_Risk']
            score = forensic_report.get('Composite_Score', 0)
            print(f'   Overall Risk: {risk}')
            print(f'   Composite Score: {score:.1f}/100')

        # Recommendation
        if 'Recommendation' in forensic_report:
            recommendation = forensic_report['Recommendation']
            print(f'   Recommendation: {recommendation}')

        # Data quality
        if 'Data_Quality' in forensic_report:
            quality = forensic_report['Data_Quality']
            print(f'   Data Quality: {quality}')
