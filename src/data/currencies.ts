import { Currency } from '@/types';

export const currencies: Currency[] = [
    {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        flag: '🇺🇸',
        rate: 1.0,
    },
    {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        flag: '🇪🇺',
        rate: 0.92,
    },
    {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        flag: '🇬🇧',
        rate: 0.79,
    },
    {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        flag: '🇯🇵',
        rate: 149.50,
    },
    {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        flag: '🇨🇦',
        rate: 1.36,
    },
    {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        flag: '🇦🇺',
        rate: 1.53,
    },
    {
        code: 'CHF',
        name: 'Swiss Franc',
        symbol: 'CHF',
        flag: '🇨🇭',
        rate: 0.88,
    },
    {
        code: 'CNY',
        name: 'Chinese Yuan',
        symbol: '¥',
        flag: '🇨🇳',
        rate: 7.24,
    },
    {
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        flag: '🇮🇳',
        rate: 83.12,
    },
];

export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
    const fromCurrency = currencies.find(c => c.code === fromCode);
    const toCurrency = currencies.find(c => c.code === toCode);

    if (!fromCurrency || !toCurrency) return amount;

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromCurrency.rate;
    return usdAmount * toCurrency.rate;
}

export function formatCurrency(amount: number, currencyCode: string, format: 'symbol' | 'code' = 'symbol'): string {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return `${amount.toFixed(2)}`;

    const formatted = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    if (format === 'symbol') {
        return `${currency.symbol}${formatted}`;
    } else {
        return `${formatted} ${currency.code}`;
    }
}
