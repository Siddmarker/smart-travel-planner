import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TripCategory } from '@/types';

interface PreferencesModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (preferences: TripPreferences) => void;
    initialPreferences?: Partial<TripPreferences>;
}

export interface TripPreferences {
    budget: 'low' | 'medium' | 'high';
    minRating: number;
    categories: TripCategory[];
    dietary?: string[];
    difficulty?: 'easy' | 'moderate' | 'hard';
}

const AVAILABLE_CATEGORIES: { id: TripCategory; label: string; icon: string }[] = [
    { id: 'trekking', label: 'Trekking', icon: '🥾' },
    { id: 'food', label: 'Food', icon: '🍕' },
    { id: 'cultural', label: 'Culture', icon: '🏛️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'scenic_drives', label: 'Scenic Drives', icon: '🌳' },
    { id: 'adventure', label: 'Adventure', icon: '🧗' },
    { id: 'beaches', label: 'Beaches', icon: '🏖️' },
    { id: 'nightlife', label: 'Nightlife', icon: '🎉' },
    { id: 'historical', label: 'Historical', icon: '🏰' },
    { id: 'wildlife', label: 'Wildlife', icon: '🦁' },
    { id: 'religious', label: 'Religious', icon: '🕌' },
    { id: 'markets', label: 'Markets', icon: '🛒' },
];

export function PreferencesModal({ isOpen, onOpenChange, onSubmit, initialPreferences }: PreferencesModalProps) {
    const [budget, setBudget] = useState<'low' | 'medium' | 'high'>('medium');
    const [minRating, setMinRating] = useState<string>('4');
    const [selectedCategories, setSelectedCategories] = useState<TripCategory[]>(['food', 'cultural', 'scenic_drives']);
    const [dietary, setDietary] = useState<string[]>([]);
    const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'hard'>('moderate');

    useEffect(() => {
        if (initialPreferences) {
            if (initialPreferences.budget) setBudget(initialPreferences.budget);
            if (initialPreferences.minRating) setMinRating(initialPreferences.minRating.toString());
            if (initialPreferences.categories) setSelectedCategories(initialPreferences.categories);
            if (initialPreferences.dietary) setDietary(initialPreferences.dietary);
            if (initialPreferences.difficulty) setDifficulty(initialPreferences.difficulty);
        }
    }, [initialPreferences]);

    const handleCategoryToggle = (categoryId: TripCategory) => {
        setSelectedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(c => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleDietaryToggle = (option: string) => {
        setDietary(prev =>
            prev.includes(option)
                ? prev.filter(d => d !== option)
                : [...prev, option]
        );
    };

    const handleSubmit = () => {
        onSubmit({
            budget,
            minRating: Number(minRating),
            categories: selectedCategories,
            dietary: selectedCategories.includes('food') ? dietary : undefined,
            difficulty: selectedCategories.includes('trekking') ? difficulty : undefined,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="preferences-modal sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 border-none">
                <div className="modal-header">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        🎯 Customize Your Trip
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 mt-2 text-base">
                        Tell us what you like so we can find the best places for you.
                    </DialogDescription>
                </div>

                <div className="p-6 grid gap-8">
                    {/* Budget */}
                    <div className="space-y-3">
                        <Label className="text-lg font-semibold text-slate-800">💰 Budget Level</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {['low', 'medium', 'high'].map((b) => (
                                <div
                                    key={b}
                                    className={`preference-chip text-center ${budget === b ? 'selected' : ''}`}
                                    onClick={() => setBudget(b as any)}
                                >
                                    {b === 'low' ? 'Budget ($)' : b === 'medium' ? 'Moderate ($$)' : 'Luxury ($$$)'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                        <Label className="text-lg font-semibold text-slate-800">⭐ Minimum Rating</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {['3', '4', '4.5'].map((r) => (
                                <div
                                    key={r}
                                    className={`preference-chip text-center ${minRating === r ? 'selected' : ''}`}
                                    onClick={() => setMinRating(r)}
                                >
                                    {r}+ Stars
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <Label className="text-lg font-semibold text-slate-800">🎯 Preferred Activities</Label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_CATEGORIES.map(cat => (
                                <div
                                    key={cat.id}
                                    className={`preference-chip flex items-center gap-2 ${selectedCategories.includes(cat.id) ? 'selected' : ''}`}
                                    onClick={() => handleCategoryToggle(cat.id)}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Filters: Food */}
                    {selectedCategories.includes('food') && (
                        <div className="space-y-3 border-t pt-6 slide-in">
                            <Label className="text-lg font-semibold text-slate-800">🥗 Dietary Preferences</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'].map(opt => (
                                    <div
                                        key={opt}
                                        className={`preference-chip ${dietary.includes(opt) ? 'selected' : ''}`}
                                        onClick={() => handleDietaryToggle(opt)}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Filters: Trekking */}
                    {selectedCategories.includes('trekking') && (
                        <div className="space-y-3 border-t pt-6 slide-in">
                            <Label className="text-lg font-semibold text-slate-800">🥾 Trekking Difficulty</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {['easy', 'moderate', 'hard'].map((d) => (
                                    <div
                                        key={d}
                                        className={`preference-chip text-center ${difficulty === d ? 'selected' : ''}`}
                                        onClick={() => setDifficulty(d as any)}
                                    >
                                        {d.charAt(0).toUpperCase() + d.slice(1)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-0">
                    <Button onClick={handleSubmit} className="w-full py-6 text-lg font-semibold bg-slate-900 hover:bg-blue-600 rounded-xl shadow-lg transition-all hover:scale-[1.02]">
                        Find Places & Start Voting 🚀
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
