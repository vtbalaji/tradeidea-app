#!/usr/bin/env -S venv/bin/python3
"""
NSE Financial Results Fetcher

Scrapes and downloads quarterly and annual financial results from NSE India website.
Downloads both standalone and consolidated financial statements in XBRL/PDF format.

By default, only downloads data from the last 7 years to reduce download size.

Usage:
    # Single symbol (default: last 7 years)
    python3 scripts/fetch_nse_financial_results.py TCS

    # Multiple symbols
    python3 scripts/fetch_nse_financial_results.py TCS RELIANCE INFY

    # Top 250 symbols by market cap
    python3 scripts/fetch_nse_financial_results.py --top250

    # Top N symbols by market cap
    python3 scripts/fetch_nse_financial_results.py --top 100

    # From file (one symbol per line)
    python3 scripts/fetch_nse_financial_results.py --file symbols.txt

    # Download ALL historical data (no year limit)
    python3 scripts/fetch_nse_financial_results.py TCS --years 0

    # Limit to last 10 years
    python3 scripts/fetch_nse_financial_results.py TCS --years 10

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

# Add scripts directory to path for cross-folder imports
current_dir = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.dirname(current_dir)
if scripts_dir not in sys.path:
    sys.path.insert(0, scripts_dir)

from fundamental.fundamental_xbrl_storage import XBRLStorage

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

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

    def __init__(self, output_dir='xbrl', enable_tracking=True, years_limit=None):
        """Initialize fetcher with output directory"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Create session for cookie persistence
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)

        # Initialize DuckDB storage for download tracking
        self.enable_tracking = enable_tracking
        self.storage = XBRLStorage() if enable_tracking else None

        # Set years limit (e.g., 7 means only download data from last 7 years)
        self.years_limit = years_limit

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

    def quarter_to_fy_and_q(self, month, year):
        """
        Convert month and year to Financial Year and Quarter
        Indian FY runs April-March

        Args:
            month: Month number (1-12)
            year: Year (e.g., 2024)

        Returns:
            (fy, quarter) - e.g., ('FY2025', 'Q2')
        """
        # Determine FY (ends in March)
        if month <= 3:
            fy_year = year
        else:
            fy_year = year + 1

        fy = f'FY{fy_year}'

        # Determine Quarter
        if month == 6:
            quarter = 'Q1'
        elif month == 9:
            quarter = 'Q2'
        elif month == 12:
            quarter = 'Q3'
        elif month == 3:
            quarter = 'Q4'
        else:
            # Best guess based on month
            quarter = f'Q{(month - 1) // 3 + 1}'

        return (fy, quarter)

    def is_within_years_limit(self, month, year):
        """
        Check if a date (month, year) is within the years_limit

        Args:
            month: Month number (1-12)
            year: Year (e.g., 2024)

        Returns:
            True if within limit or no limit set, False otherwise
        """
        if not self.years_limit:
            return True

        from datetime import datetime
        current_year = datetime.now().year
        cutoff_year = current_year - self.years_limit

        # If the year is after cutoff, include it
        if year > cutoff_year:
            return True

        # If same year as cutoff, always include (conservative approach)
        if year == cutoff_year:
            return True

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
                filtered_by_date = 0
                for record in data:
                    xbrl_url = record.get('gfrXbrlFname')
                    if xbrl_url and xbrl_url.startswith('http'):
                        quarter_str = record.get('gfrQuaterEnded', '')

                        # Apply years filter if set
                        if self.years_limit:
                            month, year, _ = self.parse_quarter_year(quarter_str)
                            if month and year:
                                if not self.is_within_years_limit(month, year):
                                    filtered_by_date += 1
                                    continue

                        results.append({
                            'url': xbrl_url,
                            'quarter': quarter_str,
                            'type': record.get('gfrConsolidated', '').lower(),
                            'audited': record.get('gfrAuditedUnaudited', ''),
                            'description': f"{record.get('gfrQuaterEnded', '')} - {record.get('gfrConsolidated', '')} - {record.get('gfrAuditedUnaudited', '')}"
                        })

                if filtered_by_date > 0:
                    print(f'   📅 Filtered out {filtered_by_date} results older than {self.years_limit} years')

                # Limit results
                if limit:
                    results = results[:limit]

                driver.quit()

                # Download files
                downloaded = 0
                skipped = 0

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
                        # Determine FY and Quarter for tracking
                        fy, quarter = self.quarter_to_fy_and_q(month, year)
                    else:
                        filename = f'{symbol}_{type_str}_{i+1}.xml'
                        fy, quarter = None, None

                    output_path = self.output_dir / filename

                    # Check if already downloaded in database
                    if self.storage and fy and quarter:
                        already_downloaded, existing_file = self.storage.is_already_downloaded(
                            symbol, fy, quarter, type_str
                        )
                        if already_downloaded:
                            print(f'  ⏭️  Already downloaded in DB: {existing_file}')
                            skipped += 1
                            continue

                    # Check if file exists on disk
                    if output_path.exists():
                        print(f'  ⏭️  File already exists: {filename}')
                        # Track in DB if not already tracked
                        if self.storage and fy and quarter:
                            file_size = os.path.getsize(output_path)
                            self.storage.track_download(
                                symbol, fy, quarter, type_str,
                                result['url'], str(output_path), filename, file_size
                            )
                        skipped += 1
                        continue

                    print(f'  📥 Downloading: {filename}')

                    if self.download_file(result['url'], output_path):
                        downloaded += 1
                        file_size = os.path.getsize(output_path)
                        print(f'  ✅ Saved: {filename} ({file_size:,} bytes)')

                        # Track download in database
                        if self.storage and fy and quarter:
                            self.storage.track_download(
                                symbol, fy, quarter, type_str,
                                result['url'], str(output_path), filename, file_size
                            )
                            print(f'  📝 Tracked in DB: {fy} {quarter}')
                    else:
                        print(f'  ❌ Download failed')

                    time.sleep(0.5)

                print(f'\n📊 Downloaded: {downloaded}, Skipped: {skipped}')
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

    def fetch_symbol_results_webpage(self, symbol, limit=None):
        """
        Fetch financial results from NSE download_xbrl API (used by webpage)
        Uses Selenium to intercept network calls and extract download URLs

        This source may have different/additional historical data compared to corp-info API.

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

        print(f'\n🌐 Using webpage download API for {symbol}...')
        print(f'   Source: NSE download_xbrl API (via browser inspection)')

        # Setup Chrome options with network logging
        chrome_options = Options()
        chrome_options.add_argument('--headless=new')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')

        # Enable performance logging to capture network requests
        chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})

        chrome_path = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        if os.path.exists(chrome_path):
            chrome_options.binary_location = chrome_path

        try:
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

            # Step 2: Navigate to financial results page
            page_url = f'https://www.nseindia.com/companies-listing/corporate-filings-financial-results?symbol={symbol}&tabIndex=equity'
            print(f'   Loading financial results page: {page_url[:60]}...')
            driver.get(page_url)
            time.sleep(10)  # Wait for table to load with financial data

            # Extract XBRL download links from table
            print(f'   Extracting XBRL download links from table...')

            xbrl_downloads = []

            # Find all links to nsearchives.nseindia.com (direct XBRL file URLs)
            all_links = driver.find_elements(By.TAG_NAME, 'a')

            for link in all_links:
                href = link.get_attribute('href') or ''

                # Look for direct nsearchives XBRL links
                if 'nsearchives.nseindia.com/corporate/xbrl/' in href:
                    # Get the row data for metadata
                    try:
                        parent_row = link.find_element(By.XPATH, './ancestor::tr')
                        cells = parent_row.find_elements(By.TAG_NAME, 'td')

                        if len(cells) >= 7:  # Typical financial results row
                            # Extract metadata from table cells
                            company = cells[0].text.strip()
                            audited = cells[1].text.strip()
                            cumulative = cells[2].text.strip()
                            consolidated = cells[3].text.strip()  # Consolidated/Non-Consolidated
                            indas = cells[4].text.strip()
                            period_type = cells[5].text.strip() if len(cells) > 5 else ''
                            date = cells[6].text.strip() if len(cells) > 6 else ''

                            # Build description for parsing
                            row_text = f"{consolidated} - {period_type} - {date}"

                            xbrl_downloads.append({
                                'actual_file_url': href,
                                'row_text': row_text,
                                'type': consolidated,
                                'audited': audited,
                                'date': date,
                                'period': period_type
                            })
                    except Exception as e:
                        # Fallback: use link without metadata
                        xbrl_downloads.append({
                            'actual_file_url': href,
                            'row_text': '',
                            'type': '',
                            'audited': '',
                            'date': '',
                            'period': ''
                        })

            driver.quit()

            if not xbrl_downloads:
                print(f'   ⚠️  No XBRL download URLs found')
                return 0

            print(f'   ✅ Found {len(xbrl_downloads)} XBRL files')

            # Apply years filter if set
            if self.years_limit:
                filtered_downloads = []
                filtered_by_date = 0
                for download_info in xbrl_downloads:
                    row_text = download_info.get('row_text', '')
                    original_filename = os.path.basename(download_info['actual_file_url'])
                    combined_text = row_text if row_text else original_filename

                    month, year, _ = self.parse_quarter_year(combined_text)
                    if month and year:
                        if self.is_within_years_limit(month, year):
                            filtered_downloads.append(download_info)
                        else:
                            filtered_by_date += 1
                    else:
                        # Can't parse date, include it to be safe
                        filtered_downloads.append(download_info)

                xbrl_downloads = filtered_downloads
                if filtered_by_date > 0:
                    print(f'   📅 Filtered out {filtered_by_date} results older than {self.years_limit} years')
                    print(f'   ✅ {len(xbrl_downloads)} files remain after filtering')

            # Limit results
            if limit:
                xbrl_downloads = xbrl_downloads[:limit]

            # Download files
            downloaded = 0
            skipped = 0

            for i, download_info in enumerate(xbrl_downloads):
                print(f'\n[{i+1}/{len(xbrl_downloads)}] Processing XBRL file...')

                # Use the actual file URL (from nsearchives.nseindia.com)
                actual_url = download_info['actual_file_url']
                row_text = download_info.get('row_text', '')

                # Extract filename from URL
                from urllib.parse import urlparse
                url_path = urlparse(actual_url).path
                original_filename = os.path.basename(url_path)

                print(f'  📄 {row_text[:100] if row_text else original_filename}')
                print(f'  🔗 {actual_url[:80]}...')

                # Parse metadata from row text or filename
                month, year, month_abbr = self.parse_quarter_year(row_text if row_text else original_filename)

                # Determine type from row text or filename
                combined_text = (row_text + ' ' + original_filename).lower()
                if 'standalone' in combined_text or 'sa_' in combined_text:
                    type_str = 'standalone'
                elif 'consolidated' in combined_text or 'ca_' in combined_text:
                    type_str = 'consolidated'
                else:
                    type_str = 'combined'

                if month_abbr and year:
                    filename = f'{symbol}_{type_str}_{month_abbr}_{year}.xml'
                    fy, quarter = self.quarter_to_fy_and_q(month, year)
                else:
                    # Use original filename with symbol prefix
                    filename = f'{symbol}_{type_str}_{original_filename}'
                    fy, quarter = None, None

                output_path = self.output_dir / filename

                # Check if already downloaded in database
                if self.storage and fy and quarter:
                    already_downloaded, existing_file = self.storage.is_already_downloaded(
                        symbol, fy, quarter, type_str
                    )
                    if already_downloaded:
                        print(f'  ⏭️  Already downloaded in DB: {existing_file}')
                        skipped += 1
                        continue

                # Check if file exists on disk
                if output_path.exists():
                    print(f'  ⏭️  File already exists: {filename}')
                    if self.storage and fy and quarter:
                        file_size = os.path.getsize(output_path)
                        self.storage.track_download(
                            symbol, fy, quarter, type_str,
                            actual_url, str(output_path), filename, file_size
                        )
                    skipped += 1
                    continue

                print(f'  📥 Downloading: {filename}')

                # Download from actual file URL
                if self.download_file(actual_url, output_path):
                    downloaded += 1
                    file_size = os.path.getsize(output_path)
                    print(f'  ✅ Saved: {filename} ({file_size:,} bytes)')

                    if self.storage and fy and quarter:
                        self.storage.track_download(
                            symbol, fy, quarter, type_str,
                            actual_url, str(output_path), filename, file_size
                        )
                        print(f'  📝 Tracked in DB: {fy} {quarter}')
                else:
                    print(f'  ❌ Download failed')

                time.sleep(0.5)

            print(f'\n📊 Downloaded: {downloaded}, Skipped: {skipped}')
            return downloaded

        except Exception as e:
            print(f'❌ Webpage API error: {str(e)}')
            import traceback
            traceback.print_exc()
            if 'driver' in locals():
                driver.quit()
            return 0

    def fetch_symbol_results(self, symbol, limit=None, use_selenium=False, source='api'):
        """
        Fetch and download all financial results for a symbol

        Args:
            symbol: Stock symbol
            limit: Maximum number of results to download (None for all)
            use_selenium: Force use of Selenium (not needed with API)
            source: Data source - 'api', 'webpage', or 'both' (default: 'api')

        Returns:
            Number of files downloaded
        """
        if source == 'both':
            print(f'\n📥 Fetching from BOTH sources for {symbol}')
            print(f'{"="*70}')

            # Try API first
            print('\n🔹 Source 1: NSE API')
            count_api = self.fetch_symbol_results_selenium(symbol, limit)

            # Then webpage
            print('\n🔹 Source 2: NSE Webpage')
            count_webpage = self.fetch_symbol_results_webpage(symbol, limit)

            total = count_api + count_webpage
            print(f'\n📊 Total from both sources: {total} files')
            return total

        elif source == 'webpage':
            return self.fetch_symbol_results_webpage(symbol, limit)

        else:  # 'api' (default)
            return self.fetch_symbol_results_selenium(symbol, limit)

    def get_download_stats(self):
        """Get download statistics from database"""
        if self.storage:
            return self.storage.get_download_stats()
        return None

    def get_symbol_downloads(self, symbol):
        """Get download history for a symbol"""
        if self.storage:
            return self.storage.get_download_history(symbol)
        return []

    def close(self):
        """Close session and storage"""
        self.session.close()
        if self.storage:
            self.storage.close()


def initialize_firebase():
    """Initialize Firebase (if not already initialized)"""
    if not FIREBASE_AVAILABLE:
        return False
    try:
        firebase_admin.get_app()
        return True
    except ValueError:
        cred_path = os.path.join(os.getcwd(), 'serviceAccountKey.json')
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            return True
        return False


def get_top_symbols_by_market_cap(limit=250):
    """
    Get top N symbols by market cap from Firebase
    Uses the same logic as generate-chart-data.py

    Args:
        limit: Number of top symbols to return (default 250)

    Returns:
        List of symbol names sorted by market cap (highest first)
    """
    if not initialize_firebase():
        print('❌ Firebase not available. Install with: pip install firebase-admin')
        print('❌ Also ensure serviceAccountKey.json exists in project root')
        return None

    try:
        db = firestore.client()

        # Get all symbols with market cap data
        symbols_ref = db.collection('symbols')
        docs = symbols_ref.stream()

        symbols_with_mcap = []

        for doc in docs:
            symbol = doc.id.replace('NS_', '')
            data = doc.to_dict()

            # Skip ETFs and BEES for financial results (they don't have quarterly results)
            is_etf_bees = 'ETF' in symbol.upper() or 'BEES' in symbol.upper()
            if is_etf_bees:
                continue

            if 'fundamental' in data and data['fundamental']:
                market_cap = data['fundamental'].get('marketCap', 0)
                if market_cap and market_cap > 0:
                    symbols_with_mcap.append({
                        'symbol': symbol,
                        'marketCap': market_cap
                    })

        # Sort by market cap (descending) and take top N
        symbols_with_mcap.sort(key=lambda x: x['marketCap'], reverse=True)
        top_symbols = [s['symbol'] for s in symbols_with_mcap[:limit]]

        print(f'📊 Found {len(symbols_with_mcap)} symbols with market cap data')
        print(f'🎯 Selected top {limit} by market cap')

        return top_symbols

    except Exception as e:
        print(f'⚠️  Error fetching market cap data: {str(e)}')
        return None


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Fetch financial results from NSE India',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Download results for single symbol (default: last 7 years)
    python3 scripts/fetch_nse_financial_results.py TCS

    # Download for multiple symbols
    python3 scripts/fetch_nse_financial_results.py TCS RELIANCE INFY

    # Download for top 250 symbols by market cap
    python3 scripts/fetch_nse_financial_results.py --top250

    # Download for top 100 symbols by market cap
    python3 scripts/fetch_nse_financial_results.py --top 100

    # Download ALL historical data (no year limit)
    python3 scripts/fetch_nse_financial_results.py TCS --years 0

    # Limit to last 10 years
    python3 scripts/fetch_nse_financial_results.py TCS --years 10

    # Limit to 4 most recent results per symbol
    python3 scripts/fetch_nse_financial_results.py TCS --limit 4

    # Read symbols from file
    python3 scripts/fetch_nse_financial_results.py --file symbols.txt
        """
    )

    parser.add_argument('symbols', nargs='*', help='Stock symbols (e.g., TCS RELIANCE)')
    parser.add_argument('--file', dest='symbols_file', help='File containing symbols (one per line)')
    parser.add_argument('--top250', action='store_true', help='Fetch financial results for top 250 symbols by market cap')
    parser.add_argument('--top', type=int, help='Fetch financial results for top N symbols by market cap')
    parser.add_argument('--limit', type=int, help='Limit number of results per symbol')
    parser.add_argument('--years', type=int, default=7, help='Limit downloads to last N years (default: 7, use --years 0 to download all)')
    parser.add_argument('--output', default='xbrl', help='Output directory (default: xbrl)')
    parser.add_argument('--source', choices=['api', 'webpage', 'both'], default='api',
                        help='Data source: "api" (NSE API), "webpage" (corporate filings page), or "both" (default: api)')
    parser.add_argument('--selenium', action='store_true', help='Force use of Selenium web scraping (requires selenium package and Chrome)')
    parser.add_argument('--show-history', dest='show_history', action='store_true', help='Show download history for specified symbols')
    parser.add_argument('--stats', action='store_true', help='Show download statistics')
    parser.add_argument('--no-tracking', dest='no_tracking', action='store_true', help='Disable download tracking in database')

    args = parser.parse_args()

    # Create fetcher (needed for stats/history modes)
    enable_tracking = not args.no_tracking
    # If years is 0, treat it as None (no limit)
    years_limit = args.years if args.years > 0 else None
    fetcher = NSEFinancialResultsFetcher(
        output_dir=args.output,
        enable_tracking=enable_tracking,
        years_limit=years_limit
    )

    # Show stats mode (doesn't require symbols)
    if args.stats:
        print('📊 Download Statistics')
        print('=' * 70)
        stats = fetcher.get_download_stats()
        if stats and stats['total_downloads'] > 0:
            print(f'Total downloads: {stats["total_downloads"]}')
            print(f'Unique symbols: {stats["unique_symbols"]}')
            print(f'Unique years: {stats["unique_years"]}')
            print(f'First download: {stats["first_download"]}')
            print(f'Last download: {stats["last_download"]}')
        else:
            print('No downloads tracked yet')
        print('=' * 70)
        fetcher.close()
        sys.exit(0)

    # Collect symbols for history and download modes
    symbols = []

    if args.symbols:
        symbols.extend([s.upper() for s in args.symbols])

    if args.symbols_file:
        if not os.path.exists(args.symbols_file):
            print(f'❌ Symbols file not found: {args.symbols_file}')
            fetcher.close()
            sys.exit(1)

        with open(args.symbols_file, 'r') as f:
            file_symbols = [line.strip().upper() for line in f if line.strip() and not line.startswith('#')]
            symbols.extend(file_symbols)

    # Add top symbols by market cap
    if args.top250:
        top_symbols = get_top_symbols_by_market_cap(limit=250)
        if top_symbols:
            symbols.extend(top_symbols)
        else:
            print('❌ Failed to fetch top 250 symbols')
            fetcher.close()
            sys.exit(1)

    if args.top:
        top_symbols = get_top_symbols_by_market_cap(limit=args.top)
        if top_symbols:
            symbols.extend(top_symbols)
        else:
            print(f'❌ Failed to fetch top {args.top} symbols')
            fetcher.close()
            sys.exit(1)

    # Remove duplicates while preserving order
    symbols = list(dict.fromkeys(symbols))

    # Show history mode
    if args.show_history:
        if not symbols:
            print('❌ Please provide at least one symbol to show history')
            parser.print_help()
            fetcher.close()
            sys.exit(1)

        for symbol in symbols:
            print(f'\n📜 Download History: {symbol}')
            print('=' * 70)
            history = fetcher.get_symbol_downloads(symbol)
            if history:
                for h in history:
                    print(f'{h["fy"]} {h["quarter"]} ({h["statement_type"]}) - {h["file_name"]}')
                    print(f'  Downloaded: {h["download_date"]}')
            else:
                print(f'No downloads found for {symbol}')
            print('=' * 70)
        fetcher.close()
        sys.exit(0)

    # Regular download mode - requires symbols
    if not symbols:
        parser.print_help()
        fetcher.close()
        sys.exit(1)

    print('🚀 NSE Financial Results Fetcher')
    print('=' * 70)
    print(f'Symbols: {", ".join(symbols)}')
    print(f'Output directory: {args.output}')
    print(f'Data source: {args.source}')
    if args.limit:
        print(f'Limit: {args.limit} results per symbol')
    if years_limit:
        print(f'Years limit: Only download data from last {years_limit} years')
    else:
        print(f'Years limit: None (downloading all historical data)')
    if enable_tracking:
        print('Download tracking: Enabled')
    else:
        print('Download tracking: Disabled')
    print('=' * 70)

    # Process each symbol
    total_downloaded = 0
    start_time = time.time()

    for i, symbol in enumerate(symbols):
        print(f'\n{"="*70}')
        print(f'[{i+1}/{len(symbols)}] Processing {symbol}')
        print(f'{"="*70}')

        try:
            count = fetcher.fetch_symbol_results(symbol, limit=args.limit, use_selenium=args.selenium, source=args.source)
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
