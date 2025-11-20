'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Sparkles, Navigation, Clock, TrendingDown } from 'lucide-react';
import { RoutePreferences } from '@/lib/route-optimizer/optimizer';

interface RouteControlsProps {
    preferences: RoutePreferences;
    onPreferencesChange: (preferences: RoutePreferences) => void;
    onOptimize: () => void;
    isOptimizing?: boolean;
}

export function RouteControls({
    preferences,
    onPreferencesChange,
    onOptimize,
    isOptimizing = false,
}: RouteControlsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Route Optimization
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Transport Mode */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Transport Mode</Label>
                    <RadioGroup
                        value={preferences.transportMode}
                        onValueChange={(value) =>
                            onPreferencesChange({
                                ...preferences,
                                transportMode: value as 'driving' | 'walking' | 'transit',
                            })
                        }
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="driving" id="driving" />
                            <Label htmlFor="driving" className="font-normal cursor-pointer">
                                🚗 Driving
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="walking" id="walking" />
                            <Label htmlFor="walking" className="font-normal cursor-pointer">
                                🚶 Walking
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="transit" id="transit" />
                            <Label htmlFor="transit" className="font-normal cursor-pointer">
                                🚌 Public Transit
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Optimization Priority */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Optimization Priority</Label>
                    <RadioGroup
                        value={preferences.priority}
                        onValueChange={(value) =>
                            onPreferencesChange({
                                ...preferences,
                                priority: value as 'fastest' | 'shortest' | 'balanced',
                            })
                        }
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="shortest" id="shortest" />
                            <Label htmlFor="shortest" className="font-normal cursor-pointer flex items-center gap-2">
                                <TrendingDown className="h-4 w-4" />
                                Shortest Distance
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fastest" id="fastest" />
                            <Label htmlFor="fastest" className="font-normal cursor-pointer flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Fastest Route
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="balanced" id="balanced" />
                            <Label htmlFor="balanced" className="font-normal cursor-pointer">
                                ⚖️ Balanced
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Return to Start */}
                <div className="flex items-center justify-between">
                    <Label htmlFor="return-to-start" className="text-sm font-medium">
                        Return to starting point
                    </Label>
                    <Switch
                        id="return-to-start"
                        checked={preferences.returnToStart}
                        onCheckedChange={(checked) =>
                            onPreferencesChange({
                                ...preferences,
                                returnToStart: checked,
                            })
                        }
                    />
                </div>

                {/* Optimize Button */}
                <Button
                    onClick={onOptimize}
                    disabled={isOptimizing}
                    className="w-full gap-2"
                    size="lg"
                >
                    {isOptimizing ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Optimizing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Optimize Route
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
