import { lookupSymbolByISIN } from '@/lib/csvImport';

describe('User ISINs - From Error Screenshot', () => {
  it('should find AXISBANK by ISIN INE238A01034', async () => {
    const symbol = await lookupSymbolByISIN('INE238A01034', null);
    expect(symbol).toBe('AXISBANK');
  });

  it('should find BALKRISIND by ISIN INE787D01026', async () => {
    const symbol = await lookupSymbolByISIN('INE787D01026', null);
    expect(symbol).toBe('BALKRISIND');
  });

  it('should find BEL by ISIN INE838A01024', async () => {
    const symbol = await lookupSymbolByISIN('INE838A01024', null);
    expect(symbol).toBe('BEL');
  });

  it('should find CEATLTD by ISIN INE482A01020', async () => {
    const symbol = await lookupSymbolByISIN('INE482A01020', null);
    expect(symbol).toBe('CEATLTD');
  });

  it('should find CDSL by ISIN INE736A01011', async () => {
    const symbol = await lookupSymbolByISIN('INE736A01011', null);
    expect(symbol).toBe('CDSL');
  });

  it('should show all new ISINs added', async () => {
    const userISINs = [
      { isin: 'INE238A01034', expected: 'AXISBANK' },
      { isin: 'INE787D01026', expected: 'BALKRISIND' },
      { isin: 'INE838A01024', expected: 'BEL' },
      { isin: 'INE482A01020', expected: 'CEATLTD' },
      { isin: 'INE736A01011', expected: 'CDSL' },
    ];

    console.log('\n✅ New ISINs Added:');
    for (const { isin, expected } of userISINs) {
      const symbol = await lookupSymbolByISIN(isin, null);
      console.log(`  ${isin} → ${symbol || 'NOT FOUND'} (expected: ${expected})`);
      expect(symbol).toBe(expected);
    }
  });
});
