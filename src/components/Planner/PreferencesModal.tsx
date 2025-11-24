import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>🎯 Customize Your Trip</DialogTitle>
                    <DialogDescription>
                        Tell us what you like so we can find the best places for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Budget */}
                    <div className="space-y-2">
                        <Label>💰 Budget Level</Label>
                        <Select value={budget} onValueChange={(v: any) => setBudget(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select budget" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Budget Friendly ($)</SelectItem>
                                <SelectItem value="medium">Moderate ($$)</SelectItem>
                                <SelectItem value="high">Luxury ($$$)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                        <Label>⭐ Minimum Rating</Label>
                        <Select value={minRating} onValueChange={setMinRating}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3+ Stars (Good)</SelectItem>
                                <SelectItem value="4">4+ Stars (Very Good)</SelectItem>
                                <SelectItem value="4.5">4.5+ Stars (Excellent)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <Label>🎯 Preferred Activities</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_CATEGORIES.map(cat => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${cat.id}`}
                                        checked={selectedCategories.includes(cat.id)}
                                        onCheckedChange={() => handleCategoryToggle(cat.id)}
                                    />
                                    <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">
                                        {cat.icon} {cat.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Filters: Food */}
                    {selectedCategories.includes('food') && (
                        <div className="space-y-2 border-t pt-4">
                            <Label>🥗 Dietary Preferences</Label>
                            <div className="flex flex-wrap gap-2">
                                {['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'].map(opt => (
                                    <div key={opt} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`diet-${opt}`}
                                            checked={dietary.includes(opt)}
                                            onCheckedChange={() => handleDietaryToggle(opt)}
                                        />
                                        <Label htmlFor={`diet-${opt}`}>{opt}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Filters: Trekking */}
                    {selectedCategories.includes('trekking') && (
                        <div className="space-y-2 border-t pt-4">
                            <Label>🥾 Trekking Difficulty</Label>
                            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy (Walk in the park)</SelectItem>
                                    <SelectItem value="moderate">Moderate (Some hills)</SelectItem>
                                    <SelectItem value="hard">Hard (Challenging terrain)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full">
                        Find Places & Start Voting
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
