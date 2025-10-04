const fs = require('fs');
const path = require('path');

// Read CSV
const csvPath = path.join(__dirname, 'nse-equity-list.csv');
const csvData = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvData.trim().split('\n');
const headers = lines[0].split(',');

const symbols = [];

for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(',');

  if (values.length >= 7) {
    const symbol = values[0].trim();
    const name = values[1].trim();
    const series = values[2].trim();
    const isin = values[6].trim();

    // Only include EQ (Equity) series, skip BE, BZ etc
    if (series === 'EQ' || series === 'BE') {
      symbols.push({
        symbol,
        name,
        exchange: 'NSE',
        series,
        sector: '', // Will be updated later if needed
        industry: '',
        currency: 'INR',
        isin,
        isActive: series === 'EQ' // EQ is active, BE is suspended/delisted
      });
    }
  }
}

// Save JSON
const outputPath = path.join(__dirname, 'nse-symbols.json');
fs.writeFileSync(outputPath, JSON.stringify(symbols, null, 2));

console.log(`✅ Converted ${symbols.length} symbols to JSON`);
console.log(`💾 Saved to ${outputPath}`);
