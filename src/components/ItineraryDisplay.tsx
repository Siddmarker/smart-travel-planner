'use client';

import { useState, useMemo } from 'react';
import { MapPin, Utensils, Star, Flag, Check, Sun, Moon, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// --- Types ---
interface Option {
    id: string;
    type: string;
    anchor?: { name: string; description?: string };
    satellite?: { name: string };
    place_name?: string;
    votes: number;
}

interface Slot {
    options: Option[];
}

interface Day {
    day_number: number;
    [key: string]: any; // Allow loose access for the helper
}

interface TripData {
    trip_id: string;
    name?: string;
    itinerary: Day[];
}

interface ItineraryDisplayProps {
    tripResult: TripData;
}

export default function ItineraryDisplay(props: ItineraryDisplayProps) {
    console.log('ItineraryDisplay received props:', props);
    const { tripResult } = props;
    const [selections, setSelections] = useState<Record<string, string>>({});

    const getSlotKey = (dayNum: number, slotKey: string) => `day_${dayNum}_${slotKey}`;

    const handleSelect = (dayNum: number, slotKey: string, optionId: string) => {
        const key = getSlotKey(dayNum, slotKey);
        setSelections(prev => ({ ...prev, [key]: optionId }));
    };

    const getSelection = (dayNum: number, slotKey: string) => selections[getSlotKey(dayNum, slotKey)];

    // --- Smart Access Helper ---
    const getOptions = (day: any, slotBase: string): Option[] => {
        // Try various key formats: "Morning", "morning", "Morning_slot", "morning_slot"
        const candidates = [
            slotBase,
            slotBase.toLowerCase(),
            `${slotBase}_slot`,
            `${slotBase.toLowerCase()}_slot`
        ];

        // 1. Direct access on day object
        for (const key of candidates) {
            const val = day[key];
            if (val) {
                if (Array.isArray(val)) return val;
                if (val.options && Array.isArray(val.options)) return val.options;
            }
        }

        // 2. Nested 'slots' object access (if API changes structure)
        if (day.slots) {
            for (const key of candidates) {
                const val = day.slots[key];
                if (val) {
                    if (Array.isArray(val)) return val;
                    if (val.options && Array.isArray(val.options)) return val.options;
                }
            }
        }

        return [];
    };

    const completionStatus = useMemo(() => {
        if (!tripResult || !tripResult.itinerary) return { total: 0, current: 0, isComplete: false };

        let totalSlots = 0;
        tripResult.itinerary.forEach((day: any) => {
            if (getOptions(day, 'Morning').length) totalSlots++;
            if (getOptions(day, 'Lunch').length) totalSlots++;
            if (getOptions(day, 'Afternoon').length) totalSlots++;
        });

        const currentSelections = Object.keys(selections).length;
        return {
            total: totalSlots,
            current: currentSelections,
            isComplete: currentSelections >= totalSlots && totalSlots > 0
        };
    }, [tripResult, selections]);


    // --- Render Logic ---
    let content;
    try {
        if (!tripResult || !tripResult.itinerary || tripResult.itinerary.length === 0) {
            content = <div className="text-center p-12 text-gray-500">No itinerary found.</div>;
        } else {
            content = (
                <>
                    {tripResult.itinerary.map((day, index) => {
                        // Deep Logging
                        console.log(`Day ${index} Data Structure:`, day);

                        return (
                            <div key={day.day_number || index} className="relative">
                                {/* Day Marker */}
                                <div className="sticky top-20 z-10 bg-[#FAFAFA]/95 backdrop-blur py-4 mb-6 border-b border-neutral-200">
                                    <h2 className="text-3xl font-extrabold text-neutral-900 flex items-center gap-3">
                                        <span className="bg-black text-white w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                                            {day.day_number}
                                        </span>
                                        Day {day.day_number}
                                    </h2>
                                </div>

                                <div className="space-y-12 border-l-2 border-neutral-200 ml-5 pl-8 py-4">

                                    {/* Slot Loop */}
                                    {[
                                        { key: 'Morning', label: 'Morning Adventure', icon: <Sun className="w-5 h-5 text-orange-500" /> },
                                        { key: 'Lunch', label: 'Lunch Spot', icon: <Utensils className="w-5 h-5 text-red-500" /> },
                                        { key: 'Afternoon', label: 'Afternoon Exploration', icon: <Moon className="w-5 h-5 text-purple-500" /> }
                                    ].map((slotConfig) => {
                                        // Use Smart Access
                                        const options = getOptions(day, slotConfig.key);
                                        const selectedId = getSelection(day.day_number, slotConfig.key);
                                        const hasSelection = !!selectedId;

                                        if (options.length === 0) {
                                            console.warn(`No options found for Day ${day.day_number} - ${slotConfig.key}`);
                                            return null;
                                        }

                                        return (
                                            <div key={slotConfig.key} className="relative">
                                                <h3 className="flex items-center gap-3 font-bold text-xl text-neutral-800 mb-6">
                                                    <div className="p-2 bg-white rounded-full shadow-sm border border-neutral-100">
                                                        {slotConfig.icon}
                                                    </div>
                                                    {slotConfig.label}
                                                </h3>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {options.map((option) => {
                                                        const isSelected = selectedId === option.id;
                                                        const isFaded = hasSelection && !isSelected;

                                                        const title = option.type === 'FOOD' ? option.place_name : option.anchor?.name;
                                                        const subTitle = option.type === 'ANCHOR_PLUS_SAT' && option.satellite
                                                            ? `+ ${option.satellite.name}`
                                                            : (option.type === 'FOOD' ? 'Local Cuisine' : '');
                                                        const reason = option.anchor?.description || "A top-rated local favorite.";

                                                        return (
                                                            <div
                                                                key={option.id}
                                                                className={`
                                                group relative flex flex-col h-full bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md
                                                ${isSelected ? 'border-green-500 ring-4 ring-green-500/10 z-10 scale-[1.02]' : 'border-neutral-100 hover:border-neutral-300'}
                                                ${isFaded ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0' : 'opacity-100'}
                                            `}
                                                                onClick={() => handleSelect(day.day_number, slotConfig.key, option.id)}
                                                            >
                                                                {isSelected && (
                                                                    <div className="absolute -top-3 -right-3 bg-green-500 text-white p-1.5 rounded-full shadow-md z-20">
                                                                        <Check className="w-4 h-4" />
                                                                    </div>
                                                                )}

                                                                <div className="p-5 pb-3">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <h4 className="font-bold text-lg text-neutral-900 leading-tight pr-4">
                                                                            {title}
                                                                        </h4>
                                                                        {option.type === 'ANCHOR_PLUS_SAT' && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2 py-1 rounded-md">
                                                                                Anchor
                                                                            </span>
                                                                        )}
                                                                        {option.type === 'FOOD' && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
                                                                                Eats
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {subTitle && (
                                                                        <p className="text-sm font-medium text-neutral-500 flex items-center gap-1.5">
                                                                            {option.type === 'ANCHOR_PLUS_SAT' && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                                                            {subTitle}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="px-5 py-2 flex-grow">
                                                                    <p className="text-sm text-neutral-600 leading-relaxed border-l-2 border-neutral-200 pl-3 italic">
                                                                        "{reason}"
                                                                    </p>
                                                                </div>

                                                                <div className="p-5 pt-3 mt-auto">
                                                                    <button
                                                                        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
                                                    ${isSelected
                                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                                : 'bg-neutral-100 text-neutral-600 hover:bg-black hover:text-white group-hover:bg-neutral-900 group-hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {isSelected ? 'Selected' : 'Select Option'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </>
            );
        }
    } catch (error: any) {
        console.error('Render Loop Error:', error);
        content = (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="text-red-600 font-bold">UI Render Error</h3>
                <p>The data arrived, but the component couldn't map it. Here is the raw data:</p>
                <pre className="text-xs overflow-auto bg-gray-100 p-2 mt-2 max-h-96">
                    {JSON.stringify(tripResult, null, 2)}
                </pre>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto space-y-16 pb-32 animate-in fade-in duration-700">
            {content}

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-neutral-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="container max-w-5xl mx-auto flex items-center justify-between">
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-neutral-500">Trip Summary</p>
                        <p className="font-bold text-neutral-900">
                            {completionStatus.current} of {completionStatus.total} experiences selected
                        </p>
                    </div>

                    <div className="md:hidden flex-1 mr-4">
                        <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-black transition-all duration-500"
                                style={{ width: `${(completionStatus.current / completionStatus.total) * 100}%` }}
                            />
                        </div>
                    </div>

                    <Button
                        size="lg"
                        className={`min-w-[160px] font-bold shadow-lg transition-all ${completionStatus.isComplete
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105'
                            : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            }`}
                        disabled={!completionStatus.isComplete}
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        {completionStatus.isComplete ? 'Save & Share' : 'Select All Slots'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
