'use client';

import React, { useState, useEffect } from 'react';

// --- TYPES ---
interface Place {
    id: string;
    name: string;
    type: string;
    image?: string;
    rating?: number;
    description?: string;
    time?: string; // e.g. "Morning", "Lunch"
    duration?: number; // in minutes, e.g. 90
}

interface ItineraryDisplayProps {
    tripMeta: any;
    places: Place[];
    onUpdatePlaces?: (updatedPlaces: Place[]) => void; // Callback to update parent state
}

export default function ItineraryDisplay({ tripMeta, places, onUpdatePlaces }: ItineraryDisplayProps) {
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EDITABLE'>('OVERVIEW');
    const [localPlaces, setLocalPlaces] = useState<Place[]>(places);

    // Sync local state if parent props change
    useEffect(() => {
        setLocalPlaces(places);
    }, [places]);

    // --- HELPERS ---
    const formatDate = (dateStr: string, dayOffset: number) => {
        if (!dateStr) return `Day ${dayOffset + 1}`;
        const d = new Date(dateStr);
        d.setDate(d.getDate() + dayOffset);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
    };

    const getDayLabel = (index: number) => {
        const hours = 10 + Math.floor(index * 2); // Mock start at 10 AM, add 2 hours per activity
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours;
        return `${displayHours}:00 ${ampm}`;
    };

    // --- ACTIONS (Edit Mode) ---
    const handleDelete = (id: string) => {
        if (!confirm("Remove this stop?")) return;
        const updated = localPlaces.filter(p => p.id !== id);
        setLocalPlaces(updated);
        if (onUpdatePlaces) onUpdatePlaces(updated);
    };

    const handleMove = (index: number, direction: 'UP' | 'DOWN') => {
        if (direction === 'UP' && index === 0) return;
        if (direction === 'DOWN' && index === localPlaces.length - 1) return;

        const newPlaces = [...localPlaces];
        const swapIndex = direction === 'UP' ? index - 1 : index + 1;

        // Swap
        [newPlaces[index], newPlaces[swapIndex]] = [newPlaces[swapIndex], newPlaces[index]];

        setLocalPlaces(newPlaces);
        if (onUpdatePlaces) onUpdatePlaces(newPlaces);
    };

    // Grouping logic (Simple: 3 items per day for demo)
    const placesPerDay = 3;
    const totalDays = Math.ceil(localPlaces.length / placesPerDay) || 1;

    return (
        <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200 w-full md:w-[480px] shadow-2xl z-20 overflow-hidden absolute left-0 top-0 pt-20 transition-all duration-300">

            {/* --- HEADER TABS --- */}
            <div className="bg-white px-6 pt-6 pb-0 border-b border-gray-200">
                <h2 className="text-2xl font-black text-gray-900 mb-1">{tripMeta.destination || 'Your Trip'}</h2>
                <p className="text-xs text-gray-500 mb-4 font-medium flex items-center gap-2">
                    🗓️ {tripMeta.dates?.start || 'TBD'} ⮕ {tripMeta.dates?.end || 'TBD'}
                    <span className="text-gray-300">|</span>
                    👥 {tripMeta.groupType} Trip
                </p>

                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'OVERVIEW' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        TIMELINE
                    </button>
                    <button
                        onClick={() => setActiveTab('EDITABLE')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'EDITABLE' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        EDIT & REORDER
                    </button>
                </div>
            </div>

            {/* --- SCROLLABLE CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-10 custom-scrollbar">

                {Array.from({ length: totalDays }).map((_, dayIndex) => {

                    // Get places for this day
                    const dayPlaces = localPlaces.slice(dayIndex * placesPerDay, (dayIndex + 1) * placesPerDay);
                    const startIndex = dayIndex * placesPerDay;

                    return (
                        <div key={dayIndex} className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: `${dayIndex * 100}ms` }}>

                            {/* Day Header Sticky */}
                            <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur py-2 mb-4 border-b border-gray-100 flex justify-between items-end">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded-md">Day {dayIndex + 1}</span>
                                    <h3 className="font-bold text-gray-900 text-lg leading-none mt-1">{formatDate(tripMeta.dates?.start, dayIndex)}</h3>
                                </div>
                            </div>

                            {/* Connector Line */}
                            <div className="absolute left-[27px] top-12 bottom-0 w-0.5 bg-gray-200 z-0"></div>

                            <div className="space-y-6 relative z-10">

                                {/* 1. MORNING TRANSPORT (Visual Only) */}
                                <div className="flex gap-4 items-start group">
                                    <div className="w-14 text-right pt-2">
                                        <span className="text-[10px] font-bold text-gray-400">09:00 AM</span>
                                    </div>
                                    <div className="relative">
                                        <div className="w-4 h-4 rounded-full bg-orange-100 border-2 border-orange-400 z-10 relative"></div>
                                    </div>
                                    <div className="flex-1 bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 flex items-center gap-3 hover:bg-orange-50 transition-colors">
                                        <span className="text-xl">🚗</span>
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">Start Day</p>
                                            <p className="text-[10px] text-gray-500">Departure from Hotel</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ACTIVITY CARDS */}
                                {dayPlaces.map((place, i) => {
                                    const globalIndex = startIndex + i;
                                    return (
                                        <div key={place.id} className="flex gap-4 items-start group">

                                            {/* Time Column */}
                                            <div className="w-14 text-right pt-2">
                                                <span className="text-[10px] font-bold text-gray-500">{getDayLabel(i)}</span>
                                            </div>

                                            {/* Dot & Connector */}
                                            <div className="relative pt-2">
                                                <div className={`w-4 h-4 rounded-full border-2 z-10 relative bg-white ${activeTab === 'EDITABLE' ? 'border-blue-500' : 'border-gray-800'}`}></div>
                                            </div>

                                            {/* CARD */}
                                            <div className={`flex-1 bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 ${activeTab === 'EDITABLE' ? 'border-blue-200 shadow-md translate-x-1' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>

                                                {/* Image (Overview Mode Only) */}
                                                {activeTab === 'OVERVIEW' && (
                                                    <div className="h-28 bg-gray-200 relative overflow-hidden">
                                                        <img src={place.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=500&q=60'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={place.name} />
                                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                                                            <div className="text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                                                                <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded">{place.type}</span>
                                                                {place.rating && <span>★ {place.rating}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="p-4">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className="font-bold text-sm text-gray-900 leading-snug">{place.name}</h4>
                                                        {activeTab === 'EDITABLE' && (
                                                            <button onClick={() => handleDelete(place.id)} className="text-gray-300 hover:text-red-500 transition-colors">🗑️</button>
                                                        )}
                                                    </div>

                                                    {activeTab === 'OVERVIEW' && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{place.description}</p>
                                                    )}

                                                    {/* EDIT CONTROLS */}
                                                    {activeTab === 'EDITABLE' && (
                                                        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
                                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                {place.time || 'Activity'}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleMove(globalIndex, 'UP')}
                                                                    disabled={globalIndex === 0}
                                                                    className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                >
                                                                    ⬆
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMove(globalIndex, 'DOWN')}
                                                                    disabled={globalIndex === localPlaces.length - 1}
                                                                    className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                                >
                                                                    ⬇
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* 3. LUNCH BREAK */}
                                <div className="flex gap-4 items-center opacity-70">
                                    <div className="w-14 text-right"></div>
                                    <div className="relative"><div className="w-3 h-3 rounded-full bg-gray-300 z-10 relative"></div></div>
                                    <div className="flex-1 py-3 border-t border-b border-gray-100 flex justify-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Lunch Break
                                    </div>
                                </div>

                            </div>
                        </div>
                    );
                })}

                {localPlaces.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <div className="text-4xl mb-4 grayscale">🏳️</div>
                        <p className="font-bold text-gray-400">Your itinerary is empty.</p>
                        <button onClick={() => window.location.reload()} className="mt-4 text-blue-500 text-xs font-bold hover:underline">Start Over</button>
                    </div>
                )}

                <div className="h-20"></div> {/* Spacer for bottom scroll */}
            </div>
        </div>
    );
}