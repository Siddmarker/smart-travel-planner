

// ==========================================
// CONFIGURATION & DICTIONARIES
// ==========================================

export const KEYWORD_DICTIONARY: Record<string, string[]> = {
    // 3. Local Non-Veg Unlock
    'bangalore_non_veg': [
        'Military Hotel',
        'Nati Style Hotel',
        'Donne Biryani',
        'Gowda Oota',
        'Khanavali',
        'Andhra Mess'
    ],
    // 2. 4 AM Biryani Logic
    'early_morning': [
        'Pulav point',
        'Thatte Idli',
        'Dum Biryani',
        'Early morning breakfast'
    ],
    // 4. Strict Jain
    'jain_strict': [
        'Pure Veg Jain Options',
        'Bhojanalaya',
        'Asafoetida free food',
        'Sattvic food'
    ]
};

const JAIN_RESTRICTED_TYPES = ['pub', 'bar', 'night_club', 'liquor_store', 'casino'];

// ==========================================
// TYPES
// ==========================================

export interface SearchQueryOptions {
    query: string;
    locationName?: string;
    category?: string;
    filters?: {
        dietary?: string[];
        cuisine?: string[];
        [key: string]: any;
    };
    time?: Date; // For testing or explicit time overrides
}

export interface SearchResultMetadata {
    finalQuery: string;
    radius: number; // In meters
    searchType?: string; // e.g., 'restaurant', 'cafe', etc.
    strategy: 'STANDARD' | 'JAIN_STRICT' | 'EARLY_MORNING' | 'LOCAL_NON_VEG' | 'LOCAL_GEM';
    fallbackQuery?: string;
}

// ==========================================
// LOGIC IMPLEMENTATION
// ==========================================

/**
 * Constructs the specialized Google Maps query based on User Protocols.
 */
/**
 * Constructs the specialized Google Maps query based on User Protocols.
 */
export function constructMapsQuery(options: SearchQueryOptions): SearchResultMetadata {
    const { query, locationName = '', category = '', filters = {}, time = new Date() } = options;

    // Default values
    let finalQuery = query;
    let radius = 5000; // Default 5km
    let searchType: string | undefined = undefined;
    let strategy: SearchResultMetadata['strategy'] = 'STANDARD';
    let fallbackQuery: string | undefined = undefined;

    const cleanLocation = locationName.split(',')[0].trim();
    const currentHour = time.getHours();

    // ---------------------------------------------------------
    // PROTOCOL 2: "4 AM Biryani" (Time-Aware Search)
    // ---------------------------------------------------------
    const isEarlyMorning = (currentHour >= 3 && currentHour < 7);
    const isExplicitEarlyQuery = query.toLowerCase().includes('early morning') || query.toLowerCase().includes('4am');

    if (isEarlyMorning || isExplicitEarlyQuery) {
        strategy = 'EARLY_MORNING';
        radius = 35000; // Action A: Radius Expansion to 35km (Hoskote check)

        // Action B: Keyword Override
        if (!query || query.toLowerCase().includes('food') || query.toLowerCase().includes('restaurant')) {
            finalQuery = `Early morning biryani or Thatte Idli spots near ${cleanLocation}`;
        } else {
            finalQuery = `${query} open now near ${cleanLocation}`;
        }
    }
    // ---------------------------------------------------------
    // SMART QUERY INJECTION (Filter-Driven)
    // ---------------------------------------------------------
    else {
        // Construct base specific query modifiers from filters
        const descriptors: string[] = [];

        // 1. Establishment Type (e.g. "Rooftop", "Fine Dining")
        if (filters.establishmentType && filters.establishmentType.length > 0) {
            descriptors.push(...filters.establishmentType);
        }

        // 2. Features (e.g. "Live Music", "Pet Friendly")
        if (filters.features && filters.features.length > 0) {
            descriptors.push(...filters.features);
        }

        // 3. Cuisine
        if (filters.cuisine && filters.cuisine.length > 0) {
            descriptors.push(...filters.cuisine);
        }

        // 4. Category (if generic like 'food', 'restaurants' -> 'restaurant')
        let baseTerm = 'places';
        if (category === 'food' || category === 'restaurants') baseTerm = 'restaurant';
        else if (category === 'cafes') baseTerm = 'cafe';
        else if (category === 'nightlife') baseTerm = 'night club';
        else if (category) baseTerm = category;

        // ---------------------------------------------------------
        // PROTOCOL 3: Specific Local Mappings (Bangalore Context)
        // ---------------------------------------------------------
        const dietFilters = filters.dietary || [];
        const isNonVeg = dietFilters.includes('Non-Vegetarian') || dietFilters.includes('Non-Veg');
        const isVeg = dietFilters.includes('Vegetarian');
        const isFamousLocal = filters.establishmentType?.includes('Famous Local');

        if (isFamousLocal) {
            strategy = 'LOCAL_GEM';
            if (isNonVeg) {
                // "Famous Local" + "Non-Veg" -> Military Hotel
                baseTerm = KEYWORD_DICTIONARY['bangalore_non_veg'].join(' OR ');
                // Remove 'Famous Local' from descriptors to avoid redundancy in query string if we inject specific terms
                const idx = descriptors.indexOf('Famous Local');
                if (idx > -1) descriptors.splice(idx, 1);
            } else if (isVeg) {
                // "Famous Local" + "Veg" -> Tiffin Room
                baseTerm = 'Tiffin Room OR Darshini OR Bhavan';
                const idx = descriptors.indexOf('Famous Local');
                if (idx > -1) descriptors.splice(idx, 1);
            }
        }

        // ---------------------------------------------------------
        // PROTOCOL 1: Strict Jain
        // ---------------------------------------------------------
        const isJain = dietFilters.includes('Jain');
        if (isJain) {
            strategy = 'JAIN_STRICT';
            descriptors.push('Pure Jain');
            descriptors.push('No Onion No Garlic');
            // We append these to ensure Google Text Search prioritizes them
        }


        // Construct Final Query
        // Combine descriptors + baseTerm
        // e.g. "Rooftop Live Music Italian restaurant"
        const descriptorString = descriptors.join(' ');

        // If user typed a query, we combine or prefer it?
        // User query is highest intent.
        if (query) {
            finalQuery = `${descriptorString} ${query} near ${cleanLocation}`;
        } else {
            finalQuery = `${descriptorString} ${baseTerm} near ${cleanLocation}`;
        }

        // Clean up double spaces
        finalQuery = finalQuery.replace(/\s+/g, ' ').trim();

        // ---------------------------------------------------------
        // FALLBACK MECHANISM (Relaxed Query)
        // ---------------------------------------------------------
        // If the query is very complex (has descriptors), create a fallback
        if (descriptors.length > 0) {
            // Fallback: Just the category/base term and maybe main cuisine
            let fallbackDescriptors = [];
            if (filters.cuisine && filters.cuisine.length > 0) fallbackDescriptors.push(filters.cuisine[0]);
            // Maybe keep establishment type if it's broad like "Cafe"

            const fallbackBase = query || baseTerm; // Keep user query if exists
            fallbackQuery = `Top rated ${fallbackDescriptors.join(' ')} ${fallbackBase} near ${cleanLocation}`.replace(/\s+/g, ' ').trim();
        }
    }

    return {
        finalQuery,
        radius,
        searchType,
        strategy,
        fallbackQuery
    };
}

/**
 * Helper to identify if a place type is strictly forbidden for Jain users.
 */
export function isJainRestrictedType(types: string[]): boolean {
    return types.some(t => JAIN_RESTRICTED_TYPES.includes(t));
}
