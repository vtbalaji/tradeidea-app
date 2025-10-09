/**
 * CSV Import Utilities for Portfolio
 */

export interface CSVRow {
  symbol: string;
  entryPrice: string;
  quantity: string;
  dateTaken: string;
  target1: string;
  stopLoss: string;
  tradeType?: string;
}

/**
 * Field mapping for different broker formats
 */
const FIELD_MAPPINGS: { [key: string]: { [key: string]: string } } = {
  // Zerodha format
  'Instrument': 'symbol',
  'instrument': 'symbol',
  'Qty.': 'quantity',
  'qty': 'quantity',
  'quantity': 'quantity',
  'Avg. cost': 'entryPrice',
  'avg cost': 'entryPrice',
  'avg. cost': 'entryPrice',
  'avgcost': 'entryPrice',
  'average cost': 'entryPrice',
  'LTP': 'currentPrice',
  'ltp': 'currentPrice',
  'current price': 'currentPrice',

  // ICICI format
  'Stock Symbol': 'symbol',
  'stock symbol': 'symbol',
  'Qty': 'quantity',
  'Average Cost Price': 'entryPrice',
  'average cost price': 'entryPrice',
  'Current Market Price': 'currentPrice',
  'current market price': 'currentPrice',

  // Standard format
  'symbol': 'symbol',
  'entryPrice': 'entryPrice',
  'entry price': 'entryPrice',
  'dateTaken': 'dateTaken',
  'date taken': 'dateTaken',
  'date': 'dateTaken',
  'target1': 'target1',
  'target': 'target1',
  'stopLoss': 'stopLoss',
  'stop loss': 'stopLoss',
  'sl': 'stopLoss',
  'tradeType': 'tradeType',
  'trade type': 'tradeType',
  'type': 'tradeType',
};

/**
 * Detect and map CSV headers to standard format
 */
function mapHeaders(headers: string[]): { [key: string]: string } {
  const mapping: { [key: string]: string } = {};

  headers.forEach(header => {
    const cleanHeader = header.trim();
    const mappedField = FIELD_MAPPINGS[cleanHeader] || FIELD_MAPPINGS[cleanHeader.toLowerCase()];
    if (mappedField) {
      mapping[cleanHeader] = mappedField;
    }
  });

  return mapping;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  validRows: CSVRow[];
  errors: ValidationError[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Validate date in DD-MM-YYYY format
 */
function validateDate(dateStr: string): boolean {
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateStr)) return false;

  const [day, month, year] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * List of known NSE symbols (subset for quick validation)
 * Full list is in Firestore, but this provides fast offline validation
 */
const KNOWN_NSE_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
  'LT', 'BAJFINANCE', 'ASIANPAINT', 'HCLTECH', 'AXISBANK', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NESTLEIND',
  'ADANIPORTS', 'ADANIPOWER', 'ADANIENT', 'ADANIGREEN', 'ADANIENSOL', 'TATAMOTORS', 'TATASTEEL', 'TATACONSUM', 'TATAPOWER',
  'WIPRO', 'POWERGRID', 'NTPC', 'ONGC', 'COALINDIA', 'BAJAJFINSV', 'M&M', 'DIVISLAB', 'TECHM', 'DRREDDY',
  'JSWSTEEL', 'INDUSINDBK', 'BRITANNIA', 'CIPLA', 'EICHERMOT', 'GRASIM', 'HINDALCO', 'HEROMOTOCO', 'BPCL', 'SHREECEM',
  'UPL', 'APOLLOHOSP', 'VEDL', 'TATAELXSI', 'PERSISTENT', 'COFORGE', 'MPHASIS', 'LTTS', 'LTIM', 'OFSS'
];

/**
 * Validate symbol against NSE symbols
 * Returns normalized symbol if valid, null if invalid
 */
