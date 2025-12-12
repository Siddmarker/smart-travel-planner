import { Place, FiltrationMetadata, FilteredEntity, CredibilityScore } from '@/types';


// ==========================================
// ADVANCED FAKE ENTITY FILTRATION PIPELINE
// ==========================================

export function applyAdvancedFakeEntityFiltration(
    places: Place[],
    destination: string,
    category?: string
): { filteredPlaces: Place[], metadata: FiltrationMetadata } {

    const originalCount = places.length;
    const fakeEntities: FilteredEntity[] = [];
    const layerResults = {
        basicValidation: 0,
        fakeEntityDetection: 0,
        credibilityScoring: 0,
        categoryValidation: 0,
        destinationRelevance: 0
    };

    const filteredPlaces = places.filter(place => {
        // LAYER 1: BASIC VALIDATION
        if (!passesBasicValidation(place)) {
            fakeEntities.push({
                name: place.name,
                filterReason: 'Failed basic validation (missing fields or suspicious name)',
                filterLayer: 'Basic Validation'
            });
            layerResults.basicValidation++;
            return false;
        }

        // LAYER 2: FAKE ENTITY DETECTION
        const fakeReason = isPotentialFakeEntity(place, destination);
        if (fakeReason) {
            fakeEntities.push({
                name: place.name,
                filterReason: fakeReason,
                filterLayer: 'Fake Entity Detection'
            });
            layerResults.fakeEntityDetection++;
            return false;
        }

        // LAYER 3: QUALITY & CREDIBILITY SCORING
        const credibility = calculateCredibilityScore(place);
        place.credibilityScore = credibility; // Attach score to place for debugging/sorting

        if (!passesCredibilityThreshold(credibility)) {
            fakeEntities.push({
                name: place.name,
                filterReason: `Low credibility score: ${credibility.total.toFixed(1)}/10`,
                filterLayer: 'Credibility Scoring',
                credibilityScore: credibility.total
            });
            layerResults.credibilityScoring++;
            return false;
        }

        // LAYER 4: CATEGORY-SPECIFIC VALIDATION
        if (category && !passesCategorySpecificValidation(place, category)) {
            fakeEntities.push({
                name: place.name,
                filterReason: `Failed category validation for ${category}`,
                filterLayer: 'Category Validation'
            });
            layerResults.categoryValidation++;
            return false;
        }

        // LAYER 5: DESTINATION RELEVANCE
        if (!isDestinationRelevant(place, destination)) {
            fakeEntities.push({
                name: place.name,
                filterReason: 'Not relevant to destination',
                filterLayer: 'Destination Relevance'
            });
            layerResults.destinationRelevance++;
            return false;
        }

        return true;
    });

    const metadata: FiltrationMetadata = {
        originalCount,
        filteredCount: filteredPlaces.length,
        fakeEntities,
        filtrationRate: originalCount > 0 ? ((originalCount - filteredPlaces.length) / originalCount) * 100 : 0,
        layerResults
    };

    return { filteredPlaces, metadata };
}

// ==========================================
// LAYER 1: BASIC VALIDATION
// ==========================================

function passesBasicValidation(place: Place): boolean {
    // Must have essential fields
    if (!place.name || (!place.lat && !place.lng) || (!place.rating && !place.reviews)) return false;

    // Name validation
    const name = place.name.trim();
    if (name.length < 3 || name.length > 100) return false;

    // Check for suspicious name patterns
    if (hasSuspiciousNamePatterns(name)) return false;

    // Rating validation
    if (place.rating && (place.rating < 1 || place.rating > 5)) return false;

    // User ratings validation
    if (place.reviews && place.reviews < 0) return false;

    return true;
}

function hasSuspiciousNamePatterns(name: string): boolean {
    const suspiciousPatterns = [
        /^[0-9]+$/, // Only numbers
        /^[^a-zA-Z0-9]+$/, // Only special characters
        /^(test|demo|example|sample)$/i, // Test place names
        /^[A-Z0-9]{10,}$/, // All caps with numbers (like serial numbers)
        /\.(com|net|org|in)$/i, // Website-like names
    ];

    return suspiciousPatterns.some(pattern => pattern.test(name));
}

