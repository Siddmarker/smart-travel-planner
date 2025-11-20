import { Currency } from '@/types';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_KEY = 'exchange_rates_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ExchangeRateCache {
    rates: { [key: string]: number };
    timestamp: number;
    baseCurrency: string;
}

export async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<{ [key: string]: number }> {
    try {
        // Check cache first
        const cached = getCachedRates(baseCurrency);
        if (cached) {
            return cached;
        }

        // Fetch fresh rates
        const response = await fetch(`${EXCHANGE_RATE_API}/${baseCurrency}`);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();
        const rates = data.rates;

        // Cache the rates
        cacheRates(baseCurrency, rates);

        return rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return fallback rates
        return getFallbackRates();
    }
}

function getCachedRates(baseCurrency: string): { [key: string]: number } | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: ExchangeRateCache = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid and for the same base currency
        if (data.baseCurrency === baseCurrency && now - data.timestamp < CACHE_DURATION) {
            return data.rates;
        }

        return null;
    } catch {
        return null;
    }
}

function cacheRates(baseCurrency: string, rates: { [key: string]: number }): void {
    if (typeof window === 'undefined') return;

    try {
        const cache: ExchangeRateCache = {
            rates,
            timestamp: Date.now(),
            baseCurrency,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error caching rates:', error);
    }
}

function getFallbackRates(): { [key: string]: number } {
    // Fallback rates (static, as backup)
    return {
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CAD: 1.36,
        AUD: 1.53,
        CHF: 0.88,
        CNY: 7.24,
        INR: 83.12,
    };
}

export function getLastUpdateTime(): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: ExchangeRateCache = JSON.parse(cached);
        return new Date(data.timestamp).toLocaleString();
    } catch {
        return null;
    }
}

export function clearRatesCache(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CACHE_KEY);
}
