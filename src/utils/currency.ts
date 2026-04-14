// Approximate USD exchange rates by country code
// Rates are approximate and for display purposes only
const COUNTRY_RATES: Record<string, { code: string; symbol: string; rate: number }> = {
  CL: { code: 'CLP', symbol: '$', rate: 950 },
  MX: { code: 'MXN', symbol: '$', rate: 17.5 },
  CO: { code: 'COP', symbol: '$', rate: 4200 },
  PE: { code: 'PEN', symbol: 'S/', rate: 3.75 },
  AR: { code: 'ARS', symbol: '$', rate: 900 },
  BR: { code: 'BRL', symbol: 'R$', rate: 5.1 },
  EC: { code: 'USD', symbol: '$', rate: 1 },
  UY: { code: 'UYU', symbol: '$', rate: 40 },
  PY: { code: 'PYG', symbol: '₲', rate: 7500 },
  BO: { code: 'BOB', symbol: 'Bs', rate: 6.9 },
  VE: { code: 'USD', symbol: '$', rate: 1 },
  CR: { code: 'CRC', symbol: '₡', rate: 530 },
  PA: { code: 'USD', symbol: '$', rate: 1 },
  DO: { code: 'DOP', symbol: 'RD$', rate: 58 },
  GT: { code: 'GTQ', symbol: 'Q', rate: 7.8 },
  HN: { code: 'HNL', symbol: 'L', rate: 25 },
  SV: { code: 'USD', symbol: '$', rate: 1 },
  NI: { code: 'NIO', symbol: 'C$', rate: 37 },
  US: { code: 'USD', symbol: '$', rate: 1 },
  CA: { code: 'CAD', symbol: 'CA$', rate: 1.37 },
  GB: { code: 'GBP', symbol: '£', rate: 0.79 },
  ES: { code: 'EUR', symbol: '€', rate: 0.92 },
  DE: { code: 'EUR', symbol: '€', rate: 0.92 },
  FR: { code: 'EUR', symbol: '€', rate: 0.92 },
  IT: { code: 'EUR', symbol: '€', rate: 0.92 },
  PT: { code: 'EUR', symbol: '€', rate: 0.92 },
  JP: { code: 'JPY', symbol: '¥', rate: 155 },
  KR: { code: 'KRW', symbol: '₩', rate: 1350 },
  AU: { code: 'AUD', symbol: 'A$', rate: 1.55 },
  IN: { code: 'INR', symbol: '₹', rate: 83.5 },
};

const DEFAULT_CURRENCY = { code: 'USD', symbol: '$', rate: 1 };

export function getCurrencyForCountry(countryCode: string) {
  return COUNTRY_RATES[countryCode] || DEFAULT_CURRENCY;
}

export function formatUsdToLocal(usd: number, countryCode: string): string {
  const curr = getCurrencyForCountry(countryCode);
  const local = Math.round(usd * curr.rate);
  return `${curr.symbol}${local.toLocaleString()} ${curr.code}`;
}

export function formatPriceDisplay(
  usd: number,
  countryCode: string
): { usdText: string; localText: string | null } {
  const curr = getCurrencyForCountry(countryCode);
  const usdText = `$${usd} USD`;
  if (curr.code === 'USD') return { usdText, localText: null };
  const local = Math.round(usd * curr.rate);
  const localText = `${curr.symbol}${local.toLocaleString()} ${curr.code}`;
  return { usdText, localText };
}
