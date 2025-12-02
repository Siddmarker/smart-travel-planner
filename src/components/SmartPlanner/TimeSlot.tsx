import React, { useState } from 'react';
import { Place } from '@/types';
import { PlaceCard } from './PlaceCard';
import { LoadingSpinner, ScoreBadge } from './Common';

interface TimeSlotProps {
    slotKey: string;
    label: string;
    time: string;
    places: Place[];
    selectedPlace: Place | null;
    onSelectPlace: (index: number | null) => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ slotKey, label, time, places, selectedPlace, onSelectPlace }) => {
    const [expanded, setExpanded] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const hasSelection = !!selectedPlace;

    return (
        <div className={`border rounded-xl mb-4 overflow-hidden transition-all duration-300 ${hasSelection ? 'border-green-400 shadow-sm' : 'border-gray-200'}`}>
            <div
                className={`flex justify-between items-center p-4 cursor-pointer transition-colors ${hasSelection ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'}`}
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <h3 className="font-bold text-lg text-gray-800">{label}</h3>
                    <span className="text-sm text-gray-500">{time}</span>
                </div>

                <div className="flex items-center gap-4">
                    {hasSelection ? (
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-green-200 shadow-sm">
                            <span className="font-medium text-gray-800">{selectedPlace.name}</span>
                            <ScoreBadge score={(selectedPlace as any).overallScore || 0} small />
                        </div>
                    ) : (
                        <span className="text-sm text-gray-500 italic flex items-center gap-1">
                            ⏳ Select an activity
                        </span>
                    )}
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                        {expanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex justify-end mb-4 gap-2">
                        <button
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            🖼️ Grid
                        </button>
                        <button
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                            onClick={() => setViewMode('list')}
                        >
                            📋 List
                        </button>
                    </div>

                    {places.length > 0 ? (
                        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {places.map((place, index) => (
                                <PlaceCard
                                    key={place.id || index}
                                    place={place}
                                    isSelected={selectedPlace?.id === place.id}
                                    rank={index + 1}
                                    onSelect={() => onSelectPlace(index)}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <LoadingSpinner size="small" />
                            <p className="mt-2 text-sm">Generating smart suggestions...</p>
                        </div>
                    )}

                    {hasSelection && (
                        <div className="mt-4 flex justify-end pt-4 border-t border-gray-100">
                            <button
                                className="text-sm text-red-500 hover:text-red-700 font-medium px-4 py-2 hover:bg-red-50 rounded transition-colors"
                                onClick={() => onSelectPlace(null)}
                            >
                                Change Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
