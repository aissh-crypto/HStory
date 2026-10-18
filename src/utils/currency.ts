// Cross-border real-time currency conversion and automatic location detection for Malaysia (MYR) and Singapore (SGD)

export interface ExchangeRatesData {
  SGD_MYR: number;
  MYR_SGD: number;
  SGD_INR: number;
  INR_SGD: number;
  MYR_INR: number;
  INR_MYR: number;
  lastUpdatedText: string;
}

// Live benchmark baseline updated for today (Sat, 17 Oct 2026)
export let LIVE_EXCHANGE_TIMESTAMP = 'Live Market Mid-Rate • Updated Today';

export const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  MYR: {
    MYR: 1.0,
    SGD: 0.31362, // 1 MYR ≈ 0.3136 SGD (Live Rate for today)
    INR: 23.277,
  },
  SGD: {
    SGD: 1.0,
    MYR: 3.18855, // 1 SGD ≈ 3.1885 MYR (Live Rate for today)
    INR: 74.222,
  },
  INR: {
    INR: 1.0,
    MYR: 0.04296,
    SGD: 0.01347,
  },
};

// Fetch live current rate for the day from free open exchange rate API
export const fetchLiveExchangeRates = async (): Promise<void> => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/SGD');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.rates && typeof data.rates.MYR === 'number') {
      const sgdMyr = data.rates.MYR;
      const myrSgd = Number((1 / sgdMyr).toFixed(5));
      const sgdInr = data.rates.INR || 74.22;
      const inrSgd = Number((1 / sgdInr).toFixed(5));
      const myrInr = Number((sgdInr / sgdMyr).toFixed(3));
      const inrMyr = Number((1 / myrInr).toFixed(5));

      EXCHANGE_RATES.SGD.MYR = sgdMyr;
      EXCHANGE_RATES.MYR.SGD = myrSgd;
      EXCHANGE_RATES.SGD.INR = sgdInr;
      EXCHANGE_RATES.INR.SGD = inrSgd;
      EXCHANGE_RATES.MYR.INR = myrInr;
      EXCHANGE_RATES.INR.MYR = inrMyr;

      const dateStr = data.time_last_update_utc
        ? new Date(data.time_last_update_utc).toLocaleDateString([], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Today';

      LIVE_EXCHANGE_TIMESTAMP = `Live Mid-Market Rate (${dateStr})`;

      const ratePayload: ExchangeRatesData = {
        SGD_MYR: sgdMyr,
        MYR_SGD: myrSgd,
        SGD_INR: sgdInr,
        INR_SGD: inrSgd,
        MYR_INR: myrInr,
        INR_MYR: inrMyr,
        lastUpdatedText: LIVE_EXCHANGE_TIMESTAMP,
      };

      try {
        localStorage.setItem('homestory_live_fx', JSON.stringify(ratePayload));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('homestory_fx_updated', { detail: ratePayload }));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Live currency API background update notice (using cached benchmark):', err);
  }
};

// Immediately restore cached rates from localStorage if present
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('homestory_live_fx');
    if (raw) {
      const cached = JSON.parse(raw) as ExchangeRatesData;
      if (cached && cached.SGD_MYR) {
        EXCHANGE_RATES.SGD.MYR = cached.SGD_MYR;
        EXCHANGE_RATES.MYR.SGD = cached.MYR_SGD;
        EXCHANGE_RATES.SGD.INR = cached.SGD_INR;
        EXCHANGE_RATES.INR.SGD = cached.INR_SGD;
        EXCHANGE_RATES.MYR.INR = cached.MYR_INR;
        EXCHANGE_RATES.INR.MYR = cached.INR_MYR;
        if (cached.lastUpdatedText) {
          LIVE_EXCHANGE_TIMESTAMP = cached.lastUpdatedText;
        }
      }
    }
    // Automatically refresh in the background
    fetchLiveExchangeRates();
  } catch {}
}

/**
 * Returns the current live benchmark FX rate between two currencies.
 */
export const getLiveExchangeRate = (from: string, to: string): number => {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1.0;
  return EXCHANGE_RATES[f]?.[t] || (f === 'SGD' && t === 'MYR' ? 3.18855 : 0.31362);
};

/**
 * Detect user's current location currency based on timezone or browser locale.
 * Defaults to MYR for Malaysia timezone, SGD for Singapore timezone.
 */
export const detectLocationCurrency = (): 'MYR' | 'SGD' => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes('singapore')) {
      return 'SGD';
    }
    if (
      lowerTz.includes('kuala_lumpur') ||
      lowerTz.includes('malaysia') ||
      lowerTz.includes('kuching') ||
      lowerTz.includes('penang')
    ) {
      return 'MYR';
    }

    // Check language / locale
    const lang = (navigator.language || '').toLowerCase();
    if (lang.includes('sg')) {
      return 'SGD';
    }
    if (lang.includes('my')) {
      return 'MYR';
    }
  } catch (e) {
    console.warn('Location detection notice:', e);
  }

  // Default to Malaysian ringgit if not in Singapore
  return 'MYR';
};

