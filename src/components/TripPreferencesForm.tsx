'use client';

import { useState } from 'react';
import { BedDouble, Tent, Bike, Bus, Car, Loader2, Calendar, Users, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TripPreferencesFormProps {
    onTripGenerated?: (itinerary: any) => void;
    onSubmit?: (preferences: any) => void; // New Prop
}

export default function TripPreferencesForm(props: TripPreferencesFormProps) {
    const { onTripGenerated } = props;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State
    const [travelMode, setTravelMode] = useState<'BASECAMP' | 'ON_THE_GO'>('BASECAMP');
    const [vibe, setVibe] = useState<'JUST_THE_HITS' | 'BALANCED' | 'DEEP_DIVE'>('BALANCED');
    const [transportType, setTransportType] = useState('car');
    const [duration, setDuration] = useState<number>(2);
    const [groupType, setGroupType] = useState('couple');
    const [diet, setDiet] = useState<string>('Any');

    const handleGenerate = async () => {
        const formData = {
            destination: 'Munnar',
            travel_mode: travelMode.toLowerCase().replace(/_/g, '-'),
            vibe: vibe.toLowerCase().replace(/_/g, '-'),
            transport_type: transportType,
            duration,
            group_type: groupType,
            diet
        };

        // NEW: If parent provides an onSubmit handler, use it to pass data up and skip the internal API call.
        if (props.onSubmit) {
            props.onSubmit(formData);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/generate-trip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate trip');
            }

            console.log('Trip Generated:', data);

            if (onTripGenerated) {
                onTripGenerated(data);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto p-6 space-y-8 bg-white rounded-xl shadow-sm border border-neutral-200">

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                    Plan Your Munnar Adventure
                </h2>
                <p className="text-neutral-500">Customize your perfect getaway.</p>
            </div>

            {/* 1. Duration & Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Duration (Days)
                    </Label>
                    <Input
                        type="number"
                        min={1}
                        max={7}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                        className="h-12"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" /> Group Type
                    </Label>
                    <Select value={groupType} onValueChange={setGroupType}>
                        <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="solo">Solo</SelectItem>
                            <SelectItem value="couple">Couple</SelectItem>
                            <SelectItem value="family">Family (Kids)</SelectItem>
                            <SelectItem value="friends">Friends</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 2. Travel Mode - Visual Cards */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">Travel Style</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basecamp Mode */}
                    <Card
                        className={`p-4 cursor-pointer transition-all border-2 hover:border-blue-200 ${travelMode === 'BASECAMP' ? 'border-blue-600 bg-blue-50/50' : 'border-transparent bg-neutral-50'
                            }`}
                        onClick={() => setTravelMode('BASECAMP')}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${travelMode === 'BASECAMP' ? 'bg-blue-100 text-blue-600' : 'bg-white text-neutral-400'}`}>
                                <BedDouble className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${travelMode === 'BASECAMP' ? 'text-blue-900' : 'text-neutral-700'}`}>
                                    Check-in First
                                </h3>
                                <p className="text-sm text-neutral-500">Relax then explore. Return to base.</p>
                            </div>
                        </div>
                    </Card>

                    {/* On-The-Go Mode */}
                    <Card
                        className={`p-4 cursor-pointer transition-all border-2 hover:border-teal-200 ${travelMode === 'ON_THE_GO' ? 'border-teal-600 bg-teal-50/50' : 'border-transparent bg-neutral-50'
                            }`}
                        onClick={() => setTravelMode('ON_THE_GO')}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-full ${travelMode === 'ON_THE_GO' ? 'bg-teal-100 text-teal-600' : 'bg-white text-neutral-400'}`}>
                                <Tent className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`font-bold ${travelMode === 'ON_THE_GO' ? 'text-teal-900' : 'text-neutral-700'}`}>
                                    Explore First
                                </h3>
                                <p className="text-sm text-neutral-500">Sleep near the last stop.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* 3. Vibe Selector - Pills */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">Trip Vibe</Label>
                <div className="flex flex-wrap gap-3">
                    {[
                        { id: 'JUST_THE_HITS', label: 'Just the Hits' },
                        { id: 'BALANCED', label: 'Balanced' },
                        { id: 'DEEP_DIVE', label: 'Deep Dive' }
                    ].map((option) => (
                        <button
                            type="button"
                            key={option.id}
                            onClick={() => setVibe(option.id as any)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${vibe === option.id
                                ? 'bg-black text-white shadow-md transform scale-105'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Transport & Diet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transport */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold">Transport</Label>
                    <Select value={transportType} onValueChange={setTransportType}>
                        <SelectTrigger className="w-full h-12">
                            <div className="flex items-center gap-2">
                                {transportType === 'bike' && <Bike className="w-4 h-4" />}
                                {transportType === 'car' && <Car className="w-4 h-4" />}
                                {transportType === 'bus' && <Bus className="w-4 h-4" />}
                                <SelectValue placeholder="Select transport" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bike">
                                <div className="flex items-center gap-2"><Bike className="w-4 h-4" /> Bike</div>
                            </SelectItem>
                            <SelectItem value="car">
                                <div className="flex items-center gap-2"><Car className="w-4 h-4" /> Car</div>
                            </SelectItem>
                            <SelectItem value="bus">
                                <div className="flex items-center gap-2"><Bus className="w-4 h-4" /> Bus</div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Diet */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <Utensils className="w-4 h-4" /> Dietary Preference
                    </Label>
                    <div className="flex flex-wrap gap-2">
                        {['Any', 'Vegetarian', 'Vegan', 'Halal'].map((opt) => (
                            <button
                                type="button"
                                key={opt}
                                onClick={() => setDiet(opt)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${diet === opt
                                    ? 'bg-green-100 border-green-300 text-green-700'
                                    : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Generate Button */}
            <div className="pt-4">
                <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full h-12 text-lg bg-black hover:bg-neutral-800 text-white rounded-lg transition-all"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Finding hidden gems...
                        </div>
                    ) : (
                        'Generate Trip'
                    )}
                </Button>
            </div>

        </div>
    );
}
