

// ==========================================
// CONFIGURATION & DICTIONARIES
// ==========================================

const KEYWORD_DICTIONARY: Record<string, string[]> = {
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
}

// ==========================================
// LOGIC IMPLEMENTATION
// ==========================================

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

    const cleanLocation = locationName.split(',')[0].trim();
    const currentHour = time.getHours();

    // ---------------------------------------------------------
    // PROTOCOL 2: "4 AM Biryani" (Time-Aware Search)
    // Trigger: 3 AM - 7 AM OR Query explicit mention
    // ---------------------------------------------------------
    const isEarlyMorning = (currentHour >= 3 && currentHour < 7);
    const isExplicitEarlyQuery = query.toLowerCase().includes('early morning') || query.toLowerCase().includes('4am');

    if (isEarlyMorning || isExplicitEarlyQuery) {
        strategy = 'EARLY_MORNING';
        radius = 35000; // Action A: Radius Expansion to 35km (Hoskote check)

        // Action B: Keyword Override
        // If query is generic like "food" or empty, force specific terms
        if (!query || query.toLowerCase().includes('food') || query.toLowerCase().includes('restaurant')) {
            // Randomly pick one or use a combined approach? For Maps Text Search, specificity is key.
            // We'll construct a "OR" style query naturally by asking for "Early morning biryani or breakfast"
            finalQuery = `Early morning biryani or Thatte Idli spots near ${cleanLocation}`;
        } else {
            // Append time context to existing query
            finalQuery = `${query} open now near ${cleanLocation}`;
        }

        // Return early to prioritize this specific use case? 
        // No, Jain logic might still apply (e.g. Jain at 4 AM), but "Military Hotel" clashes with Jain.
    }

    // ---------------------------------------------------------
    // PROTOCOL 1: "Strict Jain" Protocol
    // Trigger: Diet includes 'Jain'
    // ---------------------------------------------------------
    const dietFilters = filters.dietary || [];
    const isJain = dietFilters.includes('Jain');

    if (isJain) {
        strategy = 'JAIN_STRICT';
        // Layer 1 (Search Query): DO NOT search generic "Restaurants"

        // Force specific phrasing
        const jainKeywords = ['Pure Jain', 'Sattvic food', 'No onion no garlic'];

        // If the user typed "Italian", we make it "Pure Jain Italian..."
        if (query) {
            finalQuery = `Pure Jain ${query} near ${cleanLocation}`;
        } else {
            finalQuery = `Pure Jain restaurants near ${cleanLocation}`;
        }

        // Note: Negative filtering for 'pub' etc happens in post-processing or via Gemini
        // We can't strictly send "NOT pub" to Maps Text Search effectively in one go
    }

    // ---------------------------------------------------------
    // PROTOCOL 3: "Local Non-Veg" & "Local Gem" Unlock
    // Trigger: Category='Local' OR Query='Local'
    // ---------------------------------------------------------
    const isLocalCategory = category.toLowerCase() === 'local' || query.toLowerCase().includes('local');
    const isNonVeg = dietFilters.includes('Non-Vegetarian') || dietFilters.includes('Non-Veg');

    if (isLocalCategory) {
        if (!isJain && isNonVeg) {
            strategy = 'LOCAL_NON_VEG';
            // Action: Stop searching "Non-veg restaurant", Start searching "Military Hotel"
            const localTerms = KEYWORD_DICTIONARY['bangalore_non_veg'].join(' OR ');
            finalQuery = `${localTerms} near ${cleanLocation}`;
        } else if (isJain) {
            // Local + Jain = Bhojanalaya
            strategy = 'JAIN_STRICT'; // Keep strict jain strategy but enhance query
            const jainTerms = KEYWORD_DICTIONARY['jain_strict'].join(' OR ');
            finalQuery = `${jainTerms} near ${cleanLocation}`;
        } else {
            // General Local (could be veg or non-veg, but 'Local' usually implies these native spots)
            strategy = 'LOCAL_GEM';
            // Search for both Military Hotels AND Bhojanalayas/Khanavalis to get a mix?
            // Or just generic "Native Oota" terms?
            // Let's mix standard native terms if no diet specified
            const mixedTerms = [
                ...KEYWORD_DICTIONARY['bangalore_non_veg'],
                'Bhojanalaya',
                'Tiffin Room'
            ].join(' OR ');

            // If query has specifics, append them; otherwise use mixed terms
            if (query && !query.toLowerCase().includes('local')) {
                finalQuery = `${query} (Local famous) near ${cleanLocation}`;
            } else {
                finalQuery = `${mixedTerms} near ${cleanLocation}`;
            }
        }
    }

    // ---------------------------------------------------------
    // FINAL FALLBACK & FORMATTING
    // ---------------------------------------------------------

    // If we haven't completely overridden the query yet, ensure location is present
    if (strategy === 'STANDARD' && !finalQuery.toLowerCase().includes(cleanLocation.toLowerCase())) {
        finalQuery = `${finalQuery} near ${cleanLocation}`;
    }

    return {
        finalQuery,
        radius,
        searchType,
        strategy
    };
}

/**
 * Helper to identify if a place type is strictly forbidden for Jain users.
 */
export function isJainRestrictedType(types: string[]): boolean {
    return types.some(t => JAIN_RESTRICTED_TYPES.includes(t));
}
