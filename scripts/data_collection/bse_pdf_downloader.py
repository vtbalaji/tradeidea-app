#!/usr/bin/env python3
"""
BSE PDF Downloader - Download quarterly results and investor presentations from BSE
"""

import requests
from bs4 import BeautifulSoup
import re
import os
from datetime import datetime
import time
import json
from pathlib import Path

class BSEPDFDownloader:
    """Download PDFs from BSE website"""

    # BSE Script Codes (6-digit codes)
    BSE_CODES = {
        'BHEL': '500103',
        'TCS': '532540',
        'INFY': '500209',
        'HDFCBANK': '500180',
        'ICICIBANK': '532174',
        'LT': '500510',
        'SBIN': '500112',
        'WIPRO': '507685',
        'RELIANCE': '500325',
        'ITC': '500875',
    }

    def __init__(self, download_dir='data/bse_pdfs'):
        self.download_dir = Path(download_dir)
        self.download_dir.mkdir(parents=True, exist_ok=True)

        # Create subdirectories
        (self.download_dir / 'results').mkdir(exist_ok=True)
        (self.download_dir / 'presentations').mkdir(exist_ok=True)

        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    def get_announcements(self, symbol, bse_code=None, limit=20):
        """
        Get latest announcements from BSE

        Args:
            symbol: Stock symbol (e.g., 'BHEL')
            bse_code: BSE scrip code (e.g., '500103')
            limit: Number of announcements to fetch

        Returns:
            List of announcement dicts with title, date, PDF URL
        """
        if not bse_code:
            bse_code = self.BSE_CODES.get(symbol)
            if not bse_code:
                print(f"❌ BSE code not found for {symbol}")
                return []

        print(f"📡 Fetching announcements for {symbol} (BSE: {bse_code})...")

        # BSE API endpoint for corporate announcements
        url = f"https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w"

        params = {
            'strCat': '-1',  # All categories
            'strPrevDate': '',
            'strScrip': bse_code,
            'strSearch': 'P',
            'strToDate': '',
            'strType': 'C'  # Corporate announcements
        }

        try:
            response = self.session.get(url, params=params, timeout=30)

            if response.status_code == 200:
                data = response.json()
                announcements = []

                for item in data.get('Table', [])[:limit]:
                    ann = {
                        'symbol': symbol,
                        'title': item.get('SLONGNAME', ''),
                        'date': item.get('NEWDATE', ''),
                        'attachment': item.get('ATTACHMENTNAME', ''),
                        'news_id': item.get('NEWS_ID', ''),
                        'type': self._classify_announcement(item.get('SLONGNAME', ''))
                    }

                    # Build PDF URL
                    if ann['attachment']:
                        ann['pdf_url'] = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{ann['attachment']}"

                    announcements.append(ann)

                print(f"✅ Found {len(announcements)} announcements")
                return announcements
            else:
                print(f"❌ API error: {response.status_code}")
                return []

        except Exception as e:
            print(f"❌ Error fetching announcements: {e}")
            return []

    def _classify_announcement(self, title):
        """Classify announcement type based on title"""
        title_lower = title.lower()

        if any(keyword in title_lower for keyword in ['result', 'financial result', 'unaudited', 'audited']):
            return 'results'
        elif any(keyword in title_lower for keyword in ['presentation', 'investor presentation']):
            return 'presentation'
        elif 'annual report' in title_lower:
            return 'annual_report'
        elif any(keyword in title_lower for keyword in ['press release', 'outcome of board meeting']):
            return 'press_release'
        else:
            return 'other'

    def download_pdf(self, announcement, force=False):
        """
        Download PDF from announcement

        Args:
            announcement: Announcement dict from get_announcements()
            force: Re-download even if file exists

        Returns:
            Path to downloaded file or None
        """
        if 'pdf_url' not in announcement:
            return None

        symbol = announcement['symbol']
        ann_type = announcement['type']
        attachment = announcement['attachment']

        # Determine save location
        if ann_type in ['results', 'press_release']:
            save_dir = self.download_dir / 'results' / symbol
        elif ann_type == 'presentation':
            save_dir = self.download_dir / 'presentations' / symbol
        else:
            save_dir = self.download_dir / 'other' / symbol

        save_dir.mkdir(parents=True, exist_ok=True)

        # Clean filename
        filename = attachment
        filepath = save_dir / filename

        # Check if already exists
        if filepath.exists() and not force:
            print(f"⏭️  Already exists: {filename}")
            return filepath

        print(f"⬇️  Downloading: {filename}")

        try:
            response = self.session.get(announcement['pdf_url'], timeout=30)

            if response.status_code == 200:
                # Check if actually PDF
                content_type = response.headers.get('content-type', '')
                if 'pdf' not in content_type.lower() and not attachment.lower().endswith('.pdf'):
                    print(f"⚠️  Not a PDF: {content_type}")
                    return None

                # Save file
                with open(filepath, 'wb') as f:
                    f.write(response.content)

                print(f"✅ Downloaded: {filepath}")
                return filepath
            else:
                print(f"❌ Download failed: {response.status_code}")
                return None

        except Exception as e:
            print(f"❌ Error downloading: {e}")
            return None

    def download_latest_results(self, symbol, count=4):
        """
        Download latest quarterly results for a symbol

        Args:
            symbol: Stock symbol
            count: Number of quarters to download

        Returns:
            List of downloaded file paths
        """
        print(f"\n{'='*60}")
        print(f"Downloading latest {count} results for {symbol}")
        print('='*60)

        announcements = self.get_announcements(symbol, limit=50)

        # Filter for results only
        results = [a for a in announcements if a['type'] in ['results', 'press_release']][:count]

        downloaded = []
        for ann in results:
            filepath = self.download_pdf(ann)
            if filepath:
                downloaded.append(filepath)
            time.sleep(1)  # Be nice to BSE servers

        print(f"\n✅ Downloaded {len(downloaded)} files for {symbol}")
        return downloaded

    def download_all_symbols(self, symbols=None, results_per_symbol=4):
        """
        Download results for multiple symbols

        Args:
            symbols: List of symbols (default: all in BSE_CODES)
            results_per_symbol: Number of quarters per symbol
        """
        if symbols is None:
            symbols = list(self.BSE_CODES.keys())

        print(f"\n🚀 Starting batch download for {len(symbols)} symbols")
        print(f"📁 Save location: {self.download_dir.absolute()}")

        summary = {}

        for symbol in symbols:
            try:
                downloaded = self.download_latest_results(symbol, count=results_per_symbol)
                summary[symbol] = len(downloaded)
                time.sleep(2)  # Delay between companies
            except Exception as e:
                print(f"❌ Error processing {symbol}: {e}")
                summary[symbol] = 0

        # Print summary
        print(f"\n{'='*60}")
        print("📊 DOWNLOAD SUMMARY")
        print('='*60)
        for symbol, count in summary.items():
            status = "✅" if count > 0 else "❌"
            print(f"{status} {symbol}: {count} files")
        print('='*60)
        print(f"Total files: {sum(summary.values())}")
        print(f"Location: {self.download_dir.absolute()}")

    def list_downloaded_files(self, symbol=None):
        """List all downloaded files"""
        if symbol:
            results_dir = self.download_dir / 'results' / symbol
            pres_dir = self.download_dir / 'presentations' / symbol

            files = []
            if results_dir.exists():
                files.extend(list(results_dir.glob('*.pdf')))
            if pres_dir.exists():
                files.extend(list(pres_dir.glob('*.pdf')))

            return sorted(files, key=lambda x: x.stat().st_mtime, reverse=True)
        else:
            # All files
            return sorted(self.download_dir.glob('**/*.pdf'),
                         key=lambda x: x.stat().st_mtime, reverse=True)


