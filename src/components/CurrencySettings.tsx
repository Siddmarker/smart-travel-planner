'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CurrencySettings() {
    const { currency, updateCurrency, currencySymbols } = useCurrency();

    const popularCurrencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' }
    ];

    const handleCurrencyChange = (value: string) => {
        updateCurrency(value);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    💰 Currency Preferences
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="currencySelect" className="text-sm font-medium">Display Currency</label>
                    <Select value={currency} onValueChange={handleCurrencyChange}>
                        <SelectTrigger id="currencySelect" className="w-full">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            {popularCurrencies.map(currencyOption => (
                                <SelectItem key={currencyOption.code} value={currencyOption.code}>
                                    {currencyOption.symbol} {currencyOption.name} ({currencyOption.code})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    <p><strong>Current Display:</strong> {currencySymbols[currency] || currency} 100.00</p>
                    <p className="text-xs mt-1">All amounts will be shown in {currency}</p>
                </div>
            </CardContent>
        </Card>
    );
}