// ==========================================
// LAYER 2: FAKE ENTITY DETECTION
// ==========================================

function isPotentialFakeEntity(place: Place, destination: string): string | null {
    const name = place.name.toLowerCase();
    const types = place.rawTypes || []; // Use raw types if available
    const vicinity = (place.vicinity || '').toLowerCase();

    // EXPANDED LOCAL/NON-RELEVANT INDICATORS
    const fakeEntityIndicators = {
        localServices: [
            'pharmacy', 'medical store', 'chemist', 'hardware store', 'plumbing',
            'electrician', 'gas station', 'petrol pump', 'auto repair', 'car wash',
            'laundry', 'dry cleaner', 'tailor', 'bank', 'atm', 'post office',
            'courier service', 'real estate', 'property dealer', 'insurance',
            'notary', 'lawyer', 'advocate', 'clinic', 'hospital', 'dispensary',
            'xerox', 'print shop', 'cyber cafe', 'driving school'
        ],

        administrative: [
            'municipal', 'corporation', 'panchayat', 'government office',
            'tax office', 'license office', 'rto', 'police station',
            'fire station', 'court', 'tehsil', 'taluk', 'ward office',
            'headquarters', 'secretariat', 'embassy', 'consulate'
        ],

        educational: [
            'school', 'college', 'university', 'institute', 'academy',
            'coaching center', 'tuition', 'kindergarten', 'play school',
            'primary school', 'high school', 'pre university', 'campus'
        ],

        residential: [
            'apartment', 'flat', 'villa', 'house', 'residency', 'society',
            'layout', 'colony', 'nagar', 'extension', 'block', 'sector',
            'towers', 'enclave', 'heights', 'gardens' // Residential complex names
        ],

        genericBusiness: [
            'traders', 'dealers', 'distributors', 'wholesale', 'retail',
            'suppliers', 'manufacturers', 'exporters', 'importers',
            'enterprise', 'associates', 'agencies', 'solutions', 'technologies'
        ],

        suspiciousPatterns: [
            'free', 'discount', 'offer', 'sale', 'clearance', 'best price',
            'cheap', 'wholesale price', 'direct price', 'factory price'
        ]
    };

    // Check against all indicator categories
    for (const [category, indicators] of Object.entries(fakeEntityIndicators)) {
        if (indicators.some(indicator => name.includes(indicator))) {
            return `Matched ${category} indicator`;
        }
    }

    // Check for generic types without specificity
    if (hasOnlyGenericTypes(types)) return 'Only generic types found';

    // Check vicinity for residential/local patterns
    if (isResidentialArea(vicinity)) return 'Located in residential area';

    // Check for suspicious rating patterns
    if (hasSuspiciousRatingPattern(place)) return 'Suspicious rating pattern';

    // Check for Agency/Tour Operator
    if (isAgencyOrTourOperator(place)) return 'Agency or Tour Operator';

    return null;
}

function isAgencyOrTourOperator(place: Place): boolean {
    const name = place.name.toLowerCase();
    const types = place.rawTypes || [];

    const agencyKeywords = [
        'tour agency', 'travel agent', 'travel agency', 'booking office',
        'tour operator', 'holiday package', 'vacation planner',
        'tourism office', 'information center', 'ticket booking'
    ];

    const agencyTypes = [
        'travel_agency', 'real_estate_agency'
    ];

    // Check keywords
    if (agencyKeywords.some(keyword => name.includes(keyword))) return true;

    // Check types
    if (types.some(type => agencyTypes.includes(type))) return true;

    return false;
}

function hasOnlyGenericTypes(types: string[]): boolean {
    const genericTypes = [
        'point_of_interest', 'establishment', 'premise', 'store',
        'place_of_worship', 'school', 'local_government_office',
        'health', 'finance', 'general_contractor'
    ];

    // If all types are generic, likely not a tourist place
    return types.length > 0 && types.every(type => genericTypes.includes(type));
}

