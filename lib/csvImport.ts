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
  isin?: string; // ISIN number for fallback lookup
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

  // Bala/Generic broker format
  'Stock Name': 'symbol',
  'stock name': 'symbol',
  'Average buy price': 'entryPrice',
  'average buy price': 'entryPrice',
  'Closing price': 'currentPrice',
  'closing price': 'currentPrice',

  // ISIN variations
  'ISIN': 'isin',
  'isin': 'isin',
  'Isin': 'isin',
  'ISIN Code': 'isin',
  'isin code': 'isin',
  'ISIN Number': 'isin',
  'isin number': 'isin',

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
 * ICICI Direct symbol mapping to NSE symbols
 * ICICI uses abbreviated codes, we need to map them to actual NSE symbols
 */
const ICICI_SYMBOL_MAP: { [key: string]: string } = {
  'ULTCEM': 'ULTRACEMCO',
  'HDFBAN': 'HDFCBANK',
  'TATCHE': 'TATACHEM',
  'ADAPOR': 'ADANIPORTS',
  'DELCOR': 'DELTACORP',
  'HINCOP': 'HINDCOPPER',
  'JSWSTE': 'JSWSTEEL',
  'NATALU': 'NATIONALUM',
  'NATMIN': 'NMDC',
  'ASIPAI': 'ASIANPAINT',
  'KPIGLO': 'KPIGREEN',
  'POWGRI': 'POWERGRID',
  'TATPOW': 'TATAPOWER',
  'RELIND': 'RELIANCE',
  'COCSHI': 'COCHINSHIP',
  'GATDIS': 'GATEWAYDIS',
  'JINSP': 'JINDALSTEL',
  'SARENE': 'SARDAEN',
  'TATSTE': 'TATASTEEL',
  'BALCHI': 'BALRAMCHIN',
  'BHAAIR': 'BHARTIARTL',
  'FINCAB': 'FINCABLES',
  'KEIIND': 'KEI',
  'POLI': 'POLYCAB',
  'RAIIND': 'RAIN',
  'DIXTEC': 'DIXON',
  'ZOMLIM': 'ETERNAL',
  'BHEL': 'BHEL',
  'THERMA': 'THERMAX',
  'EMALIM': 'EMAMILTD',
  'HATAGR': 'HATSUN',
  'HINLEV': 'HINDUNILVR',
  'BAJFI': 'BAJFINANCE',
  'LICHF': 'LICHSGFIN',
  'NIITEC': 'COFORGE',
  'WIPRO': 'WIPRO',
  'SOMDIS': 'SDBL',  // Som Distilleries & Breweries
  'AMARAJ': 'ARE&M', // Amara Raja Energy & Mobility
  'WHEIND': 'WHEELS',     // Wheels India
  // ETFs - these won't work with Yahoo Finance EOD job, skip them
  'CPSETF': 'CPSEETF',
  'NIFBEE': 'NIFTYBEES',
  'NIPNIT': 'ITBEES',
  'NIPSIL': 'SILVERETF',
  'RELCON': 'CONSUMBEES',
  'BHABO1': 'BHARAT23',
  'BHABO2': 'BHARAT30',
  'BHABO5': 'BHARAT32',
  'BHABO6': 'BHARAT33',
  'POWINF': 'POWMFINVIT',
  'URBCOM': null,  // Urban Company - unlisted/private
};

/**
 * Company name to NSE symbol mapping
 * Handles cases where CSV has full company names instead of symbols
 */
