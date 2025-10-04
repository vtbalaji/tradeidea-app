// Fetch NSE equity symbols from official NSE website
const https = require('https');
const fs = require('fs');
const path = require('path');

async function fetchNSESymbols() {
  console.log('📥 Fetching NSE equity symbols...');

  const url = 'https://www.nseindia.com/api/equity-stockIndices?index=SECURITIES%20IN%20F%26O';

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  };

  return new Promise((resolve, reject) => {
    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const symbols = json.data.map(item => ({
            symbol: item.symbol,
            name: item.symbol, // NSE doesn't provide full name in this API
            exchange: 'NSE',
            sector: item.industry || '',
            industry: item.industry || '',
            currency: 'INR',
            isin: item.meta?.isin || '',
            isActive: true
          }));

          console.log(`✅ Fetched ${symbols.length} symbols`);

          // Save to file
          const outputPath = path.join(__dirname, 'nse-symbols.json');
          fs.writeFileSync(outputPath, JSON.stringify(symbols, null, 2));
          console.log(`💾 Saved to ${outputPath}`);

          resolve(symbols);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Alternative: Download from NSE's equity list CSV
async function downloadNSEEquityList() {
  console.log('📥 Downloading NSE Equity List...');

  // This is the direct CSV download link
  const csvUrl = 'https://archives.nseindia.com/content/equities/EQUITY_L.csv';

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    https.get(csvUrl, options, (res) => {
      const outputPath = path.join(__dirname, 'nse-equity-list.csv');
      const fileStream = fs.createWriteStream(outputPath);

      res.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✅ Downloaded to ${outputPath}`);
        resolve(outputPath);
      });

      fileStream.on('error', (error) => {
        fs.unlink(outputPath, () => {});
        reject(error);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Run both methods
async function main() {
  try {
    console.log('🚀 Starting NSE symbols fetch...\n');

    // Try method 1: API
    try {
      await fetchNSESymbols();
    } catch (error) {
      console.log('⚠️  API fetch failed:', error.message);
    }

    // Try method 2: CSV download
    try {
      await downloadNSEEquityList();
      console.log('\n📋 CSV downloaded successfully!');
      console.log('You can convert it to JSON using: https://www.convertcsv.com/csv-to-json.htm');
    } catch (error) {
      console.log('⚠️  CSV download failed:', error.message);
    }

    console.log('\n✅ Done! Check the scripts folder for output files.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
