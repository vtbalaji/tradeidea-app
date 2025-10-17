// Master symbol data for Indian stocks
export interface Symbol {
  id: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  industry: string;
  marketCap?: number;
  currency: string;
  isin?: string;
  isActive: boolean;
}

// Sample symbols - You can load this into Firestore or use as fallback
export const INDIAN_STOCKS: Symbol[] = [
  {
    id: 'RELIANCE',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    exchange: 'NSE',
    sector: 'Energy',
    industry: 'Oil & Gas Refining',
    marketCap: 1750000000000,
    currency: 'INR',
    isin: 'INE002A01018',
    isActive: true
  },
  {
    id: 'TCS',
    symbol: 'TCS',
    name: 'Tata Consultancy Services Limited',
    exchange: 'NSE',
    sector: 'Technology',
    industry: 'IT Services & Consulting',
    marketCap: 1400000000000,
    currency: 'INR',
    isin: 'INE467B01029',
    isActive: true
  },
  {
    id: 'HDFCBANK',
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Private Sector Bank',
    marketCap: 1200000000000,
    currency: 'INR',
    isin: 'INE040A01034',
    isActive: true
  },
  {
    id: 'INFY',
    symbol: 'INFY',
    name: 'Infosys Limited',
    exchange: 'NSE',
    sector: 'Technology',
    industry: 'IT Services & Consulting',
    marketCap: 750000000000,
    currency: 'INR',
    isin: 'INE009A01021',
    isActive: true
  },
  {
    id: 'ICICIBANK',
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Private Sector Bank',
    marketCap: 850000000000,
    currency: 'INR',
    isin: 'INE090A01021',
    isActive: true
  },
  {
    id: 'HINDUNILVR',
    symbol: 'HINDUNILVR',
    name: 'Hindustan Unilever Limited',
    exchange: 'NSE',
    sector: 'Consumer Goods',
    industry: 'FMCG',
    marketCap: 600000000000,
    currency: 'INR',
    isin: 'INE030A01027',
    isActive: true
  },
  {
    id: 'ITC',
    symbol: 'ITC',
    name: 'ITC Limited',
    exchange: 'NSE',
    sector: 'Consumer Goods',
    industry: 'Diversified',
    marketCap: 550000000000,
    currency: 'INR',
    isin: 'INE154A01025',
    isActive: true
  },
  {
    id: 'SBIN',
    symbol: 'SBIN',
    name: 'State Bank of India',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Public Sector Bank',
    marketCap: 650000000000,
    currency: 'INR',
    isin: 'INE062A01020',
    isActive: true
  },
  {
    id: 'BHARTIARTL',
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Limited',
    exchange: 'NSE',
    sector: 'Telecommunication',
    industry: 'Telecom Services',
    marketCap: 500000000000,
    currency: 'INR',
    isin: 'INE397D01024',
    isActive: true
  },
  {
    id: 'KOTAKBANK',
    symbol: 'KOTAKBANK',
    name: 'Kotak Mahindra Bank Limited',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Private Sector Bank',
    marketCap: 400000000000,
    currency: 'INR',
    isin: 'INE237A01028',
    isActive: true
  },
  {
    id: 'LT',
    symbol: 'LT',
    name: 'Larsen & Toubro Limited',
    exchange: 'NSE',
    sector: 'Infrastructure',
    industry: 'Construction & Engineering',
    marketCap: 450000000000,
    currency: 'INR',
    isin: 'INE018A01030',
    isActive: true
  },
  {
    id: 'ASIANPAINT',
    symbol: 'ASIANPAINT',
    name: 'Asian Paints Limited',
    exchange: 'NSE',
    sector: 'Consumer Goods',
    industry: 'Paints',
    marketCap: 350000000000,
    currency: 'INR',
    isin: 'INE021A01026',
    isActive: true
  },
  {
    id: 'MARUTI',
    symbol: 'MARUTI',
    name: 'Maruti Suzuki India Limited',
    exchange: 'NSE',
    sector: 'Automobile',
    industry: 'Passenger Vehicles',
    marketCap: 380000000000,
    currency: 'INR',
    isin: 'INE585B01010',
    isActive: true
  },
  {
    id: 'WIPRO',
    symbol: 'WIPRO',
    name: 'Wipro Limited',
    exchange: 'NSE',
    sector: 'Technology',
    industry: 'IT Services & Consulting',
    marketCap: 300000000000,
    currency: 'INR',
    isin: 'INE075A01022',
    isActive: true
  },
  {
    id: 'ADANIENT',
    symbol: 'ADANIENT',
    name: 'Adani Enterprises Limited',
    exchange: 'NSE',
    sector: 'Diversified',
    industry: 'Trading',
    marketCap: 320000000000,
    currency: 'INR',
    isin: 'INE423A01024',
    isActive: true
  },
  {
    id: 'AXISBANK',
    symbol: 'AXISBANK',
    name: 'Axis Bank Limited',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Private Sector Bank',
    marketCap: 400000000000,
    currency: 'INR',
    isin: 'INE238A01034',
    isActive: true
  },
  {
    id: 'BALKRISIND',
    symbol: 'BALKRISIND',
    name: 'Balkrishna Industries Limited',
    exchange: 'NSE',
    sector: 'Automobile',
    industry: 'Tyres',
    marketCap: 50000000000,
    currency: 'INR',
    isin: 'INE787D01026',
    isActive: true
  },
  {
    id: 'BEL',
    symbol: 'BEL',
    name: 'Bharat Electronics Limited',
    exchange: 'NSE',
    sector: 'Defence',
    industry: 'Electronics',
    marketCap: 180000000000,
    currency: 'INR',
    isin: 'INE838A01024',
    isActive: true
  },
  {
    id: 'CEATLTD',
    symbol: 'CEATLTD',
    name: 'CEAT Limited',
    exchange: 'NSE',
    sector: 'Automobile',
    industry: 'Tyres',
    marketCap: 30000000000,
    currency: 'INR',
    isin: 'INE482A01020',
    isActive: true
  },
  {
    id: 'CENTRALBK',
    symbol: 'CENTRALBK',
    name: 'Central Bank of India',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Public Sector Bank',
    marketCap: 25000000000,
    currency: 'INR',
    isin: 'INE483A01010',
    isActive: true
  },
  {
    id: 'CDSL',
    symbol: 'CDSL',
    name: 'Central Depository Services Limited',
    exchange: 'NSE',
    sector: 'Financial Services',
    industry: 'Depository',
    marketCap: 40000000000,
    currency: 'INR',
    isin: 'INE736A01011',
    isActive: true
  }
];

// Helper function to search symbols
export function searchSymbols(query: string, limit: number = 10): Symbol[] {
  const searchTerm = query.toLowerCase();
  return INDIAN_STOCKS
    .filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    )
    .slice(0, limit);
}

// Helper function to get symbol by ID
export function getSymbol(symbolId: string): Symbol | undefined {
  return INDIAN_STOCKS.find(stock => stock.symbol === symbolId);
}