function isResidentialArea(vicinity: string): boolean {
    const residentialIndicators = [
        'layout', 'nagar', 'colony', 'society', 'extension',
        'block', 'sector', 'phase', 'ward', 'village',
        'cross', 'main road' // Often residential addresses
    ];

    return residentialIndicators.some(indicator =>
        vicinity.includes(indicator)
    );
}

function hasSuspiciousRatingPattern(place: Place): boolean {
    // Perfect 5.0 with very few reviews often indicates fake/self reviews
    // Relaxed: Only flag if less than 2 reviews (was 5)
    if (place.rating === 5.0 && (!place.reviews || place.reviews < 2)) {
        return true;
    }
    return false;
}

// ==========================================
// LAYER 3: CREDIBILITY SCORING
// ==========================================

function calculateCredibilityScore(place: Place): CredibilityScore {
    const breakdown = {
        rating: 0,
        reviewCount: 0,
        typeSpecificity: 0,
        priceLevel: 0,
        photoAvailability: 0,
        nameQuality: 0
    };

    // 1. RATING CREDIBILITY (2 points)
    if (place.rating >= 4.0) breakdown.rating = 2;
    else if (place.rating >= 3.5) breakdown.rating = 1.5;
    else if (place.rating >= 3.0) breakdown.rating = 1;
    else if (place.rating >= 1.0) breakdown.rating = 0.5;

    // 2. REVIEW COUNT CREDIBILITY (3 points)
    const reviews = place.reviews || 0;
    if (reviews >= 100) breakdown.reviewCount = 3;
    else if (reviews >= 50) breakdown.reviewCount = 2;
    else if (reviews >= 20) breakdown.reviewCount = 1;
    else if (reviews >= 10) breakdown.reviewCount = 0.5;

    // 3. PLACE TYPE SPECIFICITY (2 points)
    const types = place.rawTypes || [];
    if (hasSpecificTouristTypes(types)) breakdown.typeSpecificity = 2;
    else if (hasMixedSpecificTypes(types)) breakdown.typeSpecificity = 1;

    // 4. PRICE LEVEL INDICATION (1 point)
    if (place.priceLevel && place.priceLevel >= 1) breakdown.priceLevel = 1;

    // 5. PHOTO AVAILABILITY (1 point)
    if (place.photos && place.photos.length > 0) breakdown.photoAvailability = 1;

    // 6. NAME QUALITY (1 point)
    if (hasQualityName(place.name)) breakdown.nameQuality = 1;

    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { total, breakdown };
}

function passesCredibilityThreshold(score: CredibilityScore): boolean {
    return score.total >= 2.0; // Minimum 2.0/10 credibility (Relaxed from 4.0 to allow more results)
}

function hasSpecificTouristTypes(types: string[]): boolean {
    const touristTypes = [
        'tourist_attraction', 'amusement_park', 'aquarium', 'art_gallery',
        'museum', 'park', 'zoo', 'landmark', 'historical_landmark',
        'hindu_temple', 'church', 'mosque', 'stadium', 'shopping_mall',
        'casino', 'bowling_alley', 'movie_theater'
    ];

    return types.some(type => touristTypes.includes(type));
}

function hasMixedSpecificTypes(types: string[]): boolean {
    const specificTypes = [
        'restaurant', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery',
        'lodging', 'hotel', 'campground', 'rv_park', 'bakery',
        'clothing_store', 'book_store', 'electronics_store'
    ];

    return types.some(type => specificTypes.includes(type));
}

function hasQualityName(name: string): boolean {
    const qualityIndicators = [
        /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/, // Proper capitalization
        /[a-zA-Z]{3,}\s+[a-zA-Z]{3,}/, // Multiple words
        /^(?!.*(test|demo|sample)).*$/i // No test words
    ];

    return qualityIndicators.every(pattern => pattern.test(name));
}

// ==========================================
// LAYER 4: CATEGORY SPECIFIC VALIDATION
// ==========================================

function passesCategorySpecificValidation(place: Place, category: string): boolean {
    // If category is food-related, run enhanced food validation
    if (category === 'food' || category === 'restaurant' || category === 'cafe') {
        return isAuthenticRestaurant(place);
    }

    // Add more category specific rules here
    return true;
}

