'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        'dietary': {
            type: 'checkbox',
            label: 'Dietary Preferences',
            options: [
                { label: 'Vegetarian', value: 'Vegetarian' },
                { label: 'Non-Vegetarian', value: 'Non-Vegetarian' },
                { label: 'Eggetarian', value: 'Eggetarian' },
                { label: 'Jain (No root veggies)', value: 'Jain' },
                { label: 'Vegan', value: 'Vegan' },
                { label: 'Gluten-Free', value: 'Gluten-Free' },
                { label: 'Halal', value: 'Halal' },
                { label: 'Keto-Friendly', value: 'Keto' }
            ]
        },
        'establishmentType': {
            type: 'checkbox', // Changed to checkbox for multiple selection
            label: 'Establishment Type',
            options: [
                { label: 'Famous Local', value: 'Famous Local' },
                { label: 'International Chain', value: 'International Chain' },
                { label: 'Street Food', value: 'Street Food' },
                { label: 'Cafés & Bakeries', value: 'Cafe' },
                { label: 'Fine Dining', value: 'Fine Dining' },
                { label: 'Budget Eatery', value: 'Budget' },
                { label: 'Food Truck', value: 'Food Truck' },
                { label: 'Rooftop/Restobar', value: 'Rooftop' }
            ]
        },
        'trending': {
            type: 'checkbox',
            label: 'Trending & Social',
            options: [
                { label: 'Social Media Trending', value: 'Trending' },
                { label: 'Blogger Recommended', value: 'Blogger' },
                { label: 'Celebrity Visited', value: 'Celebrity' },
                { label: 'Viral Dishes', value: 'Viral' },
                { label: 'Newly Opened', value: 'New' }
            ]
        },
        'cuisine': {
            type: 'checkbox',
            label: 'Cuisine Type',
            options: [
                { label: 'North Indian', value: 'North Indian' },
                { label: 'South Indian', value: 'South Indian' },
                { label: 'Chinese', value: 'Chinese' },
                { label: 'Italian', value: 'Italian' },
                { label: 'Mexican', value: 'Mexican' },
                { label: 'Asian Fusion', value: 'Asian' },
                { label: 'Desserts Only', value: 'Dessert' }
            ]
        },
        'features': {
            type: 'checkbox',
            label: 'Special Features',
            options: [
                { label: 'Open 24x7', value: '24x7' },
                { label: 'Home Delivery', value: 'Delivery' },
                { label: 'Pet-Friendly', value: 'Pet-Friendly' },
                { label: 'Live Music', value: 'Live Music' },
                { label: 'Buffet Available', value: 'Buffet' },
                { label: 'BYOB', value: 'BYOB' }
            ]
        },
        'price': {
            type: 'radio',
            label: 'Price Range',
            options: [
                { label: 'Any', value: 'any' },
                { label: '💰 Budget', value: 1 },
                { label: '💰💰 Moderate', value: 2 },
                { label: '💰💰💰 Premium', value: 3 },
                { label: '💰💰💰💰 Luxury', value: 4 }
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

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        // Open the first section by default or keep all closed as requested
        // 'dietary': true 
    });

    // Reset filters when category changes
    useEffect(() => {
        setFilters({});
        onFilterChange({});
        setOpenSections({});
    }, [category]);

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

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
        <div className="bg-card rounded-lg border shadow-sm mb-6 animate-in fade-in slide-in-from-top-2">
            <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Refine {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                {Object.keys(filters).length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setFilters({});
                            onFilterChange({});
                        }}
                        className="h-8 text-muted-foreground hover:text-destructive text-xs"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Active Filter Chips */}
            {Object.keys(filters).length > 0 && (
                <div className="p-4 pb-0 flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;
                        if (value === 'any') return null;

                        const displayValues = Array.isArray(value) ? value : [value];
                        return displayValues.map((val: string) => (
                            <Badge key={`${key}-${val}`} variant="secondary" className="flex items-center gap-1">
                                {val}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                    onClick={() => {
                                        if (Array.isArray(value)) {
                                            handleCheckboxUpdate(key, val, false);
                                        } else {
                                            handleFilterUpdate(key, 'any'); // or remove
                                        }
                                    }}
                                />
                            </Badge>
                        ));
                    })}
                </div>
            )}

            <div className="p-4 space-y-2">
                {Object.entries(config).map(([key, filter]) => {
                    const isOpen = openSections[key];
                    const activeCount = Array.isArray(filters[key]) ? filters[key].length : (filters[key] && filters[key] !== 'any' ? 1 : 0);

                    return (
                        <div key={key} className="border rounded-md overflow-hidden">
                            <button
                                onClick={() => toggleSection(key)}
                                className="w-full flex justify-between items-center p-3 bg-muted/10 hover:bg-muted/20 transition-colors text-sm font-medium"
                            >
                                <span className="flex items-center gap-2">
                                    {filter.label}
                                    {activeCount > 0 && (
                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                            {activeCount}
                                        </Badge>
                                    )}
                                </span>
                                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </button>

                            {isOpen && (
                                <div className="p-3 bg-card border-t animate-in slide-in-from-top-1">
                                    {filter.type === 'radio' && filter.options && (
                                        <RadioGroup
                                            value={filters[key]?.toString() || filter.options[0].value.toString()}
                                            onValueChange={(val) => handleFilterUpdate(key, val)}
                                            className="flex flex-col gap-2"
                                        >
                                            {filter.options.map((opt) => (
                                                <div key={opt.value} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt.value.toString()} id={`${key}-${opt.value}`} />
                                                    <Label htmlFor={`${key}-${opt.value}`} className="font-normal cursor-pointer text-sm">
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
                                                    <Label htmlFor={`${key}-${opt.value}`} className="font-normal cursor-pointer text-sm">
                                                        {opt.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
