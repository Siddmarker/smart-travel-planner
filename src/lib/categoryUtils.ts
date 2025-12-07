import { Place } from '@/types';

interface CategoryConfig {
    apiTypes: string[];
    keywords: string[];
    exclude: string[];
    requiredTypes?: string[];
    excludedTypes?: string[];
    excludedKeywords?: string[];
}

export const categoryMapping: Record<string, CategoryConfig> = {
    'hiking': {
        apiTypes: ['park', 'natural_feature', 'campground', 'hiking_area', 'tourist_attraction'],
        keywords: ['hiking', 'trail', 'trek', 'trekking', 'mountain', 'hill', 'forest', 'nature', 'walk', 'climb', 'peak', 'valley', 'waterfall', 'national park', 'wildlife'],
        exclude: ['shopping_mall', 'restaurant', 'hotel', 'lodging', 'store', 'university', 'college', 'school', 'hospital', 'bank', 'insurance_agency', 'real_estate_agency', 'car_dealer', 'car_repair', 'lawyer', 'accounting'],
        requiredTypes: ['park', 'natural_feature', 'campground', 'hiking_area', 'tourist_attraction'],
        excludedTypes: ['university', 'college', 'school', 'hospital', 'store', 'shopping_mall', 'restaurant', 'hotel', 'lodging', 'cafe', 'food', 'bank', 'insurance_agency', 'real_estate_agency', 'car_dealer', 'car_repair', 'lawyer', 'accounting'],
        excludedKeywords: ['college', 'school', 'hotel', 'restaurant', 'cafe', 'shop', 'store', 'trading', 'company', 'corporation', 'enterprise', 'pharmacy', 'medical', 'hospital', 'clinic']
    },
    'nature': {
        apiTypes: ['park', 'natural_feature', 'zoo', 'aquarium', 'botanical_garden'],
        keywords: ['nature', 'wildlife', 'forest', 'garden', 'lake', 'river', 'beach'],
        exclude: ['mall', 'cinema', 'casino', 'shopping']
    },
    'food': {
        apiTypes: ['restaurant', 'cafe', 'food', 'bakery', 'meal_takeaway'],
        keywords: ['restaurant', 'cafe', 'dining', 'food', 'kitchen', 'bistro'],
        exclude: ['park', 'museum', 'lodging']
    },
    'attractions': {
        apiTypes: ['tourist_attraction', 'museum', 'art_gallery', 'point_of_interest', 'place_of_worship'],
        keywords: ['attraction', 'landmark', 'monument', 'sight', 'tour'],
        exclude: ['lodging', 'restaurant'] // Keep it broad but exclude pure utility
    },
    'adventure': {
        apiTypes: ['amusement_park', 'stadium', 'ski_resort', 'campground'],
        keywords: ['adventure', 'sports', 'activities', 'outdoor', 'rafting', 'bungee', 'skydiving'],
        exclude: ['spa', 'library']
    },
    'shopping': {
        apiTypes: ['shopping_mall', 'store', 'clothing_store'],
        keywords: ['mall', 'shop', 'market', 'store', 'boutique'],
        exclude: ['park', 'restaurant']
    },
    'nightlife': {
        apiTypes: ['night_club', 'bar', 'casino'],
        keywords: ['club', 'bar', 'pub', 'lounge', 'nightlife'],
        exclude: ['park', 'school']
    },
    'culture': {
        apiTypes: ['museum', 'art_gallery', 'library', 'church', 'hindu_temple', 'mosque', 'synagogue'],
        keywords: ['museum', 'art', 'history', 'culture', 'temple', 'gallery'],
        exclude: ['night_club', 'bar']
    },
    'offroading': {
        apiTypes: ['park', 'natural_feature', 'point_of_interest', 'tourist_attraction'],
        keywords: ['offroad', 'off-road', 'dirt bike', 'atv', '4x4', 'motocross', 'enduro', 'trail', 'track', 'adventure'],
        exclude: ['store', 'rental', 'shop', 'repair', 'school', 'training']
    },
    'stay': {
        apiTypes: ['lodging', 'campground'],
        keywords: ['hotel', 'resort', 'homestay', 'lodge', 'guesthouse', 'inn', 'stay', 'accommodation', 'villa', 'cottage', 'hostel'],
        exclude: ['restaurant', 'bar', 'gym', 'spa', 'airport'] // Exclude amenities that might be standalone
    }
};

export function smartCategoryFilter(places: Place[], category: string): Place[] {
    if (!category || !categoryMapping[category]) return places;

    const config = categoryMapping[category];

    return places.filter(place => {
        // Special strict handling for hiking
        if (category === 'hiking') {
            // 1. Check Excluded Types (if we had raw types, but we map them to place.category usually, or we can't check easily without raw types)
            // Since we don't have raw Google types on the Place object easily available here (unless we added them),
            // we rely heavily on name and description keywords.

            // 2. Check Excluded Keywords in Name (Immediate Rejection)
            if (config.excludedKeywords?.some(keyword => place.name.toLowerCase().includes(keyword))) {
                return false;
            }

            // 3. Check Required Keywords in Name or Description
            const hasRequiredKeyword = config.keywords.some(keyword =>
                place.name.toLowerCase().includes(keyword) ||
                (place.description && place.description.toLowerCase().includes(keyword))
            );

            if (!hasRequiredKeyword) return false;

            return true;
        }

        // Standard filtering for other categories
        const name = place.name.toLowerCase();
        const desc = place.description?.toLowerCase() || '';

        const keywordMatch = config.keywords.some(keyword =>
            name.includes(keyword) || desc.includes(keyword)
        );

        const isExcluded = config.exclude.some(excluded =>
            name.includes(excluded) || desc.includes(excluded) || place.category === excluded
        );

        const categoryMatch = place.category === category;

        return (categoryMatch || keywordMatch) && !isExcluded;
    });
}

// Fallback hiking spots for specific cities
export const fallbackHikingSpots: Record<string, string[]> = {
    'bangalore': [
        'Nandi Hills', 'Bannerghatta National Park', 'Lalbagh Botanical Garden',
        'Cubbon Park', 'Savanadurga Hills', 'Skandagiri Hills', 'Makalidurga'
    ],
    'goa': [
        'Dudhsagar Falls', 'Mollem National Park', 'Bhagwan Mahavir Wildlife Sanctuary',
        'Netravali Wildlife Sanctuary', 'Cotigao Wildlife Sanctuary'
    ]
};
