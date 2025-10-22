#!/usr/bin/env -S venv/bin/python3
"""
NSE Financial Results Fetcher

Scrapes and downloads quarterly and annual financial results from NSE India website.
Downloads both standalone and consolidated financial statements in XBRL/PDF format.

Usage:
    # Single symbol
    python3 scripts/fetch_nse_financial_results.py TCS

    # Multiple symbols
    python3 scripts/fetch_nse_financial_results.py TCS RELIANCE INFY

    # From file (one symbol per line)
    python3 scripts/fetch_nse_financial_results.py --file symbols.txt

    # Limit number of results per symbol
    python3 scripts/fetch_nse_financial_results.py TCS --limit 4

Files are saved to: xbrl/SYMBOL_type_quarter_year.xml
Example: xbrl/TCS_standalone_sep_2024.xml
"""

import requests
import json
import os
import sys
import time
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print('⚠️  Selenium not available. Install with: pip install selenium')
    print('⚠️  Also install Chrome/Chromium browser and chromedriver')


class NSEFinancialResultsFetcher:
    """Fetch financial results from NSE India website"""

    BASE_URL = 'https://www.nseindia.com'

    # NSE requires proper headers to avoid being blocked
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    }

    def __init__(self, output_dir='xbrl'):
        """Initialize fetcher with output directory"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Create session for cookie persistence
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)

        # Initialize cookies by visiting homepage
        self._init_session()

    def _init_session(self):
        """Initialize session by visiting NSE homepage to get cookies"""
        try:
            print('🔄 Initializing NSE session...')
            response = self.session.get(self.BASE_URL, timeout=10)
            if response.status_code == 200:
                print('✅ Session initialized')
                time.sleep(1)  # Small delay to be respectful
                return True
            else:
                print(f'⚠️  Session init returned status {response.status_code}')
                return False
        except Exception as e:
            print(f'⚠️  Session initialization warning: {str(e)}')
            return False

    def _make_request(self, url, retries=3):
        """Make HTTP request with retries"""
        for attempt in range(retries):
            try:
                response = self.session.get(url, timeout=15)

                if response.status_code == 200:
                    return response
                elif response.status_code == 401:
                    print(f'  ⚠️  Unauthorized (401) - reinitializing session...')
                    self._init_session()
                    time.sleep(2)
                else:
                    print(f'  ⚠️  Request returned status {response.status_code}')

            except Exception as e:
                print(f'  ⚠️  Attempt {attempt + 1} failed: {str(e)}')

            if attempt < retries - 1:
                wait_time = (attempt + 1) * 2
                print(f'  🔄 Retrying in {wait_time}s...')
                time.sleep(wait_time)

        return None

    def get_financial_results(self, symbol):
        """
        Fetch financial results metadata for a symbol using NSE API

        Args:
            symbol: Stock symbol (e.g., 'TCS', 'RELIANCE')

        Returns:
            List of financial result records or None
        """
        # NSE API endpoint for integrated filing financials
        api_url = f'{self.BASE_URL}/api/corp-info?symbol={symbol}&corpType=integratedFilingFinancialsWeb&market=equities'

        print(f'\n📥 Fetching financial results for {symbol} via API...')
        print(f'   URL: {api_url}')

        response = self._make_request(api_url)

        if not response:
            print(f'❌ Failed to fetch data for {symbol}')
            return None

        try:
            data = response.json()

            # The API returns an array of filing records
            if not data or not isinstance(data, list):
                print(f'⚠️  No financial results found for {symbol}')
                return []

            print(f'✅ Found {len(data)} financial result records')

            # Each record has:
            # - gfrsymbol: Symbol
            # - gfrQuaterEnded: Quarter end date (e.g., "30 Sep 2025")
            # - gfrAuditedUnaudited: "Audited" or "Unaudited"
            # - gfrConsolidated: "Consolidated" or "Standalone"
            # - gfrXbrlFname: Download URL
            # - gfSystym: Filing date/time

            results = []
            for record in data:
                xbrl_url = record.get('gfrXbrlFname')
                if xbrl_url and xbrl_url.startswith('http'):
                    results.append({
                        'url': xbrl_url,
                        'quarter': record.get('gfrQuaterEnded', ''),
                        'type': record.get('gfrConsolidated', '').lower(),
                        'audited': record.get('gfrAuditedUnaudited', ''),
                        'filing_date': record.get('gfSystym', ''),
                        'description': f"{record.get('gfrQuaterEnded', '')} - {record.get('gfrConsolidated', '')} - {record.get('gfrAuditedUnaudited', '')}"
                    })

            return results

        except json.JSONDecodeError:
            print(f'❌ Failed to parse JSON response')
            return None
        except Exception as e:
            print(f'❌ Error processing response: {str(e)}')
            return None

    def download_file(self, url, output_path):
        """
        Download file from URL to output path

        Args:
            url: URL to download from
            output_path: Path to save file to

        Returns:
            True if successful, False otherwise
        """
        try:
            # Make URL absolute if needed
            if not url.startswith('http'):
                url = urljoin(self.BASE_URL, url)

            response = self._make_request(url)

            if not response:
                return False

            # Save file
            with open(output_path, 'wb') as f:
                f.write(response.content)

            file_size = os.path.getsize(output_path)
            print(f'  ✅ Downloaded: {output_path.name} ({file_size:,} bytes)')
            return True

        except Exception as e:
            print(f'  ❌ Download failed: {str(e)}')
            return False

    def parse_quarter_year(self, result_description):
        """
        Parse quarter and year from result description

        Examples:
            "Results for Sep 2024" -> (9, 2024, "sep")
            "Q2 FY2025" -> (6, 2025, "jun")  # Q2 ends in Sep, so start is Jun
            "Financial Results for the quarter ended September 30, 2024" -> (9, 2024, "sep")

        Returns:
            (month, year, month_name) or (None, None, None)
        """
        # Month name mapping
        months = {
            'jan': 1, 'january': 1,
            'feb': 2, 'february': 2,
            'mar': 3, 'march': 3,
            'apr': 4, 'april': 4,
            'may': 5,
            'jun': 6, 'june': 6,
            'jul': 7, 'july': 7,
            'aug': 8, 'august': 8,
            'sep': 9, 'september': 9, 'sept': 9,
            'oct': 10, 'october': 10,
            'nov': 11, 'november': 11,
            'dec': 12, 'december': 12,
        }

        text = result_description.lower()

        # Pattern 1: "sep 2024", "september 2024"
        pattern1 = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+(\d{4})'
        match = re.search(pattern1, text)
        if match:
            month_name = match.group(1)
            year = int(match.group(2))
            month = months[month_name]
            return (month, year, list(months.keys())[month - 1][:3])

        # Pattern 2: "30, 2024" or "30 2024" (day and year without month)
        # Look for month before this
        pattern2 = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+\d{1,2},?\s+(\d{4})'
        match = re.search(pattern2, text)
        if match:
            month_name = match.group(1)
            year = int(match.group(2))
            month = months[month_name]
            return (month, year, list(months.keys())[month - 1][:3])

        # Pattern 3: Quarter notation "Q1 FY2025" (map quarters to months)
        # Q1 = Jun, Q2 = Sep, Q3 = Dec, Q4 = Mar
        pattern3 = r'q([1-4])\s+fy\s*(\d{4})'
        match = re.search(pattern3, text)
        if match:
            quarter = int(match.group(1))
            fy_year = int(match.group(2))

            # Map quarter to ending month
            quarter_months = {1: 6, 2: 9, 3: 12, 4: 3}
            month = quarter_months[quarter]

            # Adjust year for Q4 (March is in previous calendar year)
            if quarter == 4:
                year = fy_year - 1
            else:
                year = fy_year - 1  # FY2025 Q1 ends in Jun 2024

            month_name = list(months.keys())[(month - 1) * 2][:3]  # Get short name
            return (month, year, month_name)

        return (None, None, None)

    def generate_filename(self, symbol, result_type, result_description):
        """
        Generate standardized filename

        Format: SYMBOL_type_month_year.ext
        Example: TCS_standalone_sep_2024.pdf

        Args:
            symbol: Stock symbol
            result_type: 'standalone' or 'consolidated'
            result_description: Description text from NSE

        Returns:
            Filename string
        """
        month, year, month_name = self.parse_quarter_year(result_description)

        if month and year:
            # Standard format
            return f'{symbol}_{result_type}_{month_name}_{year}'
        else:
            # Fallback: use sanitized description
            safe_desc = re.sub(r'[^a-zA-Z0-9]+', '_', result_description.lower())
            safe_desc = safe_desc[:50]  # Limit length
            return f'{symbol}_{result_type}_{safe_desc}'

    def fetch_symbol_results_selenium(self, symbol, limit=None):
        """
        Fetch financial results using Selenium with API endpoint

        Args:
            symbol: Stock symbol
            limit: Maximum number of results to download (None for all)

        Returns:
            Number of files downloaded
        """
        if not SELENIUM_AVAILABLE:
            print('❌ Selenium is required')
            print('   Install with: pip install selenium')
            return 0

        print(f'\n🌐 Using Selenium to fetch API data for {symbol}...')

        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')  # Run in background
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

        # Set Chrome binary location for macOS
        chrome_path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        if os.path.exists(chrome_path):
            chrome_options.binary_location = chrome_path

        try:
            # Create driver
            from selenium.webdriver.chrome.service import Service
            from selenium.webdriver.chrome.service import Service as ChromeService

            try:
                driver = webdriver.Chrome(options=chrome_options)
            except Exception as e1:
                print(f'   ⚠️  System chromedriver failed: {str(e1)[:80]}')
                try:
                    from webdriver_manager.chrome import ChromeDriverManager
                    service = ChromeService(ChromeDriverManager().install())
                    driver = webdriver.Chrome(service=service, options=chrome_options)
                except ImportError:
                    print('   💡 Install: pip install webdriver-manager')
                    raise e1

            driver.set_page_load_timeout(30)

            # Step 1: Visit equity quote page to establish cookies (REQUIRED!)
            equity_url = f'https://www.nseindia.com/get-quotes/equity?symbol={symbol}'
            print(f'   Visiting equity page to set cookies: {equity_url[:60]}...')
            driver.get(equity_url)
            time.sleep(3)  # Wait for cookies to be set

            # Step 2: Navigate to API endpoint (cookies are now established)
            api_url = f'https://www.nseindia.com/api/corp-info?symbol={symbol}&corpType=integratedFilingFinancialsWeb&market=equities'
            print(f'   Fetching API data: {api_url[:80]}...')
            driver.get(api_url)

            # Wait for JSON to load
            time.sleep(3)

            # Get JSON response from page
            try:
                # Get page body text
                try:
                    body = driver.find_element(By.TAG_NAME, 'body')
                    page_text = body.text.strip()

                    # Debug: show what we got
                    print(f'   Page text length: {len(page_text)} characters')
                    if len(page_text) < 500:
                        print(f'   Page content: {page_text[:200]}...')

                    # If it looks like JSON array, parse it
                    if page_text.startswith('['):
                        data = json.loads(page_text)
                    else:
                        # Try to extract JSON from page
                        import re
                        json_match = re.search(r'(\[{.*?}\])', page_text, re.DOTALL)
                        if json_match:
                            data = json.loads(json_match.group(1))
                        else:
                            # Check if page is error message
                            if 'unauthorized' in page_text.lower() or 'access denied' in page_text.lower():
                                raise Exception("API access denied - NSE may be blocking automated access")
                            else:
                                raise Exception(f"Could not find JSON in page. Got: {page_text[:100]}")
                except Exception as parse_error:
                    print(f'   Parse error: {str(parse_error)}')
                    # Save page source for debugging
                    page_source = driver.page_source[:1000]
                    print(f'   Page source sample: {page_source}...')
                    raise

                if not data or not isinstance(data, list):
                    print(f'   ⚠️  No financial results found for {symbol}')
                    driver.quit()
                    return 0

                print(f'   ✅ Found {len(data)} financial result records')

                results = []
                for record in data:
                    xbrl_url = record.get('gfrXbrlFname')
                    if xbrl_url and xbrl_url.startswith('http'):
                        results.append({
                            'url': xbrl_url,
                            'quarter': record.get('gfrQuaterEnded', ''),
                            'type': record.get('gfrConsolidated', '').lower(),
                            'audited': record.get('gfrAuditedUnaudited', ''),
                            'description': f"{record.get('gfrQuaterEnded', '')} - {record.get('gfrConsolidated', '')} - {record.get('gfrAuditedUnaudited', '')}"
                        })

                # Limit results
                if limit:
                    results = results[:limit]

                driver.quit()

                # Download files
                downloaded = 0

                for i, result in enumerate(results):
                    print(f'\n[{i+1}/{len(results)}] Processing result...')
                    print(f'  📄 {result["description"]}')

                    # Determine type
                    result_type = result.get('type', '').lower()
                    if 'standalone' in result_type:
                        type_str = 'standalone'
                    elif 'consolidated' in result_type:
                        type_str = 'consolidated'
                    else:
                        type_str = 'combined'

                    # Parse quarter for filename
                    quarter_str = result.get('quarter', '')
                    month, year, month_abbr = self.parse_quarter_year(quarter_str)

                    if month_abbr and year:
                        filename = f'{symbol}_{type_str}_{month_abbr}_{year}.xml'
                    else:
                        filename = f'{symbol}_{type_str}_{i+1}.xml'

                    output_path = self.output_dir / filename

                    if output_path.exists():
                        print(f'  ⏭️  Already exists: {filename}')
                        continue

                    print(f'  📥 Downloading: {filename}')

                    if self.download_file(result['url'], output_path):
                        downloaded += 1
                        print(f'  ✅ Saved: {filename}')
                    else:
                        print(f'  ❌ Download failed')

                    time.sleep(0.5)

                return downloaded

            except json.JSONDecodeError as je:
                print(f'   ❌ Failed to parse JSON: {str(je)}')
                driver.quit()
                return 0
            except Exception as e:
                print(f'   ❌ Error extracting data: {str(e)}')
                driver.quit()
                return 0

        except Exception as e:
            print(f'❌ Selenium error: {str(e)}')
            if 'driver' in locals():
                driver.quit()
            return 0

    def fetch_symbol_results(self, symbol, limit=None, use_selenium=False):
        """
        Fetch and download all financial results for a symbol

        Args:
            symbol: Stock symbol
            limit: Maximum number of results to download (None for all)
            use_selenium: Force use of Selenium (not needed with API)

        Returns:
            Number of files downloaded
        """
        # Always use Selenium with API endpoint (most reliable)
        return self.fetch_symbol_results_selenium(symbol, limit)

    def close(self):
        """Close session"""
        self.session.close()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Fetch financial results from NSE India',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Download results for single symbol
    python3 scripts/fetch_nse_financial_results.py TCS

    # Download for multiple symbols
    python3 scripts/fetch_nse_financial_results.py TCS RELIANCE INFY

    # Limit to 4 most recent results per symbol
    python3 scripts/fetch_nse_financial_results.py TCS --limit 4

    # Read symbols from file
    python3 scripts/fetch_nse_financial_results.py --file symbols.txt
        """
    )

    parser.add_argument('symbols', nargs='*', help='Stock symbols (e.g., TCS RELIANCE)')
    parser.add_argument('--file', dest='symbols_file', help='File containing symbols (one per line)')
    parser.add_argument('--limit', type=int, help='Limit number of results per symbol')
    parser.add_argument('--output', default='xbrl', help='Output directory (default: xbrl)')
    parser.add_argument('--selenium', action='store_true', help='Force use of Selenium web scraping (requires selenium package and Chrome)')

    args = parser.parse_args()

    # Collect symbols
    symbols = []

    if args.symbols:
        symbols.extend([s.upper() for s in args.symbols])

    if args.symbols_file:
        if not os.path.exists(args.symbols_file):
            print(f'❌ Symbols file not found: {args.symbols_file}')
            sys.exit(1)

        with open(args.symbols_file, 'r') as f:
            file_symbols = [line.strip().upper() for line in f if line.strip() and not line.startswith('#')]
            symbols.extend(file_symbols)

    if not symbols:
        parser.print_help()
        sys.exit(1)

    # Remove duplicates while preserving order
    symbols = list(dict.fromkeys(symbols))

    print('🚀 NSE Financial Results Fetcher')
    print('=' * 70)
    print(f'Symbols: {", ".join(symbols)}')
    print(f'Output directory: {args.output}')
    if args.limit:
        print(f'Limit: {args.limit} results per symbol')
    print('=' * 70)

    # Create fetcher
    fetcher = NSEFinancialResultsFetcher(output_dir=args.output)

    # Process each symbol
    total_downloaded = 0
    start_time = time.time()

    for i, symbol in enumerate(symbols):
        print(f'\n{"="*70}')
        print(f'[{i+1}/{len(symbols)}] Processing {symbol}')
        print(f'{"="*70}')

        try:
            count = fetcher.fetch_symbol_results(symbol, limit=args.limit, use_selenium=args.selenium)
            total_downloaded += count
            print(f'\n✅ Downloaded {count} files for {symbol}')
        except Exception as e:
            print(f'\n❌ Error processing {symbol}: {str(e)}')

        # Delay between symbols to be respectful
        if i < len(symbols) - 1:
            time.sleep(2)

    duration = time.time() - start_time

    # Summary
    print(f'\n{"="*70}')
    print(f'📊 Summary')
    print(f'{"="*70}')
    print(f'Symbols processed: {len(symbols)}')
    print(f'Files downloaded: {total_downloaded}')
    print(f'Output directory: {os.path.abspath(args.output)}')
    print(f'Duration: {duration:.1f}s')
    print(f'{"="*70}')

    fetcher.close()

    print('\n✅ Done!')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
