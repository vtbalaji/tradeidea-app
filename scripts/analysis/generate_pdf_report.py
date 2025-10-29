#!/usr/bin/env python3
"""
PDF Report Generator for Investment Analysis
Converts JSON analysis to professional PDF reports
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from jinja2 import Template

def format_number(value, decimals=2):
    """Format number with proper decimals"""
    if value is None:
        return "N/A"
    try:
        if isinstance(value, (int, float)):
            if abs(value) >= 10000:
                return f"{value:,.0f}"
            elif decimals == 0:
                return f"{value:,.0f}"
            else:
                return f"{value:,.{decimals}f}"
        return str(value)
    except:
        return "N/A"

def get_recommendation_class(recommendation):
    """Get CSS class for recommendation"""
    rec_lower = recommendation.lower()
    if 'strong buy' in rec_lower:
        return 'strong-buy'
    elif 'buy' in rec_lower:
        return 'buy'
    elif 'hold' in rec_lower:
        return 'hold'
    elif 'strong sell' in rec_lower:
        return 'strong-sell'
    elif 'sell' in rec_lower:
        return 'sell'
    return 'hold'

def get_status_indicator(value, good_threshold, warning_threshold, reverse=False):
    """Get status class and indicator based on value"""
    if value is None or value == "N/A":
        return "warning", "⚠️"

    try:
        val = float(str(value).rstrip('x%'))
        if not reverse:
            if val >= good_threshold:
                return "good", "✅"
            elif val >= warning_threshold:
                return "warning", "⚠️"
            else:
                return "bad", "❌"
        else:
            if val <= good_threshold:
                return "good", "✅"
            elif val <= warning_threshold:
                return "warning", "⚠️"
            else:
                return "bad", "❌"
    except:
        return "warning", "⚠️"

def extract_template_data(json_data):
    """Extract and format data for template"""
    data = {}

    # Basic Info
    data['symbol'] = json_data.get('symbol', 'N/A')
    data['timestamp'] = datetime.fromisoformat(json_data['timestamp'].replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
    data['year'] = datetime.now().year

    # Recommendation
    recommendation = json_data.get('recommendation', {})
    data['recommendation'] = recommendation.get('recommendation', 'N/A')
    data['recommendation_emoji'] = recommendation.get('emoji', '')
    data['recommendation_class'] = get_recommendation_class(data['recommendation'])
    data['score'] = recommendation.get('score', 0)
    data['key_reasons'] = recommendation.get('reasons', [])[:8]

    # Company Snapshot - get from forensic._loaded_data and technical
    latest_statement = {}
    if 'forensic' in json_data and '_loaded_data' in json_data['forensic']:
        if len(json_data['forensic']['_loaded_data']) > 0:
            latest_statement = json_data['forensic']['_loaded_data'][0]

    technical = json_data.get('technical', {})

    # Market cap in lakhs, convert to crores
    market_cap_raw = latest_statement.get('market_cap', 0) or 0
    data['market_cap'] = format_number(market_cap_raw / 10000000, 0)

    data['current_price'] = format_number(technical.get('current_price', 0))

    # Revenue in lakhs, convert to crores
    revenue_raw = latest_statement.get('raw_revenue', 0) or 0
    data['revenue'] = format_number(revenue_raw / 10000000, 0)

    data['latest_fy'] = latest_statement.get('fy', 'N/A')

    # Growth Metrics - get from growth_metrics
    growth = json_data.get('growth_metrics', {})
    forensic_meta = json_data.get('forensic', {}).get('metadata', {})
    data['years'] = forensic_meta.get('data_years', 5)
    revenue_cagr = growth.get('revenue_cagr', 0)
    profit_cagr = growth.get('profit_cagr', 0)

    data['revenue_cagr'] = format_number(revenue_cagr, 1)
    data['profit_cagr'] = format_number(profit_cagr, 1)

    data['revenue_status'], data['revenue_indicator'] = get_status_indicator(revenue_cagr, 15, 10)
    data['profit_status'], data['profit_indicator'] = get_status_indicator(profit_cagr, 15, 10)

    # Valuation - get from latest_statement and intrinsic_value
    pe = latest_statement.get('pe', 0) or 0
    pb = latest_statement.get('pb', 0) or 0
    ps = latest_statement.get('ps', 0) or 0

    data['pe_ratio'] = format_number(pe, 2) + 'x'
    data['pb_ratio'] = format_number(pb, 2) + 'x'
    data['ps_ratio'] = format_number(ps, 2) + 'x'

    data['pe_status'], data['pe_indicator'] = get_status_indicator(pe, 25, 35, reverse=True)
    data['pb_status'], data['pb_indicator'] = get_status_indicator(pb, 3, 5, reverse=True)
    data['ps_status'], data['ps_indicator'] = get_status_indicator(ps, 5, 10, reverse=True)

    intrinsic = json_data.get('intrinsic_value', {})
    intrinsic_val = intrinsic.get('average_intrinsic', 0) or 0
    data['intrinsic_value'] = format_number(intrinsic_val)

    # Calculate margin of safety
    current_price = technical.get('current_price', 0) or 1
    if intrinsic_val > 0:
        mos = ((intrinsic_val - current_price) / current_price) * 100
    else:
        mos = 0

    data['margin_of_safety'] = format_number(mos, 1)
    data['mos_color'] = '#28a745' if mos > 0 else '#dc3545'

    # Determine valuation status
    if mos > 30:
        data['valuation_status'] = 'SIGNIFICANTLY UNDERVALUED'
        data['valuation_status_class'] = 'good'
    elif mos > 10:
        data['valuation_status'] = 'UNDERVALUED'
        data['valuation_status_class'] = 'good'
    elif mos > -10:
        data['valuation_status'] = 'FAIR'
        data['valuation_status_class'] = 'warning'
    elif mos > -30:
        data['valuation_status'] = 'OVERVALUED'
        data['valuation_status_class'] = 'bad'
    else:
        data['valuation_status'] = 'SIGNIFICANTLY OVERVALUED'
        data['valuation_status_class'] = 'bad'

    # Scenarios - get from scenario_analysis
    scenarios = json_data.get('scenario_analysis', {})
    base_target = scenarios.get('base_case', {}).get('target_price', 0) or 0

    # Check if scenario analysis has valid data (target_price > 0)
    if scenarios and base_target > 0:
        data['has_scenarios'] = True

        # Base case for executive summary
        base_return = scenarios.get('base_case', {}).get('return_pct', 0) or 0

        data['target_price'] = format_number(base_target)
        data['upside'] = format_number(base_return, 1)
        data['upside_label'] = 'Upside' if base_return > 0 else 'Downside'
        data['upside_color'] = '#28a745' if base_return > 0 else '#dc3545'

        # Bull/Base/Bear scenarios
        bull_target = scenarios.get('bull_case', {}).get('target_price', 0) or 0
        bull_return = scenarios.get('bull_case', {}).get('return_pct', 0) or 0

        data['bull_target'] = format_number(bull_target)
        data['bull_return'] = f"{bull_return:+.1f}%" if bull_return else "N/A"
        data['bull_scenario'] = f"Optimistic growth ({scenarios.get('bull_case', {}).get('growth_assumption', 0):.1f}% CAGR)"

        data['base_target'] = format_number(base_target)
        data['base_return'] = f"{base_return:+.1f}%" if base_return else "N/A"
        data['base_scenario'] = f"Expected growth ({scenarios.get('base_case', {}).get('growth_assumption', 0):.1f}% CAGR)"

        bear_target = scenarios.get('bear_case', {}).get('target_price', 0) or 0
        bear_return = scenarios.get('bear_case', {}).get('return_pct', 0) or 0

        data['bear_target'] = format_number(bear_target)
        data['bear_return'] = f"{bear_return:+.1f}%" if bear_return else "N/A"
        data['bear_scenario'] = f"Conservative growth ({scenarios.get('bear_case', {}).get('growth_assumption', 0):.1f}% CAGR)"

        data['weighted_target'] = format_number(scenarios.get('probability_weighted', 0))
    else:
        # Fallback to intrinsic value if scenarios are not available or invalid
        data['has_scenarios'] = False
        data['target_price'] = format_number(intrinsic_val)
        data['upside'] = format_number(mos, 1)
        data['upside_label'] = 'Potential Upside' if mos > 0 else 'Potential Downside'
        data['upside_color'] = '#28a745' if mos > 0 else '#dc3545'

    # Forensic Analysis
    forensic = json_data.get('forensic', {})

    # Beneish M-Score
    beneish = forensic.get('beneish_m_score', {})
    m_score = beneish.get('M_Score', 0)
    data['beneish_score'] = format_number(m_score, 2)
    risk = beneish.get('Risk_Category', 'Unknown').upper()
    data['beneish_risk'] = risk

    if risk == 'LOW':
        data['beneish_risk_class'] = 'low-risk'
        data['beneish_risk_label'] = 'low'
    elif risk == 'MEDIUM':
        data['beneish_risk_class'] = 'medium-risk'
        data['beneish_risk_label'] = 'medium'
    elif risk == 'HIGH':
        data['beneish_risk_class'] = 'high-risk'
        data['beneish_risk_label'] = 'high'
    else:
        data['beneish_risk_class'] = 'medium-risk'
        data['beneish_risk_label'] = 'medium'

    # Piotroski F-Score
    piotroski = forensic.get('piotroski_f_score', {})
    f_score = piotroski.get('F_Score', 0)
    data['piotroski_score'] = f_score
    data['piotroski_strength'] = piotroski.get('Strength_Category', 'Unknown')
    data['piotroski_percent'] = int((f_score / 9) * 100)

    if f_score >= 7:
        data['piotroski_risk_class'] = 'low-risk'
        data['piotroski_risk_label'] = 'low'
        data['piotroski_bar_class'] = 'good'
    elif f_score >= 4:
        data['piotroski_risk_class'] = 'medium-risk'
        data['piotroski_risk_label'] = 'medium'
        data['piotroski_bar_class'] = 'medium'
    else:
        data['piotroski_risk_class'] = 'high-risk'
        data['piotroski_risk_label'] = 'high'
        data['piotroski_bar_class'] = 'bad'

    # Piotroski F-Score Details
    piotroski_details = piotroski.get('Details', {})
    piotroski_items = []
    for key, detail in piotroski_details.items():
        score = detail.get('score', 0)
        description = detail.get('description', '')
        piotroski_items.append({
            'name': key.replace('_', ' ').title(),
            'score': score,
            'status': '✅' if score == 1 else '❌',
            'description': description
        })
    data['piotroski_details'] = piotroski_items

    # J-Score
    jscore_data = forensic.get('j_score', {})
    jscore = jscore_data.get('J_Score', 0)
    data['jscore'] = jscore
    data['jscore_flags'] = jscore_data.get('Total_Flags', 0)
    jscore_risk = jscore_data.get('Risk_Category', 'Unknown').upper()
    data['jscore_risk'] = jscore_risk

    if jscore <= 5:
        data['jscore_risk_class'] = 'low-risk'
        data['jscore_risk_label'] = 'low'
    elif jscore <= 10:
        data['jscore_risk_class'] = 'medium-risk'
        data['jscore_risk_label'] = 'medium'
    else:
        data['jscore_risk_class'] = 'high-risk'
        data['jscore_risk_label'] = 'high'

    # J-Score Flags
    flag_items = []
    for flag in jscore_data.get('Flags', []):
        severity = flag.get('severity', 'MEDIUM').upper()
        flag_items.append({
            'title': flag.get('type', flag.get('flag', '')),  # Try 'type' first, then 'flag'
            'period': flag.get('year', flag.get('period', '')),  # Try 'year' first, then 'period'
            'description': flag.get('description', flag.get('details', '')),  # Try 'description' first, then 'details'
            'severity_class': 'high' if severity == 'HIGH' else 'medium',
            'emoji': '🔴' if severity == 'HIGH' else '⚠️'
        })
    data['jscore_flag_items'] = flag_items

    # Altman Z-Score
    altman = forensic.get('altman_z_score', {})
    z_score = altman.get('Z_Score')
    if z_score is None or altman.get('Risk_Category') == 'N/A - Banking Company':
        data['altman_score'] = 'N/A'
        data['altman_risk'] = 'Not Applicable'
        data['altman_risk_class'] = 'medium-risk'
        data['altman_risk_label'] = 'medium'
    else:
        data['altman_score'] = format_number(z_score, 2)
        altman_risk = altman.get('Risk_Category', 'Unknown')
        data['altman_risk'] = altman_risk

        if 'Safe' in altman_risk:
            data['altman_risk_class'] = 'low-risk'
            data['altman_risk_label'] = 'low'
        elif 'Grey' in altman_risk:
            data['altman_risk_class'] = 'medium-risk'
            data['altman_risk_label'] = 'medium'
        else:
            data['altman_risk_class'] = 'high-risk'
            data['altman_risk_label'] = 'high'

    # Red Flags
    red_flags = forensic.get('red_flags', {})
    data['red_flags_count'] = red_flags.get('total_flags', 0)
    data['red_flags_high'] = red_flags.get('high_severity_count', 0)

    flag_items = []
    for flag in red_flags.get('flags', []):
        severity = flag.get('severity', 'MEDIUM').upper()
        flag_items.append({
            'description': flag.get('flag', ''),
            'severity_class': 'high' if severity == 'HIGH' else 'medium',
            'icon': '🔴' if severity == 'HIGH' else '⚠️'
        })
    data['red_flag_items'] = flag_items

    # Earnings Quality
    earnings = json_data.get('earnings_quality', {})
    cash_conv = earnings.get('cash_conversion', 0)
    data['cash_conversion'] = format_number(cash_conv, 0)
    data['cash_conversion_status'], data['cash_conversion_indicator'] = get_status_indicator(cash_conv, 100, 80)

    accruals = earnings.get('accruals_ratio', 0)
    data['accruals_ratio'] = format_number(abs(accruals), 1)
    data['accruals_status'], data['accruals_indicator'] = get_status_indicator(abs(accruals), 5, 10, reverse=True)

    quality_score = earnings.get('quality_score', 0)
    data['quality_score'] = quality_score
    data['quality_assessment'] = earnings.get('quality_assessment', 'N/A')
    data['quality_score_status'] = 'good' if quality_score >= 7 else 'warning' if quality_score >= 5 else 'bad'

    # Credit Quality
    credit = json_data.get('credit_quality', {})
    de = credit.get('debt_equity', 0)
    data['debt_equity'] = format_number(de, 2)
    data['debt_equity_status'], data['debt_equity_indicator'] = get_status_indicator(de, 0.5, 1.0, reverse=True)

    ic = credit.get('interest_coverage', 0)
    data['interest_coverage'] = format_number(ic, 1)
    data['interest_coverage_status'], data['interest_coverage_indicator'] = get_status_indicator(ic, 5, 3)

    credit_score = credit.get('credit_score', 0)
    data['credit_score'] = credit_score
    data['credit_assessment'] = credit.get('credit_assessment', 'N/A')
    data['credit_score_status'] = 'good' if credit_score >= 7 else 'warning' if credit_score >= 5 else 'bad'

    # Management Quality
    management = json_data.get('management_quality', {})
    mgmt_score = management.get('quality_score', 0)
    data['management_score'] = mgmt_score
    data['management_assessment'] = management.get('assessment', 'N/A')
    data['management_percent'] = int((mgmt_score / 10) * 100)
    data['management_bar_class'] = 'good' if mgmt_score >= 7 else 'medium' if mgmt_score >= 5 else 'bad'
    data['management_highlights'] = management.get('highlights', [])[:5]

    return data

def generate_pdf_report(json_file, output_pdf=None):
    """Generate PDF report from JSON data"""
    # Check for WeasyPrint
    has_weasyprint = False
    try:
        from weasyprint import HTML, CSS
        has_weasyprint = True
    except (ImportError, OSError) as e:
        if 'pango' in str(e).lower() or 'cairo' in str(e).lower():
            print("⚠️  WeasyPrint requires system libraries (Pango, Cairo)")
            print("   On macOS, install with: brew install pango cairo")
            print("   Falling back to HTML output only.")
        else:
            print("⚠️  WeasyPrint not available. Install with: pip install weasyprint")
            print("   Falling back to HTML output only.")

    try:
        # Load JSON data
        with open(json_file, 'r') as f:
            json_data = json.load(f)

        # Load template
        template_path = Path(__file__).parent / 'report_template.html'
        with open(template_path, 'r') as f:
            template_content = f.read()

        # Extract and format data
        template_data = extract_template_data(json_data)

        # Render template
        template = Template(template_content)
        html_content = template.render(**template_data)

        # Generate output filename
        if output_pdf is None:
            symbol = json_data.get('symbol', 'UNKNOWN')
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_pdf = f"investment_report_{symbol}_{timestamp}.pdf"

        # Generate HTML file
        html_file = output_pdf.replace('.pdf', '.html')
        with open(html_file, 'w') as f:
            f.write(html_content)
        print(f"✅ HTML report generated: {html_file}")

        # Generate PDF if WeasyPrint is available
        if has_weasyprint:
            try:
                from weasyprint import HTML, CSS
                HTML(string=html_content).write_pdf(output_pdf)
                print(f"✅ PDF report generated: {output_pdf}")
                return output_pdf
            except Exception as pdf_error:
                print(f"⚠️  PDF generation failed: {pdf_error}")
                print(f"ℹ️  HTML file is available. Open {html_file} in a browser and use Print to PDF")
                return html_file
        else:
            print(f"ℹ️  Open {html_file} in a browser and use Print to PDF")
            return html_file

    except Exception as e:
        print(f"❌ Error generating report: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python generate_pdf_report.py <json_file> [output_pdf]")
        print("Example: python generate_pdf_report.py enhanced_report_v2_HDFCBANK_20251029.json")
        sys.exit(1)

    json_file = sys.argv[1]
    output_pdf = sys.argv[2] if len(sys.argv) > 2 else None

    if not Path(json_file).exists():
        print(f"❌ JSON file not found: {json_file}")
        sys.exit(1)

    print(f"📄 Generating PDF report from: {json_file}")
    result = generate_pdf_report(json_file, output_pdf)

    if result:
        print(f"\n✅ Report generation complete!")
    else:
        print(f"\n❌ Report generation failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