export async function validateSymbol(symbol: string, firestoreDb: any): Promise<string | null> {
  try {
    const upperSymbol = symbol.toUpperCase().trim();

    // Quick check against known symbols first (fast path)
    if (KNOWN_NSE_SYMBOLS.includes(upperSymbol)) {
      return upperSymbol;
    }

    // Check Firestore (slower but comprehensive)
    // Import the required functions dynamically to support both v8 and v9
    if (firestoreDb) {
      try {
        // Try v9 modular syntax first
        const { doc, getDoc } = await import('firebase/firestore');
        const symbolDocRef = doc(firestoreDb, 'symbols', upperSymbol);
        const symbolDoc = await getDoc(symbolDocRef);
        if (symbolDoc.exists()) {
          return upperSymbol;
        }
      } catch (v9Error) {
        // Fallback to v8 syntax if available
        if (typeof firestoreDb.collection === 'function') {
          const symbolDoc = await firestoreDb.collection('symbols').doc(upperSymbol).get();
          if (symbolDoc.exists) {
            return upperSymbol;
          }
        }
      }
    }

    // If Firestore check fails, still accept the symbol if it looks valid
    // (alphanumeric, 1-20 chars) - batch job will validate later
    if (/^[A-Z0-9]{1,20}$/.test(upperSymbol)) {
      console.warn(`Symbol ${upperSymbol} not found in DB but accepting (will validate during batch)`);
      return upperSymbol;
    }

    return null;
  } catch (error) {
    console.error('Error validating symbol:', error);
    // On error, accept if format looks valid
    const upperSymbol = symbol.toUpperCase().trim();
    if (/^[A-Z0-9]{1,20}$/.test(upperSymbol)) {
      return upperSymbol;
    }
    return null;
  }
}

/**
 * Parse and validate CSV data
 */
export async function parseAndValidateCSV(
  csvText: string,
  db: any
): Promise<ImportResult> {
  const lines = csvText.trim().split('\n');
  const errors: ValidationError[] = [];
  const validRows: CSVRow[] = [];

  if (lines.length < 2) {
    errors.push({
      row: 0,
      field: 'file',
      message: 'CSV file is empty or missing header row'
    });
    return {
      success: false,
      validRows: [],
      errors,
      summary: { total: 0, valid: 0, invalid: 0 }
    };
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const headerMapping = mapHeaders(header);

  // Check for minimum required fields (only symbol, entryPrice, quantity are truly required)
  const hasSymbol = Object.values(headerMapping).includes('symbol');
  const hasEntryPrice = Object.values(headerMapping).includes('entryPrice');
  const hasQuantity = Object.values(headerMapping).includes('quantity');

  if (!hasSymbol || !hasEntryPrice || !hasQuantity) {
    const missing = [];
    if (!hasSymbol) missing.push('symbol/Instrument');
    if (!hasEntryPrice) missing.push('entryPrice/Avg. cost');
    if (!hasQuantity) missing.push('quantity/Qty.');

    errors.push({
      row: 0,
      field: 'header',
      message: `Missing required columns: ${missing.join(', ')}`
    });

    return {
      success: false,
      validRows: [],
      errors,
      summary: { total: lines.length - 1, valid: 0, invalid: lines.length - 1 }
    };
  }

  // Parse and validate data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const mappedRow: any = {};

    // Map values to standard fields using header mapping
    header.forEach((originalField, index) => {
      const standardField = headerMapping[originalField];
      if (standardField) {
        mappedRow[standardField] = values[index] || '';
      }
    });

    const rowErrors: ValidationError[] = [];
    const rowNumber = i + 1;
    const row = mappedRow; // Use mapped row for validation

    // Validate symbol
    if (!row.symbol) {
      rowErrors.push({ row: rowNumber, field: 'symbol', message: 'Symbol is required' });
    } else {
      const validatedSymbol = await validateSymbol(row.symbol, db);
      if (!validatedSymbol) {
        rowErrors.push({
          row: rowNumber,
          field: 'symbol',
          message: `Invalid symbol '${row.symbol}' - not found in NSE symbols`
        });
      } else {
        // Update row with normalized symbol
        row.symbol = validatedSymbol;
      }
    }

    // Validate entryPrice
    const entryPrice = parseFloat(row.entryPrice);
    if (isNaN(entryPrice) || entryPrice <= 0) {
      rowErrors.push({
        row: rowNumber,
        field: 'entryPrice',
        message: 'Entry price must be a positive number'
      });
    }

    // Validate quantity
    const quantity = parseInt(row.quantity);
    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(parseFloat(row.quantity))) {
      rowErrors.push({
        row: rowNumber,
        field: 'quantity',
        message: 'Quantity must be a positive integer'
      });
    }

    // Validate dateTaken (optional - will use today's date if missing)
    if (row.dateTaken && !validateDate(row.dateTaken)) {
      rowErrors.push({
        row: rowNumber,
        field: 'dateTaken',
        message: 'Date must be in DD-MM-YYYY format (e.g., 15-01-2025)'
      });
    }

    // Validate target1 (optional - will prompt if missing)
    if (row.target1) {
      const target1 = parseFloat(row.target1);
      if (isNaN(target1) || target1 <= 0) {
        rowErrors.push({
          row: rowNumber,
          field: 'target1',
          message: 'Target must be a positive number'
        });
      }
    }

    // Validate stopLoss (optional - will prompt if missing)
    if (row.stopLoss) {
      const stopLoss = parseFloat(row.stopLoss);
      if (isNaN(stopLoss) || stopLoss <= 0) {
        rowErrors.push({
          row: rowNumber,
          field: 'stopLoss',
          message: 'Stop loss must be a positive number'
        });
      }
    }

    // Validate tradeType (optional)
    if (row.tradeType && !['Long', 'Short'].includes(row.tradeType)) {
      rowErrors.push({
        row: rowNumber,
        field: 'tradeType',
        message: 'Trade type must be "Long" or "Short"'
      });
    }

    // If row has errors, add to errors array
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validRows.push(row as CSVRow);
    }
  }

  return {
    success: errors.length === 0,
    validRows,
    errors,
    summary: {
      total: lines.length - 1,
      valid: validRows.length,
      invalid: errors.length > 0 ? lines.length - 1 - validRows.length : 0
    }
  };
}

