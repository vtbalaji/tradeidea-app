import { lookupSymbolByISIN, parseAndValidateCSV } from '@/lib/csvImport';

describe('CSV Import - ISIN Fallback', () => {
  describe('lookupSymbolByISIN', () => {
    it('should find symbol by valid ISIN', async () => {
      const symbol = await lookupSymbolByISIN('INE002A01018', null);
      expect(symbol).toBe('RELIANCE');
    });

    it('should find TCS by ISIN', async () => {
      const symbol = await lookupSymbolByISIN('INE467B01029', null);
      expect(symbol).toBe('TCS');
    });

    it('should find HDFC Bank by ISIN', async () => {
      const symbol = await lookupSymbolByISIN('INE040A01034', null);
      expect(symbol).toBe('HDFCBANK');
    });

    it('should return null for invalid ISIN format', async () => {
      const symbol = await lookupSymbolByISIN('INVALID', null);
      expect(symbol).toBeNull();
    });

    it('should return null for unknown ISIN', async () => {
      const symbol = await lookupSymbolByISIN('IN0000000000', null);
      expect(symbol).toBeNull();
    });

    it('should handle case-insensitive ISIN', async () => {
      const symbol = await lookupSymbolByISIN('ine002a01018', null);
      expect(symbol).toBe('RELIANCE');
    });

    it('should validate ISIN format (12 characters)', async () => {
      const shortISIN = await lookupSymbolByISIN('INE002A', null);
      expect(shortISIN).toBeNull();
    });
  });

  describe('CSV Import with ISIN Fallback', () => {
    it('should use ISIN when symbol is invalid', async () => {
      const csvWithISIN = `symbol,ISIN,quantity,entryPrice
WRONGSYMBOL,INE002A01018,10,2500`;

      const result = await parseAndValidateCSV(csvWithISIN, null);

      // Should successfully resolve RELIANCE from ISIN
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].symbol).toBe('RELIANCE');
      expect(result.errors).toHaveLength(0);
    });

    it('should use ISIN when symbol is missing', async () => {
      const csvWithISIN = `symbol,ISIN,quantity,entryPrice
,INE467B01029,5,3500`;

      const result = await parseAndValidateCSV(csvWithISIN, null);

      // Should successfully resolve TCS from ISIN
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].symbol).toBe('TCS');
    });

    it('should fail when both symbol and ISIN are invalid', async () => {
      const csvWithBadData = `symbol,ISIN,quantity,entryPrice
BADSYMBOL,IN0000000000,10,2500`;

      const result = await parseAndValidateCSV(csvWithBadData, null);

      expect(result.validRows).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('symbol');
    });

    it('should process multiple rows with ISIN fallback', async () => {
      const csv = `symbol,ISIN,quantity,entryPrice
RELIANCE,INE002A01018,10,2500
WRONGSYM,INE467B01029,5,3500
HDFCBANK,INE040A01034,3,1600`;

      const result = await parseAndValidateCSV(csv, null);

      expect(result.validRows).toHaveLength(3);
      expect(result.validRows[0].symbol).toBe('RELIANCE');
      expect(result.validRows[1].symbol).toBe('TCS'); // Corrected from WRONGSYM
      expect(result.validRows[2].symbol).toBe('HDFCBANK');
    });

    it('should work with real broker CSV format (ICICI with ISIN)', async () => {
      const iciciCSV = `Stock Symbol,ISIN,Qty,Average Cost Price
RELIND,INE002A01018,10,2500.00
UNKNOWN,INE467B01029,5,3500.00`;

      const result = await parseAndValidateCSV(iciciCSV, null);

      // RELIND gets mapped to RELIANCE via ICICI mapping
      // UNKNOWN gets resolved via ISIN to TCS
      expect(result.validRows).toHaveLength(2);
      expect(result.validRows[0].symbol).toBe('RELIANCE');
      expect(result.validRows[1].symbol).toBe('TCS');
    });

    it('should prefer valid symbol over ISIN', async () => {
      const csv = `symbol,ISIN,quantity,entryPrice
TCS,INE002A01018,10,2500`;

      const result = await parseAndValidateCSV(csv, null);

      // TCS is valid, so it should use TCS, not lookup ISIN (which would give RELIANCE)
      expect(result.validRows).toHaveLength(1);
      expect(result.validRows[0].symbol).toBe('TCS');
    });
  });

  describe('ISIN Coverage Statistics', () => {
    it('should show which symbols have ISIN numbers', async () => {
      const symbolsWithISIN = [
        'INE002A01018', // RELIANCE
        'INE467B01029', // TCS
        'INE040A01034', // HDFCBANK
        'INE009A01021', // INFY
        'INE090A01021', // ICICIBANK
      ];

      const results = await Promise.all(
        symbolsWithISIN.map(isin => lookupSymbolByISIN(isin, null))
      );

      const found = results.filter(s => s !== null);

      console.log(`\n📊 ISIN Lookup Results:`);
      symbolsWithISIN.forEach((isin, i) => {
        const status = results[i] ? '✅' : '❌';
        console.log(`${status} ${isin}: ${results[i] || 'Not Found'}`);
      });

      expect(found.length).toBeGreaterThan(0);
      expect(found).toContain('RELIANCE');
      expect(found).toContain('TCS');
    });
  });
});