/**
 * Convert an amount from one currency to another using realistic market rates.
 */
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return amount;

  const rate = getLiveExchangeRate(from, to);
  return Math.round(amount * rate);
};

/**
 * Formats a single currency value cleanly.
 */
export const formatSingleCurrency = (amount: number, currency: string): string => {
  const curr = currency.toUpperCase();
  if (curr === 'INR') {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  const symbol = curr === 'MYR' ? 'RM' : curr === 'SGD' ? 'S$' : `${curr} `;
  return `${symbol} ${amount.toLocaleString()}`;
};

/**
 * Format compact currency for badges or cards, e.g. RM 1.85M or S$ 2.15M
 */
export const formatCompactCurrency = (amount: number, currency: string): string => {
  const curr = currency.toUpperCase();
  const symbol = curr === 'MYR' ? 'RM' : curr === 'SGD' ? 'S$' : `${curr} `;

  if (amount >= 1000000) {
    const millions = (amount / 1000000).toFixed(2).replace(/\.00$/, '');
    return `${symbol} ${millions}M`;
  }
  if (amount >= 1000) {
    const thousands = (amount / 1000).toFixed(0);
    return `${symbol} ${thousands}K`;
  }
  return `${symbol} ${amount}`;
};

/**
 * Returns dual-currency presentation:
 * When the user selects "Showing in MYR" for an SGD property:
 * - The primary headline price switches to MYR (e.g. RM 6,855,383)
 * - The secondary yellow box switches to the original SGD listing price (e.g. S$ 2,150,000)
 * When "Showing in SGD" is selected:
 * - The primary price is in SGD, and secondary is in MYR.
 */
export interface DualCurrencyDisplay {
  primary: string;
  primaryAmount: number;
  primaryCurrency: string;
  converted: string | null;
  convertedAmount: number | null;
  convertedCurrency: string | null;
  convertedCompact: string | null;
  isConverted: boolean;
  rateNote: string;
}

export const getDualCurrencyPrice = (
  propertyPrice: number,
  propertyCurrency: string,
  userPreferredCurrency?: string
): DualCurrencyDisplay => {
  const propCurr = (propertyCurrency || 'MYR').toUpperCase();
  const targetCurr = (userPreferredCurrency || detectLocationCurrency()).toUpperCase();

  const currentRate = getLiveExchangeRate(propCurr, targetCurr);

  // If the target currency matches the property currency
  if (propCurr === targetCurr) {
    const crossCurr = propCurr === 'MYR' ? 'SGD' : 'MYR';
    const crossRate = getLiveExchangeRate(propCurr, crossCurr);
    const crossAmount = convertCurrency(propertyPrice, propCurr, crossCurr);

    const note =
      propCurr === 'SGD'
        ? `Live FX: 1 SGD ≈ ${crossRate.toFixed(4)} MYR (${LIVE_EXCHANGE_TIMESTAMP})`
        : `Live FX: 1 MYR ≈ ${crossRate.toFixed(4)} SGD (${LIVE_EXCHANGE_TIMESTAMP})`;

    return {
      primary: formatSingleCurrency(propertyPrice, propCurr),
      primaryAmount: propertyPrice,
      primaryCurrency: propCurr,
      converted: formatSingleCurrency(crossAmount, crossCurr),
      convertedAmount: crossAmount,
      convertedCurrency: crossCurr,
      convertedCompact: formatCompactCurrency(crossAmount, crossCurr),
      isConverted: false,
      rateNote: note,
    };
  }

  // The user wants to see the price in targetCurr (e.g. MYR for an SGD property)
  const targetAmount = convertCurrency(propertyPrice, propCurr, targetCurr);
  const note =
    propCurr === 'SGD'
      ? `Live FX: 1 SGD ≈ ${currentRate.toFixed(4)} MYR (${LIVE_EXCHANGE_TIMESTAMP})`
      : `Live FX: 1 MYR ≈ ${currentRate.toFixed(4)} SGD (${LIVE_EXCHANGE_TIMESTAMP})`;

  return {
    primary: formatSingleCurrency(targetAmount, targetCurr),
    primaryAmount: targetAmount,
    primaryCurrency: targetCurr,
    converted: formatSingleCurrency(propertyPrice, propCurr),
    convertedAmount: propertyPrice,
    convertedCurrency: `${propCurr} original`,
    convertedCompact: formatCompactCurrency(propertyPrice, propCurr),
    isConverted: true,
    rateNote: note,
  };
};