/**
 * Convert CSV row to portfolio position data
 * Defaults: 200MA and Weekly Supertrend exit enabled, rest disabled
 * Auto-calculates target/SL if missing (±15% from entry)
 */
export function csvRowToPosition(row: CSVRow, currentDate?: string) {
  const entryPrice = parseFloat(row.entryPrice);
  const quantity = parseFloat(row.quantity);

  // Smart defaults for missing fields
  const target1 = row.target1 ? parseFloat(row.target1) : entryPrice * 1.15; // +15%
  const stopLoss = row.stopLoss ? parseFloat(row.stopLoss) : entryPrice * 0.92; // -8%
  const dateTaken = row.dateTaken || currentDate || formatTodayDate();

  return {
    symbol: row.symbol.toUpperCase(),
    tradeType: (row.tradeType || 'Long') as 'Long' | 'Short',
    entryPrice,
    currentPrice: entryPrice, // Use entry price as current price
    target1,
    stopLoss,
    quantity,
    totalValue: entryPrice * quantity,
    dateTaken,
    exitCriteria: {
      exitAtStopLoss: true,
      exitAtTarget: true,
      exitBelow50EMA: false,
      exitBelow100MA: false,
      exitBelow200MA: true, // Default true
      exitOnWeeklySupertrend: true, // Default true
      customNote: '',
    }
  };
}

/**
 * Format today's date as DD-MM-YYYY
 */
function formatTodayDate(): string {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Generate CSV template
 * Simple format: symbol, entryPrice, quantity, dateTaken, target1, stopLoss, tradeType
 */
export function generateCSVTemplate(): string {
  const header = [
    'symbol',
    'entryPrice',
    'quantity',
    'dateTaken',
    'target1',
    'stopLoss',
    'tradeType'
  ].join(',');

  const example1 = [
    'RELIANCE',
    '2500.00',
    '10',
    '15-01-2025',
    '2800.00',
    '2300.00',
    'Long'
  ].join(',');

  const example2 = [
    'TCS',
    '3600.00',
    '5',
    '20-01-2025',
    '4000.00',
    '3400.00',
    'Long'
  ].join(',');

  return `${header}\n${example1}\n${example2}`;
}

/**
 * Generate error report CSV
 */
export function generateErrorReport(errors: ValidationError[]): string {
  const header = 'Row,Field,Error Message';
  const rows = errors.map(e => `${e.row},${e.field},"${e.message}"`).join('\n');
  return `${header}\n${rows}`;
}
