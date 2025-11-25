'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trip, Place } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { autocompletePlace, getPlaceDetails } from '@/lib/googleMapsService';
import { getDestinationSuggestions } from '@/lib/geminiService';

export default function NewTripPage() {
    const router = useRouter();
    const addTrip = useStore((state) => state.addTrip);
    const currentUser = useStore((state) => state.currentUser);

    const [formData, setFormData] = useState({
        name: '',
        destination: '',
        startDate: '',
        endDate: '',
    });
    const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<Place[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAiSuggest = async () => {
        if (!currentUser || !('travelPreferences' in currentUser)) return;
        setAiLoading(true);
        setError(null);
        try {
            const suggestions = await getDestinationSuggestions(currentUser.travelPreferences);
            setAiSuggestions(suggestions);
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
            setError('Failed to get AI suggestions. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleDestinationInput = async (value: string) => {
        setFormData({ ...formData, destination: value });
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
        setFormData({ ...formData, destination: description });
        setShowPredictions(false);

        try {
            const placeDetails = await getPlaceDetails(placeId);
            if (placeDetails) {
                setDestinationCoords({ lat: placeDetails.lat, lng: placeDetails.lng });
            }
        } catch (error) {
            console.error('Error getting place details:', error);
            setError('Failed to get place details. Please try selecting the destination again.');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!currentUser) {
            setError('You must be logged in to create a trip.');
            return;
        }

        if (!formData.name || !formData.destination || !formData.startDate || !formData.endDate) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            const newTrip: Trip = {
                id: uuidv4(),
                name: formData.name,
                startDate: formData.startDate,
                endDate: formData.endDate,
                destination: {
                    name: formData.destination,
                    lat: destinationCoords.lat,
                    lng: destinationCoords.lng,
                },
                participants: [currentUser],
                days: [],
                budget: {
                    currency: 'USD',
                    total: 0,
                    spent: 0,
                },
            };

            console.log('Creating trip:', newTrip);
            addTrip(newTrip);
            console.log('Trip created, navigating...');
            router.push(`/trips/${newTrip.id}`);
        } catch (err: any) {
            console.error('Error creating trip:', err);
            setError(err.message || 'Failed to create trip. Please try again.');
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Plan a New Trip</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Trip Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Summer in Paris"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 relative">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="destination" className="flex items-center gap-2">
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
                                placeholder="Where are you going?"
                                required
                                value={formData.destination}
                                onChange={(e) => handleDestinationInput(e.target.value)}
                                onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                                onFocus={() => formData.destination.length > 2 && setShowPredictions(true)}
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
                                                    setFormData({ ...formData, destination: place.name });
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
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full">
                            Create Trip
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