const COMPANY_NAME_TO_SYMBOL: { [key: string]: string } = {
  // Common company names with variations
  'BHARAT ELECTRONICS': 'BEL',
  'BHARAT ELECTRONICS LTD': 'BEL',
  'BHARAT ELECTRONICS LIMITED': 'BEL',
  'GE POWER INDIA': 'GEPIL',
  'GE POWER INDIA LIMITED': 'GEPIL',
  'GE POWER INDIA LTD': 'GEPIL',
  'HINDALCO INDUSTRIES': 'HINDALCO',
  'HINDALCO INDUSTRIES LTD': 'HINDALCO',
  'HINDALCO INDUSTRIES LIMITED': 'HINDALCO',
  'RELIANCE INDUSTRIES': 'RELIANCE',
  'RELIANCE INDUSTRIES LTD': 'RELIANCE',
  'RELIANCE INDUSTRIES LIMITED': 'RELIANCE',
  'TATA CONSULTANCY SERVICES': 'TCS',
  'TATA CONSULTANCY SERVICES LTD': 'TCS',
  'INFOSYS': 'INFY',
  'INFOSYS LTD': 'INFY',
  'INFOSYS LIMITED': 'INFY',
  'HDFC BANK': 'HDFCBANK',
  'HDFC BANK LTD': 'HDFCBANK',
  'HDFC BANK LIMITED': 'HDFCBANK',
  'ICICI BANK': 'ICICIBANK',
  'ICICI BANK LTD': 'ICICIBANK',
  'ICICI BANK LIMITED': 'ICICIBANK',
  'STATE BANK OF INDIA': 'SBIN',
  'BHARTI AIRTEL': 'BHARTIARTL',
  'BHARTI AIRTEL LTD': 'BHARTIARTL',
  'LARSEN & TOUBRO': 'LT',
  'LARSEN AND TOUBRO': 'LT',
  'L&T': 'LT',
  'MARUTI SUZUKI INDIA': 'MARUTI',
  'MARUTI SUZUKI INDIA LTD': 'MARUTI',
  'TATA MOTORS': 'TATAMOTORS',
  'TATA MOTORS LTD': 'TATAMOTORS',
  'TATA STEEL': 'TATASTEEL',
  'TATA STEEL LTD': 'TATASTEEL',
  'WIPRO': 'WIPRO',
  'WIPRO LTD': 'WIPRO',
  'WIPRO LIMITED': 'WIPRO',
  'BAJAJ FINANCE': 'BAJFINANCE',
  'BAJAJ FINANCE LTD': 'BAJFINANCE',
  'ASIAN PAINTS': 'ASIANPAINT',
  'ASIAN PAINTS LTD': 'ASIANPAINT',
  'AXIS BANK': 'AXISBANK',
  'AXIS BANK LTD': 'AXISBANK',
  'KOTAK MAHINDRA BANK': 'KOTAKBANK',
  'HINDUSTAN UNILEVER': 'HINDUNILVR',
  'HINDUSTAN UNILEVER LTD': 'HINDUNILVR',
  'ITC': 'ITC',
  'ITC LTD': 'ITC',
  'ITC LIMITED': 'ITC',
};

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
  'UPL', 'APOLLOHOSP', 'VEDL', 'TATAELXSI', 'PERSISTENT', 'COFORGE', 'MPHASIS', 'LTTS', 'LTIM', 'OFSS',
  'KEI', 'POLYCAB', 'DIXON', 'RAIN', 'ETERNAL', 'BHEL', 'THERMAX', 'EMAMILTD', 'HATSUN', 'LICHSGFIN',
  'TATACHEM', 'NMDC', 'COCHINSHIP', 'GATEWAY', 'BALRAMCHIN', 'FINOLEXCAB', 'SARDAEN', 'AMARAJABAT', 'WHEELS',
  'ARE&M', 'SDBL',
  // Additional symbols from various broker formats
  'BALKRISIND', 'BEL', 'CEATLTD', 'CDSL', 'AXISBANK', 'GEPIL'
];

/**
 * Extract NSE symbol from stock name
 * Handles full company names like "AXIS BANK LIMITED" → "AXISBANK"
 */
function extractSymbolFromName(stockName: string): string {
  // Remove common suffixes and clean up
  const cleaned = stockName
    .toUpperCase()
    .replace(/\s+LIMITED$/i, '')
    .replace(/\s+LTD\.?$/i, '')
    .replace(/\s+LTD$/i, '')
    .replace(/\s+LTDS$/i, '')
    .replace(/\s+CORPORATION$/i, '')
    .replace(/\s+CORP\.?$/i, '')
    .replace(/\s+COMPANY$/i, '')
    .replace(/\s+CO\.?$/i, '')
    .replace(/\s+INC\.?$/i, '')
    .replace(/\s+PLC$/i, '')
    .replace(/\s+\(INDIA\)$/i, '')
    .replace(/\s+\(I\)$/i, '')
    .replace(/\s+IND\.?$/i, '')
    .replace(/\s+INDUSTRIES$/i, '')
    .replace(/\s+INTERNATIONAL$/i, '')
    .trim();

  // Remove spaces and special characters to create potential symbol
  const symbol = cleaned.replace(/\s+/g, '').replace(/[^A-Z0-9&]/g, '');

  return symbol;
}

/**
 * Lookup symbol by ISIN number
 * Returns the NSE symbol if found, null otherwise
 */
