#!/usr/bin/env python3
"""
Comprehensive Forensic Analyzer

Main script that runs all forensic models and generates a complete
forensic analysis report for a company.

Usage:
    ./forensics/forensic_analyzer.py TCS
    ./forensics/forensic_analyzer.py TCS --statement-type consolidated
    ./forensics/forensic_analyzer.py TCS --years 3 --output json
"""

import sys
import os
import json
from datetime import datetime

# Add scripts directory to path for cross-folder imports
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.dirname(current_dir)
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from forensics.data_loader import ForensicDataLoader
from forensics.multi_source_loader import MultiSourceDataLoader
from forensics.data_validator import DataValidator
from forensics.beneish_m_score import BeneishMScore
from forensics.altman_z_score import AltmanZScore
from forensics.piotroski_f_score import PiotroskiFScore
from forensics.j_score import JScore
from forensics.red_flags import RedFlagsDetector


class ForensicAnalyzer:
    """Comprehensive forensic analysis orchestrator"""

    def __init__(self, db_path=None, use_multi_source=True):
        """
        Initialize analyzer

        Args:
            db_path: Path to DuckDB database
            use_multi_source: If True, use multi-source loader (XBRL + Yahoo fallback)
                            If False, use XBRL-only loader
        """
        if use_multi_source:
            self.loader = MultiSourceDataLoader(db_path)
        else:
            self.loader = ForensicDataLoader(db_path)

        self.validator = DataValidator()
        self.use_multi_source = use_multi_source

    def analyze_company(self, symbol, statement_type='standalone', years=5, company_type='manufacturing'):
        """
        Run complete forensic analysis for a company

        Args:
            symbol: Stock symbol
            statement_type: 'standalone', 'consolidated', or 'auto' (auto-detect)
            years: Number of years to analyze
            company_type: 'manufacturing', 'service', or 'emerging_market'

        Returns:
            Comprehensive forensic report dict
        """
        # Auto-detect statement type if set to 'auto'
        if statement_type == 'auto':
            import duckdb
            import os
            db_path = os.path.join(os.getcwd(), 'data', 'fundamentals.duckdb')
            conn = duckdb.connect(db_path, read_only=True)
            counts = conn.execute("""
                SELECT statement_type, COUNT(*) as count
                FROM xbrl_data
                WHERE symbol = ?
                GROUP BY statement_type
                ORDER BY count DESC
            """, [symbol]).fetchall()
            conn.close()

            if counts and len(counts) > 0:
                statement_type = counts[0][0]  # Pick the type with most records
            else:
                statement_type = 'consolidated'  # Default fallback

        print(f'\n{"="*70}')
        print(f'🔍 FORENSIC ANALYSIS: {symbol}')
        print(f'{"="*70}')
        print(f'Statement Type: {statement_type.upper()}')
        print(f'Analysis Period: {years} years')
        print(f'Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        print(f'{"="*70}\n')

        # Load data with multi-source fallback if enabled
        print('📊 Loading financial data...')

        if self.use_multi_source:
            data_timeseries = self.loader.get_normalized_timeseries_multi_source(symbol, statement_type, years)
        else:
            data_timeseries = self.loader.get_normalized_timeseries(symbol, statement_type, years)

        if not data_timeseries:
            return {
                'symbol': symbol,
                'error': 'No data available',
                'recommendation': 'INSUFFICIENT_DATA'
            }

        print(f'   ✓ Loaded {len(data_timeseries)} years of data')

        # Show data sources
        if self.use_multi_source and data_timeseries:
            sources = [d.get('data_source', 'Unknown') for d in data_timeseries]
            avg_quality = sum(d.get('quality_score', 0) for d in data_timeseries) / len(data_timeseries)
            print(f'   📌 Data sources: {", ".join(sources)}')
            print(f'   📊 Average quality: {avg_quality:.1f}%')

        # Run data validation on all years
        print('\n🔍 Validating data quality...')
        validation_results = []
        for year_data in data_timeseries:
            val_result = self.validator.validate_annual_data(
                year_data,
                symbol=symbol,
                fy=year_data.get('fy')
            )
            validation_results.append(val_result)

        # Show validation summary
        avg_quality = sum(v['quality_score'] for v in validation_results) / len(validation_results)
        total_errors = sum(len(v['errors']) for v in validation_results)
        total_warnings = sum(len(v['warnings']) for v in validation_results)

        print(f'   ✓ Validation complete')
        print(f'   📊 Average data quality: {avg_quality:.1f}/100')
        if total_errors > 0:
            print(f'   ❌ Total errors: {total_errors}')
        if total_warnings > 0:
            print(f'   ⚠️  Total warnings: {total_warnings}')

        # Show detailed errors and warnings if there are any issues
        if total_errors > 0 or total_warnings > 0:
            print(f'\n   📋 Validation Details:')
            for val_result in validation_results:
                # Get year from metadata or top level
                year = val_result.get('year') or val_result.get('metadata', {}).get('fy', 'Unknown')
                errors = val_result.get('errors', [])
                warnings = val_result.get('warnings', [])

                # Always show ALL errors (they're critical)
                if errors:
                    print(f'\n   {year} - ❌ Errors ({len(errors)}):')
                    for err in errors:
                        print(f'      • {err}')

                # Show warnings (limit to top 5 per year to avoid clutter)
                if warnings:
                    print(f'\n   {year} - ⚠️  Warnings ({len(warnings)}):')
                    for warn in warnings[:5]:
                        print(f'      • {warn}')
                    if len(warnings) > 5:
                        print(f'      ... and {len(warnings) - 5} more warnings')

        # Get current and previous year for YoY analysis
        current_year = data_timeseries[0]
        previous_year = data_timeseries[1] if len(data_timeseries) > 1 else None

        # Run all forensic models
        report = {
            'metadata': {
                'symbol': symbol,
                'company_name': symbol,  # Could be enhanced with actual company name
                'statement_type': statement_type,
                'company_type': company_type,
                'analysis_date': datetime.now().isoformat(),
                'data_years': len(data_timeseries),
                'latest_period': current_year['fy'],
                'earliest_period': data_timeseries[-1]['fy'],
                'multi_source_enabled': self.use_multi_source
            },
            'data_quality': {
                'average_quality_score': avg_quality,
                'validation_results': validation_results,
                'total_errors': total_errors,
                'total_warnings': total_warnings,
                'data_sources': [d.get('data_source', 'Unknown') for d in data_timeseries] if self.use_multi_source else ['XBRL'] * len(data_timeseries)
            }
        }

        # 1. Beneish M-Score (Earnings Manipulation Detection)
        if previous_year:
            print('\n📈 Calculating Beneish M-Score (Earnings Manipulation)...')
            report['beneish_m_score'] = BeneishMScore.calculate(current_year, previous_year)
            print(f'   M-Score: {report["beneish_m_score"]["M_Score"]}')
            print(f'   Risk: {report["beneish_m_score"]["Risk_Category"]}')

            # Print detailed breakdown of 8 components
            if 'Components' in report['beneish_m_score']:
                print('\n   📋 M-Score Components:')
                components = report['beneish_m_score']['Components']
                for comp_name, comp_value in components.items():
                    if isinstance(comp_value, (int, float)):
                        print(f'      • {comp_name}: {comp_value:.4f}')
                    else:
                        print(f'      • {comp_name}: {comp_value}')

        # 2. Altman Z-Score (Bankruptcy Prediction)
        # NOTE: Altman Z-Score is NOT applicable for banking/financial companies
        # Banks have different balance sheet structure (deposits/advances vs assets/liabilities)

        # Check multiple field names for banking detection
        is_banking = (
            current_year.get('deposits', 0) > 0 or
            current_year.get('advances', 0) > 0 or
            current_year.get('raw_deposits', 0) > 0 or
            current_year.get('raw_advances', 0) > 0 or
            current_year.get('interest_income', 0) > 0 or
            current_year.get('raw_interest_income', 0) > 0 or
            # Check symbol against known banking stocks
            symbol.upper() in ['SBIN', 'HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK',
                              'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'IDFCFIRSTB',
                              'PNB', 'BANKBARODA', 'CANBK']
        )

        if is_banking:
            print('\n💼 Altman Z-Score: N/A (Banking Company)')
            print('   ℹ️  Z-Score is not applicable for banking/financial institutions')
            print('   ℹ️  Banks require specialized metrics (CAR, NPA, CASA ratio, etc.)')
            report['altman_z_score'] = {
                'Z_Score': None,
                'Risk_Category': 'N/A - Banking Company',
                'Note': 'Altman Z-Score not applicable for banking institutions. Use banking-specific metrics instead.'
            }
        else:
            print('\n💼 Calculating Altman Z-Score (Bankruptcy Risk)...')
            is_listed = current_year.get('market_cap', 0) > 0
            report['altman_z_score'] = AltmanZScore.calculate(current_year, company_type, is_listed)
            print(f'   Z-Score: {report["altman_z_score"]["Z_Score"]}')
            print(f'   Risk: {report["altman_z_score"]["Risk_Category"]}')

        # Print detailed breakdown of Z-Score components
        if 'Components' in report['altman_z_score']:
            print('\n   📋 Z-Score Components:')
            components = report['altman_z_score']['Components']
            for comp_name, comp_value in components.items():
                if isinstance(comp_value, (int, float)):
                    print(f'      • {comp_name}: {comp_value:.4f}')
                else:
                    print(f'      • {comp_name}: {comp_value}')

        # 3. Piotroski F-Score (Fundamental Strength)
        if previous_year:
            print('\n⭐ Calculating Piotroski F-Score (Fundamental Strength)...')
            report['piotroski_f_score'] = PiotroskiFScore.calculate(current_year, previous_year)
            print(f'   F-Score: {report["piotroski_f_score"]["F_Score"]}/9')
            print(f'   Quality: {report["piotroski_f_score"]["Investment_Quality"]}')

            # Print detailed breakdown of all 9 criteria
            print('\n   📋 Detailed Breakdown:')
            details = report['piotroski_f_score'].get('Details', {})
            for criterion, result in details.items():
                score = result.get('score', 0)
                status = '✅' if score == 1 else '❌'
                description = result.get('description', 'N/A')
                print(f'      {status} {criterion}: {description}')

        # 4. J-Score (Cash Flow Forensics)
        print('\n💰 Calculating J-Score (Cash Flow Quality)...')
        report['j_score'] = JScore.calculate(data_timeseries)
        print(f'   J-Score: {report["j_score"].get("J_Score", "N/A")}')
        print(f'   Risk: {report["j_score"].get("Risk_Category", "Unknown")}')
        if 'Flags_Count' in report['j_score']:
            print(f'   Flags: {report["j_score"]["Flags_Count"]}')

        # Print detailed J-Score flags
        if 'Flags' in report['j_score'] and report['j_score']['Flags']:
            print('\n   📋 J-Score Flags:')
            for flag in report['j_score']['Flags']:
                print(f'      ⚠️  {flag}')

        # 5. Red Flags Detection
        print('\n🚩 Running Red Flags Detection...')
        report['red_flags'] = RedFlagsDetector.detect_all(data_timeseries)
        print(f'   Total Flags: {report["red_flags"]["total_flags"]}')
        print(f'   High Severity: {len(report["red_flags"]["high_severity"])}')
        print(f'   Medium Severity: {len(report["red_flags"]["medium_severity"])}')
        print(f'   Assessment: {report["red_flags"]["summary"]["assessment"]}')

        # 6. Composite Risk Score
        print('\n🎯 Calculating Composite Risk Score...')
        report['composite_score'] = self._calculate_composite_score(report)
        print(f'   Overall Risk: {report["composite_score"]["overall_risk"]}')
        print(f'   Composite Score: {report["composite_score"]["score"]}/100')
        print(f'   Data Coverage: {report["composite_score"]["data_coverage"]:.0f}% ({"Sufficient" if report["composite_score"]["data_coverage"] >= 50 else "Limited"})')

        # 7. Final Recommendation
        report['recommendation'] = self._generate_recommendation(report)
        print(f'\n📝 Final Recommendation: {report["recommendation"]["action"]}')
        print(f'   {report["recommendation"]["rationale"]}')

        # 8. Include loaded data in report for reuse (avoid duplicate loading)
        report['_loaded_data'] = data_timeseries

        print(f'\n{"="*70}')
        print('✅ Forensic analysis complete!')
        print(f'{"="*70}\n')

        return report

    def _calculate_composite_score(self, report):
        """
        Calculate composite risk score (0-100)
        Higher score = Higher risk

        Weighted average of all models
        """
        score = 0
        weights_total = 0

        # Beneish M-Score (weight: 25)
        if 'beneish_m_score' in report and report['beneish_m_score'].get('M_Score') is not None:
            m_score = report['beneish_m_score']['M_Score']
            if m_score > -2.22:
                score += 75  # High risk
            elif m_score > -2.5:
                score += 50  # Medium risk
            else:
                score += 25  # Low risk
            weights_total += 25

        # Altman Z-Score (weight: 25)
        # Skip for banking companies as Z-Score is not applicable
        if 'altman_z_score' in report:
            # Check if this is a banking company (Z-Score = N/A)
            if report['altman_z_score'].get('Risk_Category') == 'N/A - Banking Company':
                # For banks, assume neutral score (don't penalize for N/A Z-Score)
                score += 50  # Neutral - banks need different metrics
                weights_total += 25
            elif report['altman_z_score'].get('Z_Score') is not None:
                z_score = report['altman_z_score']['Z_Score']
                if z_score < 1.81:
                    score += 75  # High risk
                elif z_score < 2.99:
                    score += 50  # Medium risk
                else:
                    score += 25  # Low risk
                weights_total += 25

        # Piotroski F-Score (weight: 20)
        if 'piotroski_f_score' in report and report['piotroski_f_score'].get('F_Score') is not None:
            f_score = report['piotroski_f_score']['F_Score']
            if f_score <= 4:
                score += 60  # Weak
            elif f_score <= 7:
                score += 40  # Moderate
            else:
                score += 20  # Strong
            weights_total += 20

        # J-Score (weight: 15)
        if 'j_score' in report and report['j_score'].get('J_Score') is not None:
            j_score_val = report['j_score']['J_Score']
            if j_score_val >= 11:
                score += 60  # High risk
            elif j_score_val >= 6:
                score += 40  # Medium risk
            else:
                score += 20  # Low risk
            weights_total += 15

        # Red Flags (weight: 15)
        if 'red_flags' in report:
            high_count = len(report['red_flags'].get('high_severity', []))
            medium_count = len(report['red_flags'].get('medium_severity', []))

            if high_count > 0:
                score += 45  # 300% of weight - very serious
            elif medium_count >= 3:
                score += 30  # 200% of weight - serious
            elif medium_count >= 1:
                score += 20  # 133% of weight - minor concern
            else:
                score += 15  # 100% of weight - no flags
            weights_total += 15

        # Normalize to 0-100 scale
        # Each metric scores 1x-3x its weight (low risk=1x, medium=2x, high=3x)
        # So max possible score is weights_total * 3
        # Normalize to 0-100: (score / (weights_total * 3)) * 100
        if weights_total > 0:
            max_possible_score = weights_total * 3
            composite = (score / max_possible_score) * 100
        else:
            composite = None  # No data to calculate

        # Categorize
        if composite is None:
            risk_level = 'INSUFFICIENT_DATA'
        elif composite >= 70:
            risk_level = 'HIGH'
        elif composite >= 40:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'

        return {
            'score': round(composite, 2) if composite is not None else None,
            'overall_risk': risk_level,
            'scale': '0 (Best) - 100 (Worst)',
            'data_coverage': round((weights_total / 100) * 100, 1) if weights_total > 0 else 0
        }

    def _generate_recommendation(self, report):
        """Generate final investment recommendation"""
        composite = report.get('composite_score', {})
        risk_level = composite.get('overall_risk', 'MEDIUM')
        score = composite.get('score', 50)
        data_coverage = composite.get('data_coverage', 0)

        # Count critical issues
        high_severity_flags = len(report.get('red_flags', {}).get('high_severity', []))
        is_manipulator = report.get('beneish_m_score', {}).get('Is_Manipulator', False)
        # For banking companies, skip Z-Score distress check
        z_risk_category = report.get('altman_z_score', {}).get('Risk_Category')
        is_distressed = z_risk_category == 'Distress' if z_risk_category != 'N/A - Banking Company' else False
        is_weak_fundamentals = report.get('piotroski_f_score', {}).get('F_Score', 5) <= 3

        # Check if we have sufficient data for strong recommendations
        # Need at least 50% data coverage (M-Score OR F-Score available)
        has_sufficient_data = data_coverage >= 50

        # Decision logic
        if high_severity_flags > 0 or is_distressed:
            action = 'AVOID'
            rationale = 'Critical red flags or bankruptcy risk detected. Not suitable for investment.'
            priority_actions = [
                'Review high-severity red flags immediately',
                'Investigate liquidity and solvency concerns',
                'Consider exit if currently invested'
            ]

        elif is_manipulator or (score >= 70 and has_sufficient_data):
            action = 'AVOID'
            rationale = 'High forensic risk score indicates potential earnings manipulation or financial distress.'
            priority_actions = [
                'Detailed review of accounting policies required',
                'Independent verification of financials recommended',
                'Wait for improved fundamentals before considering'
            ]

        elif not has_sufficient_data and risk_level == 'HIGH':
            # Low data coverage but score looks high - likely insufficient data issue
            action = 'INSUFFICIENT_DATA'
            rationale = f'Insufficient historical data for comprehensive analysis (coverage: {data_coverage:.0f}%). Available indicators show no critical issues.'
            priority_actions = [
                'Wait for more quarterly reports to be available',
                'Perform manual review of available financials',
                'Use alternative analysis methods (technical, peer comparison)',
                'Re-run analysis when more data becomes available'
            ]

        elif is_weak_fundamentals or score >= 55:
            action = 'CAUTION'
            rationale = 'Multiple concerns identified. Detailed investigation required before investment decision.'
            priority_actions = [
                'Conduct thorough due diligence on flagged issues',
                'Seek management explanation for anomalies',
                'Compare with industry peers',
                'Monitor for improvement over next 2-3 quarters'
            ]

        elif score >= 35:
            action = 'MONITOR'
            rationale = 'Some concerns present but not critical. Acceptable for further analysis with ongoing monitoring.'
            priority_actions = [
                'Track identified issues quarterly',
                'Watch for trend improvements or deterioration',
                'Conduct standard investment analysis'
            ]

        else:
            action = 'ACCEPTABLE'
            rationale = 'Forensic analysis shows low risk. Financials appear healthy for standard investment evaluation.'
            priority_actions = [
                'Proceed with regular fundamental analysis',
                'Continue quarterly monitoring',
                'Review competitive positioning and growth prospects'
            ]

        return {
            'action': action,
            'rationale': rationale,
            'composite_score': score,
            'priority_actions': priority_actions,
            'key_concerns': self._extract_key_concerns(report)
        }

    def _extract_key_concerns(self, report):
        """Extract top 5 key concerns from the analysis"""
        concerns = []

        # From Beneish M-Score
        if report.get('beneish_m_score', {}).get('Is_Manipulator'):
            concerns.append('⚠️ Beneish M-Score indicates possible earnings manipulation')

        # From Altman Z-Score (skip for banking companies)
        z_risk = report.get('altman_z_score', {}).get('Risk_Category')
        if z_risk == 'Distress':
            concerns.append('⚠️ High bankruptcy risk (Altman Z-Score in distress zone)')
        elif z_risk == 'Grey Zone':
            concerns.append('⚠️ Uncertain financial health (Altman Z-Score in grey zone)')
        elif z_risk == 'N/A - Banking Company':
            # Add note that banking-specific metrics should be reviewed
            concerns.append('ℹ️  Banking company - review CAR, NPA ratio, and CASA metrics separately')

        # From Piotroski F-Score
        f_score = report.get('piotroski_f_score', {}).get('F_Score', 5)
        if f_score <= 3:
            concerns.append('⚠️ Very weak fundamentals (Piotroski F-Score ≤ 3)')

        # From J-Score
        j_flags = report.get('j_score', {}).get('Flags', [])
        for flag in j_flags[:2]:  # Top 2 J-Score flags
            if flag.get('severity') == 'HIGH':
                concerns.append(f"⚠️ {flag['type']}: {flag['description']}")

        # From Red Flags
        high_flags = report.get('red_flags', {}).get('high_severity', [])
        for flag in high_flags[:2]:  # Top 2 high-severity flags
            concerns.append(f"⚠️ {flag['type']}: {flag['description']}")

        return concerns[:5]  # Return top 5 concerns

    def close(self):
        """Close database connection"""
        if self.loader:
            self.loader.close()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Comprehensive Forensic Analysis for Companies',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Analyze TCS standalone financials
    ./forensics/forensic_analyzer.py TCS

    # Analyze consolidated financials
    ./forensics/forensic_analyzer.py TCS --statement-type consolidated

    # Analyze last 3 years only
    ./forensics/forensic_analyzer.py TCS --years 3

    # Export to JSON
    ./forensics/forensic_analyzer.py TCS --output json

    # Analyze multiple companies
    ./forensics/forensic_analyzer.py TCS RELIANCE INFY
        """
    )

    parser.add_argument('symbols', nargs='+', help='Stock symbols to analyze')
    parser.add_argument('--statement-type', default='auto',
                       choices=['standalone', 'consolidated', 'auto'],
                       help='Type of financial statement (default: auto - picks type with more data)')
    parser.add_argument('--years', type=int, default=5,
                       help='Number of years to analyze (default: 5)')
    parser.add_argument('--company-type', default='manufacturing',
                       choices=['manufacturing', 'service', 'emerging_market'],
                       help='Company type for Altman Z-Score (default: manufacturing)')
    parser.add_argument('--output', choices=['text', 'json'],
                       default='text',
                       help='Output format (default: text)')

    args = parser.parse_args()

    # Initialize analyzer
    analyzer = ForensicAnalyzer()

    # Analyze each symbol
    reports = {}

    for symbol in args.symbols:
        try:
            # Auto-detect statement type if set to 'auto'
            statement_type = args.statement_type
            if statement_type == 'auto':
                # Check which statement type has more data
                import duckdb
                conn = duckdb.connect('data/fundamentals.duckdb', read_only=True)
                counts = conn.execute("""
                    SELECT statement_type, COUNT(*) as count
                    FROM xbrl_data
                    WHERE symbol = ?
                    GROUP BY statement_type
                    ORDER BY count DESC
                """, [symbol]).fetchall()
                conn.close()

                if counts and len(counts) > 0:
                    statement_type = counts[0][0]  # Pick the type with most records
                    print(f'🔍 Auto-detected statement type: {statement_type.upper()} ({counts[0][1]} records)')
                else:
                    statement_type = 'consolidated'  # Default fallback
                    print(f'⚠️  No data found, defaulting to: {statement_type}')

            report = analyzer.analyze_company(
                symbol,
                statement_type=statement_type,
                years=args.years,
                company_type=args.company_type
            )
            reports[symbol] = report

        except Exception as e:
            print(f'\n❌ Error analyzing {symbol}: {str(e)}')
            import traceback
            traceback.print_exc()

    # Output results
    if args.output == 'json':
        output_file = f"forensic_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(reports, f, indent=2, default=str)
        print(f'\n📄 Report saved to: {output_file}')
    else:
        # Text output already printed during analysis
        print('\n✅ Analysis complete for all symbols!')

    analyzer.close()


if __name__ == '__main__':
    main()
