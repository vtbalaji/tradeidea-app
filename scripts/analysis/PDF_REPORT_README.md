# PDF Investment Report Generator

Generate professional PDF reports from your investment analysis JSON data.

## Overview

This tool converts the JSON output from `enhanced_company_report_v2.py` into beautiful, professional PDF reports suitable for presentations, client sharing, or archival.

## Features

- **Professional Layout**: Clean, institutional-grade design
- **Comprehensive Sections**:
  - Executive Summary
  - Forensic Analysis (Beneish M-Score, Piotroski F-Score, J-Score, Altman Z-Score)
  - Valuation Analysis
  - Scenario Analysis (Bull/Base/Bear cases)
  - Earnings Quality
  - Credit Quality
  - Management Quality
  - Red Flags Dashboard
- **Color-coded Indicators**: Visual status indicators for quick assessment
- **TradeIdea Branding**: Custom header with your company branding
- **System-generated Disclaimer**: Clear notice that this is automated analysis

## Installation

### 1. Install Python Dependencies

```bash
# From the project root
./venv/bin/pip install jinja2 weasyprint
```

### 2. Install System Libraries (Optional, for PDF generation)

**macOS:**
```bash
brew install pango cairo
```

**Ubuntu/Debian:**
```bash
sudo apt-get install libpango-1.0-0 libcairo2
```

**Note:** If system libraries aren't installed, the tool will generate HTML output instead, which you can convert to PDF using your browser's "Print to PDF" feature.

## Usage

### Method 1: Direct Script Usage

```bash
# Generate report from JSON file
./venv/bin/python3 scripts/analysis/generate_pdf_report.py enhanced_report_v2_HDFCBANK_20251029.json

# Specify custom output filename
./venv/bin/python3 scripts/analysis/generate_pdf_report.py input.json custom_report.pdf
```

### Method 2: Combined Analysis + PDF Generation

```bash
# Generate analysis JSON and convert to PDF
./venv/bin/python3 scripts/analysis/enhanced_company_report_v2.py HDFCBANK --output json

# Then generate PDF from the JSON
./venv/bin/python3 scripts/analysis/generate_pdf_report.py enhanced_report_v2_HDFCBANK_*.json
```

### Method 3: One-liner

```bash
# Generate both JSON and PDF in one command
./venv/bin/python3 scripts/analysis/enhanced_company_report_v2.py TCS --output json && \
./venv/bin/python3 scripts/analysis/generate_pdf_report.py enhanced_report_v2_TCS_*.json
```

## Output

The script generates:

1. **HTML File**: `investment_report_{SYMBOL}_{TIMESTAMP}.html`
   - Always generated
   - Can be opened in any browser
   - Can be converted to PDF via browser's Print function

2. **PDF File**: `investment_report_{SYMBOL}_{TIMESTAMP}.pdf` (if WeasyPrint is fully configured)
   - Professional, print-ready format
   - Optimized for A4 paper size
   - Includes page numbers and footers

## Template Customization

The report template is located at `scripts/analysis/report_template.html`. You can customize:

- **Colors**: Modify the CSS color scheme in the `<style>` section
- **Logo**: Add your company logo in the header section
- **Branding**: Update "TradeIdea" to your company name
- **Layout**: Adjust grid layouts, card designs, and spacing
- **Sections**: Add or remove analysis sections as needed

### Color Scheme

Current colors:
- **Header**: Blue gradient (`#1e3c72` to `#2a5298`)
- **Strong Buy**: Green (`#28a745`)
- **Buy**: Light Green (`#5cb85c`)
- **Hold**: Yellow (`#ffc107`)
- **Sell**: Red (`#dc3545`)
- **Strong Sell**: Dark Red (`#c82333`)

## Examples

### Basic Usage

```bash
# Analyze HDFCBANK and generate PDF
./venv/bin/python3 scripts/analysis/enhanced_company_report_v2.py HDFCBANK --output json
./venv/bin/python3 scripts/analysis/generate_pdf_report.py enhanced_report_v2_HDFCBANK_*.json
```

### Batch Processing

```bash
# Generate reports for multiple companies
for symbol in HDFCBANK TCS INFY RELIANCE; do
    echo "Processing $symbol..."
    ./venv/bin/python3 scripts/analysis/enhanced_company_report_v2.py $symbol --output json
    ./venv/bin/python3 scripts/analysis/generate_pdf_report.py enhanced_report_v2_${symbol}_*.json
done
```

## Troubleshooting

### Issue: WeasyPrint errors about missing libraries

**Solution**:
- On macOS: `brew install pango cairo`
- On Linux: `sudo apt-get install libpango-1.0-0 libcairo2`
- Alternatively, use the generated HTML file and convert via browser

### Issue: Template rendering errors

**Solution**:
- Ensure JSON file is valid
- Check that all required fields are present in the JSON
- The script handles missing data gracefully with "N/A" placeholders

### Issue: Styling looks wrong in PDF

**Solution**:
- Check that CSS is properly embedded in the template
- Some advanced CSS features may not render in PDF; test in browser first
- Consider using simpler layouts for PDF compatibility

## Converting HTML to PDF Manually

If WeasyPrint doesn't work, use browser's Print to PDF:

1. Open the generated HTML file in Chrome/Firefox
2. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows)
3. Select "Save as PDF" as the destination
4. Adjust settings:
   - Layout: Portrait
   - Paper size: A4
   - Margins: Default
   - Background graphics: On
5. Click "Save"

## Advanced Customization

### Adding Charts/Graphs

To add charts to the PDF report:

1. Generate chart images using matplotlib/plotly in `enhanced_company_report_v2.py`
2. Embed base64-encoded images in JSON
3. Update template to display images:

```html
<img src="data:image/png;base64,{{ chart_base64 }}" alt="Chart" />
```

### Multi-page Reports

The template includes `page-break-after: always` CSS class for page breaks:

```html
<div class="page-break"></div>
```

Add this between sections to control pagination.

## Files

- `report_template.html` - HTML/CSS template
- `generate_pdf_report.py` - PDF generation script
- `enhanced_company_report_v2.py` - Analysis script (generates JSON)

## Support

For issues or questions:
1. Check this README
2. Review the WeasyPrint documentation: https://weasyprint.org/
3. Examine the template HTML for customization guidance

## License

Copyright © 2025 TradeIdea. All rights reserved.
