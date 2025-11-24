'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface FilterOption {
    label: string;
    value: string | number;
}

interface FilterConfig {
    type: 'radio' | 'checkbox' | 'dropdown' | 'slider';
    label: string;
    options?: FilterOption[];
    min?: number;
    max?: number;
    step?: number;
}

const dynamicFilters: Record<string, Record<string, FilterConfig>> = {
    'food': {
        'price': {
            type: 'radio',
            label: 'Price Level',
            options: [
                { label: 'Any', value: 'any' },
                { label: '$ Budget', value: 1 },
                { label: '$$ Moderate', value: 2 },
                { label: '$$$ Expensive', value: 3 },
                { label: '$$$$ Luxury', value: 4 }
            ]
        },
        'rating': {
            type: 'radio',
            label: 'Minimum Rating',
            options: [
                { label: 'Any', value: 0 },
                { label: '3.5+', value: 3.5 },
                { label: '4.0+', value: 4.0 },
                { label: '4.5+', value: 4.5 }
            ]
        },
        'dietary': {
            type: 'checkbox',
            label: 'Dietary Preferences',
            options: [
                { label: 'Vegetarian', value: 'vegetarian' },
                { label: 'Vegan', value: 'vegan' },
                { label: 'Gluten-Free', value: 'gluten_free' }
            ]
        }
    },
    'hiking': {
        'difficulty': {
            type: 'radio',
            label: 'Difficulty',
            options: [
                { label: 'Any', value: 'any' },
                { label: 'Easy', value: 'easy' },
                { label: 'Moderate', value: 'moderate' },
                { label: 'Difficult', value: 'difficult' }
            ]
        },
        'duration': {
            type: 'radio',
            label: 'Duration',
            options: [
                { label: 'Any', value: 'any' },
                { label: '< 2 hours', value: 'short' },
                { label: '2-4 hours', value: 'medium' },
                { label: '4+ hours', value: 'long' }
            ]
        }
    },
    'nature': {
        'type': {
            type: 'radio',
            label: 'Type',
            options: [
                { label: 'Any', value: 'any' },
                { label: 'Park', value: 'park' },
                { label: 'Forest', value: 'forest' },
                { label: 'Beach', value: 'beach' },
                { label: 'Mountain', value: 'mountain' }
            ]
        }
    },
    'shopping': {
        'type': {
            type: 'radio',
            label: 'Type',
            options: [
                { label: 'Any', value: 'any' },
                { label: 'Mall', value: 'mall' },
                { label: 'Boutique', value: 'boutique' },
                { label: 'Market', value: 'market' }
            ]
        }
    }
};

interface AdvancedFiltersProps {
    category: string;
    onFilterChange: (filters: Record<string, any>) => void;
}

export function AdvancedFilters({ category, onFilterChange }: AdvancedFiltersProps) {
    const [filters, setFilters] = useState<Record<string, any>>({});

    // Reset filters when category changes
    useEffect(() => {
        setFilters({});
        onFilterChange({});
    }, [category]);

    const handleFilterUpdate = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleCheckboxUpdate = (key: string, value: string, checked: boolean) => {
        const currentValues = (filters[key] as string[]) || [];
        let newValues;
        if (checked) {
            newValues = [...currentValues, value];
        } else {
            newValues = currentValues.filter(v => v !== value);
        }
        handleFilterUpdate(key, newValues);
    };

    const config = dynamicFilters[category];

    if (!config) return null;

    return (
        <div className="bg-secondary/20 p-4 rounded-lg border mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    🔍 Refine {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setFilters({});
                        onFilterChange({});
                    }}
                    className="h-8 text-muted-foreground hover:text-foreground"
                >
                    Reset
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(config).map(([key, filter]) => (
                    <div key={key} className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">{filter.label}</Label>

                        {filter.type === 'radio' && filter.options && (
                            <RadioGroup
                                value={filters[key]?.toString() || filter.options[0].value.toString()}
                                onValueChange={(val) => handleFilterUpdate(key, val)}
                                className="flex flex-col gap-2"
                            >
                                {filter.options.map((opt) => (
                                    <div key={opt.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt.value.toString()} id={`${key}-${opt.value}`} />
                                        <Label htmlFor={`${key}-${opt.value}`} className="font-normal cursor-pointer">
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}

                        {filter.type === 'checkbox' && filter.options && (
                            <div className="flex flex-col gap-2">
                                {filter.options.map((opt) => (
                                    <div key={opt.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`${key}-${opt.value}`}
                                            checked={(filters[key] as string[])?.includes(opt.value.toString())}
                                            onCheckedChange={(checked) => handleCheckboxUpdate(key, opt.value.toString(), checked as boolean)}
                                        />
                                        <Label htmlFor={`${key}-${opt.value}`} className="font-normal cursor-pointer">
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Dropdown/Slider support if needed later */}
                    </div>
                ))}
            </div>
        </div>
    );
}