export async function lookupSymbolByISIN(isin: string, firestoreDb: any): Promise<string | null> {
  try {
    if (!isin || isin.trim().length === 0) {
      return null;
    }

    const cleanISIN = isin.toUpperCase().trim();

    // Validate ISIN format (should be 12 characters: 2 country code + 10 alphanumeric)
    if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(cleanISIN)) {
      console.warn(`❌ Invalid ISIN format: ${isin}`);
      return null;
    }

    // First check in hardcoded symbols data
    const { INDIAN_STOCKS } = await import('./symbolsData');
    const foundStock = INDIAN_STOCKS.find(s => s.isin === cleanISIN);
    if (foundStock) {
      console.log(`✅ Found symbol ${foundStock.symbol} for ISIN ${cleanISIN}`);
      return foundStock.symbol;
    }

    // Then check Firestore
    if (firestoreDb) {
      try {
        // Try v9 modular syntax first
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const symbolsRef = collection(firestoreDb, 'symbols');
        const q = query(symbolsRef, where('isin', '==', cleanISIN));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const symbol = doc.id; // Document ID is the symbol
          console.log(`✅ Found symbol ${symbol} for ISIN ${cleanISIN} in Firestore`);
          return symbol;
        }
      } catch (v9Error) {
        // Fallback to v8 syntax if available
        if (typeof firestoreDb.collection === 'function') {
          const querySnapshot = await firestoreDb.collection('symbols')
            .where('isin', '==', cleanISIN)
            .get();

          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const symbol = doc.id;
            console.log(`✅ Found symbol ${symbol} for ISIN ${cleanISIN} in Firestore`);
            return symbol;
          }
        }
      }
    }

    console.warn(`❌ No symbol found for ISIN ${cleanISIN}`);
    return null;
  } catch (error) {
    console.error('Error looking up symbol by ISIN:', error);
    return null;
  }
}

/**
 * Validate symbol against NSE symbols
 * Returns normalized symbol if valid, null if invalid
 * STRICT MODE: Only accepts symbols found in DB or known symbols list
 */
export async function validateSymbol(symbol: string, firestoreDb: any): Promise<string | null> {
  try {
    let upperSymbol = symbol.toUpperCase().trim();

    // Remove excessive spaces (e.g., "HINDALCO  INDUSTRIES  LTD" → "HINDALCO INDUSTRIES LTD")
    upperSymbol = upperSymbol.replace(/\s+/g, ' ');

    // Basic format validation first
    if (!upperSymbol || upperSymbol.length === 0) {
      console.warn(`❌ Invalid symbol format: ${symbol} (empty)`);
      return null;
    }

    // Check if it's a full company name with direct mapping
    if (upperSymbol in COMPANY_NAME_TO_SYMBOL) {
      const mapped = COMPANY_NAME_TO_SYMBOL[upperSymbol];
      console.log(`✅ Mapped company name: "${symbol}" → ${mapped}`);
      return mapped;
    }

    // Reject symbols with spaces that aren't in the company name mapping
    // (after this point, we expect trading symbols only)
    if (upperSymbol.includes(' ')) {
      console.warn(`❌ Unknown company name: "${symbol}". Not found in company name mapping.`);
      return null;
    }

    // Validate symbol length (trading symbols are typically 1-20 chars)
    if (upperSymbol.length > 20) {
      console.warn(`❌ Invalid symbol format: ${symbol} (too long)`);
      return null;
    }

    // Reject symbols with invalid characters (only allow A-Z, 0-9, &, -)
    if (!/^[A-Z0-9&-]+$/.test(upperSymbol)) {
      console.warn(`❌ Invalid symbol format: ${symbol} (contains invalid characters)`);
      return null;
    }

    // Check if this is an ICICI symbol that needs mapping
    if (upperSymbol in ICICI_SYMBOL_MAP) {
      const mapped = ICICI_SYMBOL_MAP[upperSymbol];
      if (mapped === null) {
        console.warn(`⚠️  ${upperSymbol} is unlisted/private - skipping`);
        return null;
      }
      upperSymbol = mapped;
      console.log(`Mapped ICICI symbol ${symbol} → ${upperSymbol}`);
    }

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

    // LENIENT VALIDATION: Allow symbols that look valid even if not in database
    // The symbol will be validated when EOD data is fetched
    // This allows users to import newer symbols that haven't been added to the database yet
    console.warn(`⚠️  Symbol ${upperSymbol} not found in database, but allowing (valid format)`);
    return upperSymbol;
  } catch (error) {
    console.error('Error validating symbol:', error);
    // On error, reject the symbol (strict mode)
    console.warn(`❌ Error validating symbol ${symbol} - rejecting for safety`);
    return null;
  }
}

/**
 * Consolidate duplicate symbols by summing quantities and averaging prices
 * Uses weighted average for entry price based on quantities
 */