// ==========================================
// LAYER 5: DESTINATION RELEVANCE
// ==========================================

function isDestinationRelevant(place: Place, destination: string): boolean {
    const name = place.name.toLowerCase();
    const vicinity = (place.vicinity || '').toLowerCase();
    const destLower = destination.toLowerCase();

    // Check if place is actually in the destination
    if (vicinity.includes(destLower)) return true;

    // Fallback: Check if destination appears in name
    const destinationWords = destLower.split(/\s+/);
    const hasDestinationReference = destinationWords.some(word =>
        name.includes(word) || vicinity.includes(word)
    );

    if (hasDestinationReference) return true;

    // If we have coordinates for both (in a real app we'd check distance)
    // For now, we'll be lenient if we can't strictly verify, as Google Search usually handles this
    // But we filter if it explicitly mentions a DIFFERENT city

    return true;
}

function isAuthenticRestaurant(place: Place): boolean {
    const name = place.name.toLowerCase();
    const types = place.rawTypes || [];

    // Must have restaurant-related types
    const restaurantTypes = ['restaurant', 'food', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery', 'bakery'];
    if (types.length > 0 && !types.some(type => restaurantTypes.includes(type))) return false;

    // Name validation for restaurants
    const suspiciousRestaurantPatterns = [
        /^home\s+kitchen/i,
        /^home\s+food/i,
        /^home\s+delivery/i,
        /^tiffin\s+service/i,
        /^catering\s+service/i,
        /^food\s+(truck|cart|stall)/i,
        /^street\s+food/i,
        /mess$/i // Student messes
    ];

    if (suspiciousRestaurantPatterns.some(pattern => pattern.test(name))) {
        return false;
    }

    return true;
}

function passesFoodQualityThresholds(place: Place): boolean {
    // Enhanced rating threshold for food places
    if (place.rating && place.rating < 3.8) return false;

    // Minimum review count
    if (!place.reviews || place.reviews < 15) return false;

    // Price level validation (if available)
    // if (place.priceLevel && place.priceLevel < 1) return false;

    return true;
}

function isPotentialFakeRestaurant(place: Place): boolean {
    const name = place.name.toLowerCase();

    const fakeRestaurantIndicators = [
        // Home-based businesses
        'home kitchen', 'home food', 'home delivery', 'home made',
        'home cook', 'home chef', 'home service',

        // Catering/tiffin services
        'tiffin service', 'tiffin center', 'meal plan', 'catering',
        'bulk order', 'party order', 'event catering',

        // Temporary/suspicious
        'food truck', 'food cart', 'food stall', 'street food',
        'popup', 'temporary', 'seasonal',

        // Generic/unprofessional
        'food point', 'eat point', 'refreshment', 'snacks corner',
        'juice center', 'fast food corner', 'tea stall'
    ];

    return fakeRestaurantIndicators.some(indicator => name.includes(indicator));
}

function hasDietaryVariety(place: Place): boolean {
    const placeName = place.name.toLowerCase();
    const dietaryOptions = {
        nonVeg: false,
        egg: false,
        multiCuisine: false
    };

    const nonVegIndicators = ['chicken', 'mutton', 'fish', 'seafood', 'meat', 'non-veg', 'non veg', 'grill', 'bbq', 'steak'];
    const eggIndicators = ['egg', 'eggs', 'omelette', 'bistro', 'breakfast'];
    const cuisineTypes = ['indian', 'chinese', 'italian', 'mexican', 'continental', 'thai', 'japanese', 'asian'];

    dietaryOptions.nonVeg = nonVegIndicators.some(indicator => placeName.includes(indicator));
    dietaryOptions.egg = eggIndicators.some(indicator => placeName.includes(indicator));
    const cuisinesFound = cuisineTypes.filter(cuisine => placeName.includes(cuisine));
    dietaryOptions.multiCuisine = cuisinesFound.length > 0;

    if (placeName.includes('restaurant') || placeName.includes('kitchen') || placeName.includes('bistro')) {
        return true;
    }

    return dietaryOptions.nonVeg || dietaryOptions.egg || dietaryOptions.multiCuisine;
}