def main():
    """Example usage"""
    downloader = BSEPDFDownloader()

    # Example 1: Download latest results for BHEL
    print("\n" + "="*60)
    print("EXAMPLE 1: Download BHEL quarterly results")
    print("="*60)
    downloader.download_latest_results('BHEL', count=2)

    # Example 2: Download for TCS
    print("\n" + "="*60)
    print("EXAMPLE 2: Download TCS quarterly results")
    print("="*60)
    downloader.download_latest_results('TCS', count=2)

    # Example 3: Get announcement list (no download)
    print("\n" + "="*60)
    print("EXAMPLE 3: List announcements for HDFCBANK")
    print("="*60)
    announcements = downloader.get_announcements('HDFCBANK', limit=10)
    for i, ann in enumerate(announcements, 1):
        print(f"{i}. {ann['date']} - {ann['title'][:60]}... ({ann['type']})")

    # Example 4: Batch download for multiple companies
    # Uncomment to run:
    # print("\n" + "="*60)
    # print("EXAMPLE 4: Batch download for top 5 companies")
    # print("="*60)
    # downloader.download_all_symbols(['BHEL', 'TCS', 'INFY', 'HDFCBANK', 'LT'],
    #                                  results_per_symbol=3)


if __name__ == '__main__':
    main()