function consolidateDuplicateSymbols(rows: CSVRow[]): CSVRow[] {
  const symbolMap = new Map<string, {
    totalQuantity: number;
    totalValue: number; // quantity * entryPrice
    symbol: string;
    dateTaken?: string;
    target1?: string;
    stopLoss?: string;
    tradeType?: string;
  }>();

  // Group by symbol and calculate weighted averages
  for (const row of rows) {
    const symbol = row.symbol.toUpperCase();
    const quantity = parseFloat(row.quantity);
    const entryPrice = parseFloat(row.entryPrice);
    const value = quantity * entryPrice;

    if (symbolMap.has(symbol)) {
      const existing = symbolMap.get(symbol)!;
      existing.totalQuantity += quantity;
      existing.totalValue += value;
    } else {
      symbolMap.set(symbol, {
        totalQuantity: quantity,
        totalValue: value,
        symbol: row.symbol,
        dateTaken: row.dateTaken,
        target1: row.target1,
        stopLoss: row.stopLoss,
        tradeType: row.tradeType,
      });
    }
  }

  // Convert back to CSVRow array with averaged prices
  const consolidated: CSVRow[] = [];
  for (const [symbol, data] of symbolMap.entries()) {
    const avgEntryPrice = data.totalValue / data.totalQuantity;
    consolidated.push({
      symbol: data.symbol,
      quantity: data.totalQuantity.toString(),
      entryPrice: avgEntryPrice.toFixed(2),
      dateTaken: data.dateTaken || '',
      target1: data.target1 || '',
      stopLoss: data.stopLoss || '',
      tradeType: data.tradeType,
    });
  }

  return consolidated;
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

  // Debug: Log header mapping
  console.log('📋 CSV Headers found:', header);
  console.log('🔄 Field mapping:', headerMapping);

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

    // Debug: Log row data
    console.log(`\n📝 Row ${rowNumber}:`, {
      symbol: row.symbol || '(empty)',
      isin: row.isin || '(empty)',
      quantity: row.quantity,
      entryPrice: row.entryPrice
    });

    // Validate symbol (with ISIN fallback)
    if (!row.symbol || row.symbol.trim() === '') {
      // If symbol is missing but ISIN is present, try to lookup symbol by ISIN
      if (row.isin) {
        console.log(`⚙️  Symbol missing for row ${rowNumber}, attempting ISIN lookup: ${row.isin}`);
        const symbolFromISIN = await lookupSymbolByISIN(row.isin, db);
        if (symbolFromISIN) {
          row.symbol = symbolFromISIN;
          console.log(`✅ Resolved symbol ${symbolFromISIN} from ISIN ${row.isin}`);
        } else {
          rowErrors.push({
            row: rowNumber,
            field: 'symbol',
            message: `Symbol is required. Could not find symbol for ISIN: ${row.isin}`
          });
        }
      } else {
        rowErrors.push({ row: rowNumber, field: 'symbol', message: 'Symbol is required' });
      }
    } else {
      // Try to validate the provided symbol
      const validatedSymbol = await validateSymbol(row.symbol, db);
      if (!validatedSymbol) {
        // Symbol validation failed - try ISIN fallback if available
        let resolvedSymbol = null;

        if (row.isin) {
          console.log(`⚙️  Symbol '${row.symbol}' invalid, attempting ISIN fallback: ${row.isin}`);
          resolvedSymbol = await lookupSymbolByISIN(row.isin, db);
          if (resolvedSymbol) {
            console.log(`✅ Resolved symbol '${resolvedSymbol}' using ISIN ${row.isin}`);
          }
        }

        // If ISIN lookup failed or no ISIN, the company name mapping already handled it in validateSymbol
        // So this error means both company name mapping and ISIN lookup failed
        if (!resolvedSymbol) {
          const isinInfo = row.isin ? ` ISIN lookup also failed for: ${row.isin}.` : '';
          rowErrors.push({
            row: rowNumber,
            field: 'symbol',
            message: `Invalid or unknown NSE symbol: '${row.symbol}'.${isinInfo} Please verify the symbol exists on NSE. If you have the full company name, ensure it's exactly: "BHARAT ELECTRONICS LTD", "GE POWER INDIA LIMITED", or "HINDALCO INDUSTRIES LTD".`
          });
        } else {
          row.symbol = resolvedSymbol;
        }
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

  // Consolidate duplicate symbols (sum quantities, average prices)
  const consolidatedRows = validRows.length > 0 ? consolidateDuplicateSymbols(validRows) : validRows;

  // Log consolidation info
  if (consolidatedRows.length < validRows.length) {
    console.log(`📊 Consolidated ${validRows.length} rows into ${consolidatedRows.length} unique symbols`);
  }

  return {
    success: errors.length === 0,
    validRows: consolidatedRows,
    errors,
    summary: {
      total: lines.length - 1,
      valid: consolidatedRows.length,
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
  const target = row.target1 ? parseFloat(row.target1) : entryPrice * 1.15; // +15%
  const stopLoss = row.stopLoss ? parseFloat(row.stopLoss) : entryPrice * 0.92; // -8%
  const entryDate = row.dateTaken || currentDate || formatTodayDate();

  return {
    symbol: row.symbol.toUpperCase(),
    direction: (row.tradeType || 'Long') as 'Long' | 'Short', // API expects 'direction' not 'tradeType'
    entryPrice,
    quantity,
    entryDate, // API expects 'entryDate' not 'dateTaken'
    target, // API expects 'target' not 'target1'
    stopLoss,
    notes: '', // Add empty notes field
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
