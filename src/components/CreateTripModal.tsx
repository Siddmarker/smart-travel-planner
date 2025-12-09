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

import { autocompletePlace, getPlaceDetails, reverseGeocode } from '@/lib/googleMapsService';
import { getDestinationSuggestions } from '@/lib/geminiService';
import { useTrip } from '@/contexts/TripContext';
import { Locate } from 'lucide-react';

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
    const [selectedCategories, setSelectedCategories] = useState<TripCategory[]>([]);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<Place[]>([]);
    const [aiLoading, setAiLoading] = useState(false);

    const { createTrip } = useTrip();
    const { currentUser } = useStore();
    const router = useRouter();

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            setDestinationCoords({ lat: latitude, lng: longitude });

            try {
                const address = await reverseGeocode(latitude, longitude);
                if (address) {
                    setDestination(address);
                }
            } catch (error) {
                console.error('Error getting location:', error);
            }
        }, (error) => {
            console.error('Error getting location:', error);
        });
    };

    // Removed duplicate router declaration

    const TRIP_CATEGORIES = [
        { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
        { value: 'adventure', label: 'Adventure', icon: '🧗' },
        { value: 'cultural', label: 'Culture', icon: '🏛️' },
        { value: 'food', label: 'Food', icon: '🍕' },
        { value: 'nature', label: 'Nature', icon: '🌲' },
        { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    ] as const;

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
        setDestination(value);
        if (value.length > 2) {
            try {
                const results = await autocompletePlace(value);
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

    const toggleCategory = (category: TripCategory) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };



    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('CreateTripModal: handleSubmit called');
        setSubmitError(null);

        // Manual validation
        if (!name || !destination || !startDate || !endDate) {
            console.error('CreateTripModal: Validation failed:', { name, destination, startDate, endDate });
            setSubmitError('Please fill in all required fields.');
            return;
        }

        if (!currentUser) {
            console.error('CreateTripModal: No current user found');
            setSubmitError('You must be logged in to create a trip.');
            return;
        }

        setIsSubmitting(true);

        try {
            const tripData = {
                name,
                destination: {
                    name: destination,
                    lat: destinationCoords.lat,
                    lng: destinationCoords.lng,
                },
                startDate,
                endDate,
                adminId: currentUser.id,
                adminName: currentUser.name,
                planningMode: 'manual',
                budget: {
                    currency: 'USD',
                    total: Number(budget) || 0,
                },
                preferences: {
                    returnToStart: false,
                    startTime: '09:00',
                    endTime: '20:00',
                    foodVariety: 'medium',
                    dietary: ['Non-Vegetarian'], // Default
                    cuisines: []
                },
                categoryPreferences: selectedCategories.length > 0 ? {
                    categories: selectedCategories,
                    priorities: {}
                } : undefined,
            };

            console.log('CreateTripModal: Submitting trip data:', tripData);
            const createdTrip = await createTrip(tripData);
            console.log('CreateTripModal: Trip created:', createdTrip);

            if (createdTrip) {
                setOpen(false);
                const tripId = createdTrip.id || createdTrip._id;
                if (tripId) {
                    router.push(`/trips/${tripId}`);
                } else {
                    console.error('CreateTripModal: Trip created but no ID found:', createdTrip);
                    setSubmitError('Trip created but failed to redirect. Please check your trips list.');
                }
            } else {
                console.error('CreateTripModal: createTrip returned null');
                setSubmitError('Failed to create trip. Please try again.');
            }
        } catch (error: any) {
            console.error('CreateTripModal: Error creating trip:', error);
            setSubmitError(error.message || 'An error occurred while creating the trip.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-rose-500">Plan a New Trip</DialogTitle>
                    <DialogDescription>
                        Enter the details below to start planning your next adventure.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-6 py-4" noValidate>
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
                        <div className="relative">
                            <Input
                                id="destination"
                                value={destination}
                                onChange={(e) => handleDestinationInput(e.target.value)}
                                placeholder="e.g., Paris, France"
                                required
                                className="h-10 pr-10"
                                onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                                onFocus={() => destination.length > 2 && setShowPredictions(true)}
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                onClick={handleCurrentLocation}
                                title="Use current location"
                            >
                                <Locate className="h-4 w-4" />
                            </Button>
                        </div>
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
                                <label
                                    key={cat.value}
                                    htmlFor={cat.value}
                                    className="flex items-center space-x-2 p-2 rounded hover:bg-accent cursor-pointer transition-colors"
                                >
                                    <Checkbox
                                        id={cat.value}
                                        checked={selectedCategories.includes(cat.value)}
                                        onCheckedChange={() => toggleCategory(cat.value)}
                                    />
                                    <span className="text-sm flex items-center gap-1 select-none">
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                        {selectedCategories.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                Selected: {selectedCategories.length} categories
                            </p>
                        )}
                    </div>

                    {/* Optimization and Food Preferences removed as per user request to match screenshot */}

                    <DialogFooter className="mt-4 gap-2 sm:gap-0 flex-col">
                        {submitError && (
                            <p className="text-sm text-red-500 mb-2 w-full text-center">{submitError}</p>
                        )}
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating...' : 'Create Trip'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent >
        </Dialog >
    );
}
