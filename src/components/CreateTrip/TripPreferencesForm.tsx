'use client';

import { useState } from 'react';
import { Hotel, Backpack, Car, Bus, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export interface TripPreferences {
    travel_mode: 'basecamp' | 'on-the-go';
    vibe_preference: 'just-the-hits' | 'balanced' | 'deep-dive';
    transport_type: 'car' | 'bus' | 'bike';
}

interface TripPreferencesFormProps {
    onComplete: (preferences: TripPreferences) => void;
    defaultValues?: Partial<TripPreferences>;
}

export function TripPreferencesForm({ onComplete, defaultValues }: TripPreferencesFormProps) {
    const [preferences, setPreferences] = useState<TripPreferences>({
        travel_mode: defaultValues?.travel_mode || 'basecamp',
        vibe_preference: defaultValues?.vibe_preference || 'balanced',
        transport_type: defaultValues?.transport_type || 'car',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(preferences);
    };

    const updatePreference = <K extends keyof TripPreferences>(key: K, value: TripPreferences[K]) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-2xl mx-auto p-4">

            {/* Field 1: Pacing Logic (Travel Mode) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    Step 1: Choose Your Travel Mode
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                        className={cn(
                            "cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden",
                            preferences.travel_mode === 'basecamp' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                        onClick={() => updatePreference('travel_mode', 'basecamp')}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Basecamp Mode</CardTitle>
                                <Hotel className={cn("h-6 w-6", preferences.travel_mode === 'basecamp' ? "text-primary" : "text-muted-foreground")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base">
                                Check-in first, then explore. Great for day trips returning to the same comfortable spot every night.
                            </CardDescription>
                        </CardContent>
                    </Card>

                    <Card
                        className={cn(
                            "cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden",
                            preferences.travel_mode === 'on-the-go' ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                        )}
                        onClick={() => updatePreference('travel_mode', 'on-the-go')}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">On-The-Go Mode</CardTitle>
                                <Backpack className={cn("h-6 w-6", preferences.travel_mode === 'on-the-go' ? "text-primary" : "text-muted-foreground")} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-base">
                                Explore immediately, sleep near the last stop. Perfect for road trips and seeing as much as possible.
                            </CardDescription>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Field 2: Vibe Selector (Travel Style) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 2: Select Your Travel Style</h3>
                <RadioGroup
                    value={preferences.vibe_preference}
                    onValueChange={(value) => updatePreference('vibe_preference', value as TripPreferences['vibe_preference'])}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent",
                        preferences.vibe_preference === 'just-the-hits' ? "border-primary bg-accent" : "border-border"
                    )}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="just-the-hits" id="vibe-hits" />
                            <Label htmlFor="vibe-hits" className="font-medium cursor-pointer">Just the Hits</Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                            Focus on the famous landmarks and must-see anchors.
                        </p>
                    </div>

                    <div className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent",
                        preferences.vibe_preference === 'balanced' ? "border-primary bg-accent" : "border-border"
                    )}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="balanced" id="vibe-balanced" />
                            <Label htmlFor="vibe-balanced" className="font-medium cursor-pointer">Balanced</Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                            A mix of popular spots and some local flavor. Recommended.
                        </p>
                    </div>

                    <div className={cn(
                        "flex flex-col items-start gap-2 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent",
                        preferences.vibe_preference === 'deep-dive' ? "border-primary bg-accent" : "border-border"
                    )}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="deep-dive" id="vibe-deep" />
                            <Label htmlFor="vibe-deep" className="font-medium cursor-pointer">Deep Dive</Label>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                            Off the beaten path. Hidden gems and local secrets.
                        </p>
                    </div>
                </RadioGroup>
            </div>

            {/* Field 3: Transport (Vehicle Type) */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Step 3: Vehicle Type</h3>
                <div className="max-w-xs">
                    <Select
                        value={preferences.transport_type}
                        onValueChange={(value) => updatePreference('transport_type', value as TripPreferences['transport_type'])}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select transport" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="car">
                                <div className="flex items-center gap-2">
                                    <Car className="h-4 w-4" />
                                    <span>Car / Rental</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="bus">
                                <div className="flex items-center gap-2">
                                    <Bus className="h-4 w-4" />
                                    <span>Public Bus / Shuttle</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="bike">
                                <div className="flex items-center gap-2">
                                    <Bike className="h-4 w-4" />
                                    <span>Bike / Motorcycle</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                        We will optimize routes based on your vehicle choice.
                    </p>
                </div>
            </div>

            <div className="pt-6">
                <Button size="lg" className="w-full md:w-auto" type="submit">
                    Continue to Itinerary
                </Button>
            </div>
        </form>
    );
}
