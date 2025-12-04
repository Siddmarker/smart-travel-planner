'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { Place, TripCategory, Trip } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, DollarSign, Type, Tag, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

import { autocompletePlace, getPlaceDetails } from '@/lib/googleMapsService';
import { getDestinationSuggestions } from '@/lib/geminiService';

interface CreateTripModalProps {
    children?: React.ReactNode;
}

export function CreateTripModal({ children }: CreateTripModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');
    const [returnToStart, setReturnToStart] = useState(false);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('20:00');
    const [selectedCategories, setSelectedCategories] = useState<TripCategory[]>([]);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<Place[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    // Enhanced Food Preferences
    const [foodVariety, setFoodVariety] = useState<'high' | 'medium' | 'low'>('medium');
    const [dietaryOptions, setDietaryOptions] = useState<string[]>(['Non-Vegetarian', 'Egg', 'Vegetarian']);
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>(['Indian', 'Chinese']);

    const { addTrip, currentUser } = useStore();
    const router = useRouter();

    const handleAiSuggest = async () => {
        if (!currentUser || !('travelPreferences' in currentUser)) return;
        setAiLoading(true);
        try {
            const suggestions = await getDestinationSuggestions(currentUser.travelPreferences);
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
        } finally {
            setAiLoading(false);
        }
    };

    const handleDestinationInput = async (value: string) => {
        // Smart Parsing for "N day trip to Destination"
        const durationRegex = /(\d+)\s*day/i;
        const match = value.match(durationRegex);

        let searchTerm = value;
        let detectedDuration = null;

        if (match) {
            const days = parseInt(match[1]);
            if (days > 0 && days <= 30) {
                detectedDuration = days;
                // Remove the "N day" part to get the destination
                // Also remove common words like "trip", "itinerary", "to", "in"
                searchTerm = value
                    .replace(durationRegex, '')
                    .replace(/\b(trip|itinerary|vacation|holiday|to|in)\b/gi, '')
                    .trim();

                // Auto-set dates if duration detected
                const start = new Date();
                start.setDate(start.getDate() + 1); // Start tomorrow
                const end = new Date(start);
                end.setDate(start.getDate() + days - 1); // N days duration

                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
            }
        }

        setDestination(value); // Keep original input visible? Or clean it? Let's keep original for now but search with clean.

        // If we extracted a cleaner search term, use that for autocomplete
        const query = searchTerm.length > 0 ? searchTerm : value;

        if (query.length > 2) {
            try {
                const results = await autocompletePlace(query);
                setPredictions(results);
                setShowPredictions(true);
            } catch (error) {
                console.error('Error fetching predictions:', error);
            }
        } else {
            setPredictions([]);
            setShowPredictions(false);
        }
    };

    const handlePredictionSelect = async (placeId: string, description: string) => {
        setDestination(description);
        setShowPredictions(false);

        try {
            const placeDetails = await getPlaceDetails(placeId);
            if (placeDetails) {
                setDestinationCoords({ lat: placeDetails.lat, lng: placeDetails.lng });
            }
        } catch (error) {
            console.error('Error getting place details:', error);
        }
    };

    const TRIP_CATEGORIES: { value: TripCategory; label: string; icon: string }[] = [
        { value: 'trekking', label: 'Trekking/Hiking', icon: '🥾' },
        { value: 'food', label: 'Food & Dining', icon: '🍽️' },
        { value: 'scenic_drives', label: 'Scenic Drives', icon: '🚗' },
        { value: 'cultural', label: 'Cultural Sites', icon: '🏛️' },
        { value: 'beaches', label: 'Beaches', icon: '🏖️' },
        { value: 'adventure', label: 'Adventure Sports', icon: '🪂' },
        { value: 'shopping', label: 'Shopping', icon: '🛍️' },
        { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
        { value: 'historical', label: 'Historical', icon: '🏰' },
        { value: 'wildlife', label: 'Wildlife', icon: '🦁' },
        { value: 'religious', label: 'Religious', icon: '🕌' },
        { value: 'markets', label: 'Local Markets', icon: '🏪' },
    ];

    const toggleCategory = (category: TripCategory) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const initialDays = [];
        for (let i = 0; i < totalDays; i++) {
            const dayDate = new Date(start);
            dayDate.setDate(start.getDate() + i);
            initialDays.push({
                id: uuidv4(),
                dayNumber: i + 1,
                date: dayDate.toISOString(),
                planningMode: 'manual' as const,
                status: 'empty' as const,
                morning: [],
                afternoon: [],
                evening: [],
                items: []
            });
        }

        const newTrip: Trip = {
            id: uuidv4(),
            name,
            startDate,
            endDate,
            totalDays,
            destination: {
                name: destination,
                lat: destinationCoords.lat,
                lng: destinationCoords.lng,
            },
            participants: [{
                userId: currentUser.id,
                name: currentUser.name,
                role: 'admin',
                joinedAt: new Date().toISOString()
            }],
            adminId: currentUser.id,
            joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            planningMode: 'manual',
            votingStatus: 'not_started',
            days: initialDays,
            budget: {
                currency: 'USD',
                total: Number(budget) || 0,
                spent: 0,
            },
            preferences: {
                returnToStart,
                startTime,
                endTime,
                // Enhanced preferences
                foodVariety,
                dietary: dietaryOptions,
                cuisines: selectedCuisines
            },
            categoryPreferences: selectedCategories.length > 0 ? {
                categories: selectedCategories,
                priorities: {} // Default priorities
            } : undefined,
        };

        addTrip(newTrip);
        setOpen(false);
        router.push(`/trips/${newTrip.id}`);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-primary">Plan a New Trip</DialogTitle>
                    <DialogDescription>
                        Enter the details below to start planning your next adventure.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-base">
                            <Type className="h-4 w-4 text-muted-foreground" />
                            Trip Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Summer Vacation 2024"
                            required
                            className="h-10"
                        />
                    </div>
                    <div className="grid gap-2 relative">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="destination" className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Destination
                            </Label>
                            {currentUser && 'travelPreferences' in currentUser && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                    onClick={handleAiSuggest}
                                    disabled={aiLoading}
                                >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    {aiLoading ? 'Thinking...' : 'Ask AI'}
                                </Button>
                            )}
                        </div>
                        <Input
                            id="destination"
                            value={destination}
                            onChange={(e) => handleDestinationInput(e.target.value)}
                            placeholder="e.g., Paris, France"
                            required
                            className="h-10"
                            onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                            onFocus={() => destination.length > 2 && setShowPredictions(true)}
                        />
                        {showPredictions && predictions.length > 0 && (
                            <div className="absolute z-50 w-full top-[72px] bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                                {predictions.map((prediction) => (
                                    <div
                                        key={prediction.place_id}
                                        className="p-2 hover:bg-accent cursor-pointer text-sm"
                                        onClick={() => handlePredictionSelect(prediction.place_id, prediction.description)}
                                    >
                                        {prediction.description}
                                    </div>
                                ))}
                            </div>
                        )}
                        {aiSuggestions.length > 0 && (
                            <div className="mt-1 border rounded-md p-2 bg-purple-50/50">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-purple-800">AI Suggestions for you:</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                        onClick={() => setAiSuggestions([])}
                                    >
                                        ×
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    {aiSuggestions.map(place => (
                                        <div
                                            key={place.id}
                                            className="text-sm p-2 hover:bg-purple-100 cursor-pointer rounded-md flex justify-between items-center transition-colors bg-white/50"
                                            onClick={() => {
                                                setDestination(place.name);
                                                setDestinationCoords({ lat: place.lat, lng: place.lng });
                                                setAiSuggestions([]);
                                            }}
                                        >
                                            <span className="font-medium">{place.name}</span>
                                            <span className="text-xs text-muted-foreground bg-white px-1.5 py-0.5 rounded border">{place.category}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startDate" className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Start Date
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endDate" className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                End Date
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="h-10"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="budget" className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            Budget (USD)
                        </Label>
                        <Input
                            id="budget"
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="e.g., 1000"
                            className="h-10"
                        />
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <Label className="flex items-center gap-2 text-base mb-3">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            Trip Categories (Optional)
                        </Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Select categories that interest you to get personalized recommendations
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                            {TRIP_CATEGORIES.map((cat) => (
                                <div
                                    key={cat.value}
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer"
                                    onClick={() => toggleCategory(cat.value)}
                                >
                                    <Checkbox
                                        id={cat.value}
                                        checked={selectedCategories.includes(cat.value)}
                                        onCheckedChange={() => toggleCategory(cat.value)}
                                    />
                                    <label
                                        htmlFor={cat.value}
                                        className="text-sm cursor-pointer flex items-center gap-1"
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        {selectedCategories.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Selected: {selectedCategories.length} categories
                            </p>
                        )}
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <h4 className="font-medium mb-3">Optimization Preferences</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="returnToStart"
                                    checked={returnToStart}
                                    onChange={(e) => setReturnToStart(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor="returnToStart" className="font-normal cursor-pointer">
                                    Return to starting point after the trip
                                </Label>
                            </div>
                            {returnToStart && (
                                <p className="text-xs text-muted-foreground ml-6">
                                    ⓘ We'll calculate the best route back to your origin
                                </p>
                            )}
                        </div>
                    </div>

                    {/* FOOD PREFERENCES SECTION */}
                    <div className="border-t pt-4 mt-2">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                            <span>🍽️</span> Food Preferences (Multi-day trips)
                        </h4>

                        {/* Variety Preference */}
                        <div className="grid gap-2 mb-4">
                            <Label htmlFor="foodVariety">Food Variety Across Days</Label>
                            <SelectUI
                                value={foodVariety}
                                onValueChange={(val: 'high' | 'medium' | 'low') => setFoodVariety(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select variety preference" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High Variety (Different cuisines each day)</SelectItem>
                                    <SelectItem value="medium">Medium Variety</SelectItem>
                                    <SelectItem value="low">Same preferences daily</SelectItem>
                                </SelectContent>
                            </SelectUI>
                        </div>

                        {/* Dietary Options */}
                        <div className="mb-4">
                            <Label className="mb-2 block">Dietary Options to Include</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Non-Vegetarian', 'Egg', 'Vegetarian', 'Vegan'].map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`diet-${option}`}
                                            checked={dietaryOptions.includes(option)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setDietaryOptions([...dietaryOptions, option]);
                                                } else {
                                                    setDietaryOptions(dietaryOptions.filter(d => d !== option));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`diet-${option}`} className="font-normal cursor-pointer">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cuisines */}
                        <div>
                            <Label className="mb-2 block">Preferred Cuisines</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Thai'].map((cuisine) => (
                                    <div key={cuisine} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`cuisine-${cuisine}`}
                                            checked={selectedCuisines.includes(cuisine)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedCuisines([...selectedCuisines, cuisine]);
                                                } else {
                                                    setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`cuisine-${cuisine}`} className="font-normal cursor-pointer">
                                            {cuisine}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="w-full sm:w-auto">Create Trip</Button>
                    </DialogFooter>
                </form>
            </DialogContent >
        </Dialog >
    );
}
