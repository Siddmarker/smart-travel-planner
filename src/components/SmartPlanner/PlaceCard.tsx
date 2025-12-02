import React from 'react';
import { Place } from '@/types';
import { Chip, ScoreBadge } from './Common';

interface PlaceCardProps {
    place: Place & {
        opening_hours?: string;
        is_open_now?: boolean;
        travel_time_from_previous?: string;
        cost_range?: string;
        feasibility_score?: number;
        unique_selling_point?: string;
        overallScore?: number;
    };
    isSelected?: boolean;
    rank?: number;
    onSelect?: () => void;
    viewMode?: 'grid' | 'list';
}

export const PlaceCard: React.FC<PlaceCardProps> = ({ place, isSelected, rank, onSelect, viewMode = 'grid' }) => {
    const isGridView = viewMode === 'grid';

    return (
        <div
            className={`
                border rounded-lg p-4 mb-3 bg-white transition-all duration-300 cursor-pointer relative
                ${isSelected ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:shadow-lg hover:border-blue-500 hover:-translate-y-1'}
                ${isGridView ? 'flex flex-col h-full' : 'flex flex-row gap-4'}
            `}
            onClick={!isSelected ? onSelect : undefined}
        >
            {/* Rank Badge */}
            {rank && (
                <div className="absolute -top-2 -left-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm z-10">
                    #{rank}
                </div>
            )}

            {/* Image Placeholder if needed */}
            {/* <div className="h-32 bg-gray-200 rounded-md mb-3"></div> */}

            <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{place.name}</h4>
                    <div className="flex gap-1 flex-wrap justify-end">
                        <Chip label={place.category || 'Activity'} color="blue" />
                        {place.cost_range && <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">{place.cost_range}</span>}
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{place.description}</p>

                <div className="space-y-1 text-sm text-gray-500 mb-3">
                    {place.opening_hours && (
                        <div className="flex items-center gap-2">
                            <span>🕒</span> <span>{place.opening_hours}</span>
                        </div>
                    )}
                    {place.travel_time_from_previous && (
                        <div className="flex items-center gap-2">
                            <span>🚶</span> <span>{place.travel_time_from_previous}</span>
                        </div>
                    )}
                    {place.unique_selling_point && (
                        <div className="flex items-center gap-2">
                            <span>🎯</span> <span className="italic">{place.unique_selling_point}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <ScoreBadge score={place.overallScore || (place.feasibility_score ? place.feasibility_score * 10 : 0)} label="Score" showPercentage small />
                    </div>

                    {!isSelected ? (
                        <button
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect && onSelect();
                            }}
                        >
                            Select
                        </button>
                    ) : (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                            ✅ Selected
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
