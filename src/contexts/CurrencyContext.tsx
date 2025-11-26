'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CurrencyContextType {
    currency: string;
    currencySymbol: string;
    exchangeRates: Record<string, number>;
    loading: boolean;
    updateCurrency: (newCurrency: string) => void;
    formatAmount: (amount: number, customCurrency?: string) => string;
    convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
    currencySymbols: Record<string, string>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
    const [currency, setCurrency] = useState('USD');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // Currency symbols mapping
    const currencySymbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹',
        JPY: '¥',
        AUD: 'A$',
        CAD: 'C$',
        CHF: 'CHF',
        CNY: '¥',
        SEK: 'kr',
        NZD: 'NZ$',
        MXN: 'MX$',
        SGD: 'S$',
        HKD: 'HK$',
        NOK: 'kr',
        KRW: '₩',
        TRY: '₺',
        RUB: '₽',
        BRL: 'R$',
        ZAR: 'R'
    };

    // Fetch exchange rates (optional)
    const fetchExchangeRates = async (baseCurrency = 'USD') => {
        try {
            setLoading(true);
            // You can use an API like exchangerate-api.com or fixer.io
            // For now we will mock some rates if API fails or just use 1 for base
            // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
            // const data = await response.json();
            // setExchangeRates(data.rates);

            // Mock rates for demo purposes relative to USD
            const mockRates: Record<string, number> = {
                USD: 1,
                EUR: 0.92,
                GBP: 0.79,
                INR: 83.5,
                JPY: 151.5,
                AUD: 1.52,
                CAD: 1.36
            };

            // If base is not USD, we'd need to recalculate, but for now let's just use these
            setExchangeRates(mockRates);

        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update currency in localStorage and state
    const updateCurrency = (newCurrency: string) => {
        setCurrency(newCurrency);
        localStorage.setItem('preferredCurrency', newCurrency);
        // Fetch new exchange rates when currency changes
        fetchExchangeRates(newCurrency);
    };

    // Format amount with current currency
    const formatAmount = (amount: number, customCurrency: string | null = null) => {
        const currentCurrency = customCurrency || currency;
        const symbol = currencySymbols[currentCurrency] || currentCurrency;

        // For now, we'll just add symbol. Later you can add conversion logic if needed
        // Note: This doesn't convert the value, just formats it with the symbol
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Convert amount between currencies
    const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
        if (fromCurrency === toCurrency) return amount;

        const rateFrom = exchangeRates[fromCurrency] || 1;
        const rateTo = exchangeRates[toCurrency] || 1;

        // Convert to USD first (assuming rates are based on USD), then to target currency
        // This logic depends on how rates are stored. If rates are based on 'baseCurrency', then:
        // amount / rateFrom * rateTo

        // Since our mock rates are USD based:
        const amountInUSD = amount / (exchangeRates[fromCurrency] || 1); // if fromCurrency is USD, rate is 1
        // Wait, if rates are "1 USD = X Currency", then:
        // 100 EUR -> ? USD. 1 USD = 0.92 EUR. So 1 EUR = 1/0.92 USD.
        // Amount in USD = Amount * (1/RateFrom)

        // Let's assume rates are "1 USD = X Target"
        // To convert From -> To:
        // From -> USD -> To
        // USD = From / RateFrom
        // To = USD * RateTo
        // So: To = (From / RateFrom) * RateTo

        const valInUsd = amount / (exchangeRates[fromCurrency] || 1);
        return valInUsd * (exchangeRates[toCurrency] || 1);
    };

    // Initialize currency from user preferences
    useEffect(() => {
        const savedCurrency = localStorage.getItem('preferredCurrency');
        if (savedCurrency) {
            setCurrency(savedCurrency);
            fetchExchangeRates(savedCurrency);
        } else {
            // Default to user's locale currency
            const userLocale = navigator.language || 'en-US';
            try {
                const localeCurrency = new Intl.NumberFormat(userLocale)
                    .resolvedOptions().currency || 'USD';
                setCurrency(localeCurrency);
                fetchExchangeRates(localeCurrency);
            } catch (e) {
                setCurrency('USD');
                fetchExchangeRates('USD');
            }
        }
    }, []);

    const value = {
        currency,
        currencySymbol: currencySymbols[currency] || currency,
        exchangeRates,
        loading,
        updateCurrency,
        formatAmount,
        convertAmount,
        currencySymbols
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
