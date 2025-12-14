import { Place, DiscoveryFiltrationMetadata, FilteredEntity } from '@/types';
import { calculateRealDistances } from './googleMapsService';

// ==========================================
// DISCOVERY PAGE FILTRATION PIPELINE
// ==========================================

export function applyDiscoveryFiltrationPipeline(
    places: Place[],
    destination: string,
    category: string
): { filteredPlaces: Place[], metadata: DiscoveryFiltrationMetadata } {

    const originalCount = places.length;
    const fakeEntities: FilteredEntity[] = [];
    const layerResults = {
        basicValidation: 0,
        fakeEntityDetection: 0,
        credibilityScoring: 0,
        categoryValidation: 0,
        destinationRelevance: 0
    };

    let filteredPlaces = places;

    // STAGE 1: BASIC VALIDATION
    filteredPlaces = filteredPlaces.filter(place => {
        if (!passesBasicDiscoveryValidation(place)) {
            fakeEntities.push({
                name: place.name,
                filterReason: 'Failed basic validation',
                filterLayer: 'Basic Validation'
            });
            layerResults.basicValidation++;
            return false;
        }
        return true;
    });

    // STAGE 2: FAKE ENTITY DETECTION (DISABLED - Too aggressive for generic results)
    // filteredPlaces = filteredPlaces.filter(place => {
    //     const fakeReason = isDiscoveryFakeEntity(place, destination, category);
    //     if (fakeReason) {
    //         fakeEntities.push({
    //             name: place.name,
    //             filterReason: fakeReason,
    //             filterLayer: 'Fake Entity Detection'
    //         });
    //         layerResults.fakeEntityDetection++;
    //         return false;
    //     }
    //     return true;
    // });

    // STAGE 3: CATEGORY RELEVANCE
    filteredPlaces = filteredPlaces.filter(place => {
        if (!isCategoryRelevant(place, category)) {
            fakeEntities.push({
                name: place.name,
                filterReason: `Not relevant to category: ${category}`,
                filterLayer: 'Category Relevance'
            });
            layerResults.categoryValidation++;
            return false;
        }
        return true;
    });

    // STAGE 4: QUALITY THRESHOLDS
    filteredPlaces = filteredPlaces.filter(place => {
        if (!passesDiscoveryQualityThreshold(place, category)) {
            fakeEntities.push({
                name: place.name,
                filterReason: 'Below quality threshold',
                filterLayer: 'Quality Threshold'
            });
            layerResults.credibilityScoring++;
            return false;
        }
        return true;
    });

    // STAGE 5: DESTINATION RELEVANCE (DISABLED - Too aggressive)
    // filteredPlaces = filteredPlaces.filter(place => {
    //     if (!isDiscoveryDestinationRelevant(place, destination)) {
    //         fakeEntities.push({
    //             name: place.name,
    //             filterReason: 'Not relevant to destination',
    //             filterLayer: 'Destination Relevance'
    //         });
    //         layerResults.destinationRelevance++;
    //         return false;
    //     }
    //     return true;
    // });

    const metadata: DiscoveryFiltrationMetadata = {
        originalCount,
        filteredCount: filteredPlaces.length,
        fakeEntities,
        filtrationRate: originalCount > 0 ? ((originalCount - filteredPlaces.length) / originalCount) * 100 : 0,
        layerResults
    };

    return { filteredPlaces, metadata };
}

// ==========================================
// STAGE 1: BASIC VALIDATION
// ==========================================

function passesBasicDiscoveryValidation(place: Place): boolean {
    // Enhanced field validation
    if (!place.name || place.name.trim().length < 2) return false;

    // Name pattern validation
    const name = place.name.trim();
    if (hasInvalidDiscoveryName(name)) return false;

    // Rating validation
    if (place.rating && (place.rating < 1 || place.rating > 5)) return false;

    // Review count validation
    if (place.reviews && place.reviews < 0) return false;

    return true;
}

function hasInvalidDiscoveryName(name: string): boolean {
    const invalidPatterns = [
        /^[0-9\s\W]+$/, // Only numbers/special characters
        /^(test|demo|sample|placeholder)/i,
        /\.(com|org|net|in|co)$/i, // Website domains
        /^[A-Z0-9\W_]{15,}$/, // Serial-like names
        /^(admin|system|user|default)/i,
        /^[#@!$%^&*()]+$/ // Only special characters
    ];

    return invalidPatterns.some(pattern => pattern.test(name));
}

// ==========================================
// STAGE 2: FAKE ENTITY DETECTION
// ==========================================

function isDiscoveryFakeEntity(place: Place, destination: string, category: string): string | null {
    const name = place.name.toLowerCase();
    const types = place.rawTypes || [];
    const vicinity = (place.vicinity || '').toLowerCase();

    // COMPREHENSIVE FAKE ENTITY INDICATORS FOR DISCOVERY
    const discoveryFakeIndicators = {
        // Local Services & Utilities
        localServices: [
            'pharmacy', 'medical store', 'chemist', 'hardware', 'plumb', 'electric',
            'gas station', 'petrol', 'auto repair', 'car service', 'mechanic',
            'laundry', 'dry clean', 'tailor', 'bank', 'atm', 'post office',
            'courier', 'dhl', 'fedex', 'real estate', 'property', 'insurance',
            'notary', 'lawyer', 'advocate', 'clinic', 'hospital', 'dispensary'
        ],

        // Administrative & Government
        administrative: [
            'municipal', 'corporation', 'panchayat', 'government', 'tax office',
            'license', 'rto', 'police', 'fire station', 'court', 'tehsil', 'taluk'
        ],

        // Educational Institutions
        educational: [
            'school', 'college', 'university', 'institute', 'academy',
            'coaching', 'tuition', 'kindergarten', 'play school', 'puc',
            'degree college', 'engineering college', 'medical college'
        ],

        // Residential & Commercial Complexes
        residential: [
            'apartment', 'flat', 'villa', 'house', 'residency', 'society',
            'layout', 'colony', 'nagar', 'extension', 'block', 'sector',
            'phase', 'ward', 'village', 'area', 'locality'
        ],

        // Generic Businesses
        genericBusiness: [
            'traders', 'dealers', 'distributors', 'wholesale', 'retail',
            'suppliers', 'manufacturers', 'exporters', 'importers', 'agency'
        ],

        // Suspicious & Low-Quality Patterns
        suspiciousPatterns: [
            'free', 'discount', 'offer', 'sale', 'clearance', 'best price',
            'cheap', 'wholesale price', 'direct price', 'factory price',
            'contact us', 'call now', 'whatsapp', 'home delivery',
            '24/7', 'quick service', 'immediate', 'urgent'
        ],

        // Temporary/Popup Entities
        temporary: [
            'food truck', 'food cart', 'food stall', 'street food', 'popup',
            'temporary', 'seasonal', 'festival', 'exhibition', 'fair'
        ]
    };

    // Check all indicator categories
    for (const [indicatorCategory, indicators] of Object.entries(discoveryFakeIndicators)) {
        if (indicators.some(indicator => name.includes(indicator))) {
            return `Matched ${indicatorCategory} indicator`;
        }
    }

    // Check for generic types without specificity
    if (hasOnlyGenericDiscoveryTypes(types)) return 'Only generic types found';

    // Check vicinity for residential/local patterns
    if (isDiscoveryResidentialArea(vicinity)) return 'Located in residential area';

    // Category-specific fake detection
    const categoryFakeReason = isCategorySpecificFakeEntity(place, category);
    if (categoryFakeReason) return categoryFakeReason;

    return null;
}

function hasOnlyGenericDiscoveryTypes(types: string[]): boolean {
    const overlyGenericTypes = [
        'point_of_interest', 'establishment', 'premise', 'store',
        'place_of_worship', 'school', 'local_government_office'
    ];

    // If all types are generic and no specific types
    const hasOnlyGeneric = types.every(type => overlyGenericTypes.includes(type));
    const hasNoSpecificTypes = !types.some(type =>
        type.includes('restaurant') || type.includes('park') ||
        type.includes('museum') || type.includes('tourist')
    );

    return hasOnlyGeneric && hasNoSpecificTypes;
}

function isDiscoveryResidentialArea(vicinity: string): boolean {
    const residentialPatterns = [
        /(\d+)(st|nd|rd|th)\s+(cross|main|road|street)/i,
        /(layout|nagar|colony|society|extension|block|sector|phase|ward|village)/i,
        /^(?!.*(mall|market|center|downtown|city)).*$/i
    ];

    return residentialPatterns.some(pattern => pattern.test(vicinity));
}

// ==========================================
// STAGE 3: CATEGORY RELEVANCE
// ==========================================

function isCategoryRelevant(place: Place, category: string): boolean {
    if (!category) return true; // No category selected, so relevant

    const types = place.rawTypes || [];

    const categoryTypeMap: Record<string, string[]> = {
        'restaurants': ['restaurant', 'food', 'cafe', 'bar', 'meal_takeaway'],
        'cafes': ['cafe', 'bakery', 'food', 'restaurant'],
        'parks': ['park', 'recreation', 'nature', 'garden'],
        'museums': ['museum', 'art_gallery', 'historical_landmark'],
        'shopping': ['shopping_mall', 'store', 'department_store'],
        'hotels': ['lodging', 'hotel', 'guest_house'],
        'attractions': ['tourist_attraction', 'landmark', 'point_of_interest']
    };

    // Map simple category names to our map keys if needed
    let mappedCategory = category;
    if (category === 'food') mappedCategory = 'restaurants';
    if (category === 'nature' || category === 'hiking') mappedCategory = 'parks';
    if (category === 'culture') mappedCategory = 'museums';

    const allowedTypes = categoryTypeMap[mappedCategory] || [];

    // If no strict mapping, be lenient
    if (allowedTypes.length === 0) return true;

    return allowedTypes.some(allowedType =>
        types.some(type => type.includes(allowedType))
    );
}

function isCategorySpecificFakeEntity(place: Place, category: string): string | null {
    const name = place.name.toLowerCase();

    if (category === 'food' || category === 'restaurants' || category === 'cafes') {
        if (isFakeFoodEntity(place)) return 'Fake food entity';
    }

    if (category === 'hotels' || category === 'lodging') {
        if (isFakeAccommodationEntity(place)) return 'Fake accommodation entity';
    }

    return null;
}

function isFakeFoodEntity(place: Place): boolean {
    const name = place.name.toLowerCase();

    const fakeFoodIndicators = [
        'home kitchen', 'home food', 'home delivery', 'home made',
        'tiffin service', 'tiffin center', 'meal plan', 'catering',
        'food truck', 'food cart', 'food stall', 'street food',
        'food point', 'eat point', 'refreshment', 'snacks corner'
    ];

    return fakeFoodIndicators.some(indicator => name.includes(indicator));
}

function isFakeAccommodationEntity(place: Place): boolean {
    const name = place.name.toLowerCase();

    const fakeAccommodationIndicators = [
        'pg accommodation', 'paying guest', 'hostel', 'dormitory',
        'rental room', 'shared room', 'budget stay', 'cheap stay'
    ];

    return fakeAccommodationIndicators.some(indicator => name.includes(indicator));
}

// ==========================================
// STAGE 4: QUALITY THRESHOLDS
// ==========================================

function passesDiscoveryQualityThreshold(place: Place, category: string): boolean {
    const qualityThresholds: Record<string, { minRating: number, minReviews: number }> = {
        'restaurants': { minRating: 3.8, minReviews: 20 },
        'cafes': { minRating: 3.8, minReviews: 15 },
        'hotels': { minRating: 3.5, minReviews: 10 },
        'attractions': { minRating: 3.5, minReviews: 10 },
        'parks': { minRating: 3.5, minReviews: 5 },
        'museums': { minRating: 3.5, minReviews: 5 },
        'shopping': { minRating: 3.0, minReviews: 5 },
        'default': { minRating: 3.0, minReviews: 1 }
    };

    let mappedCategory = 'default';
    if (category === 'food' || category === 'restaurants') mappedCategory = 'restaurants';
    else if (category === 'cafes') mappedCategory = 'cafes';
    else if (category === 'hotels') mappedCategory = 'hotels';
    else if (category === 'attraction' || category === 'attractions') mappedCategory = 'attractions';
    else if (category === 'nature' || category === 'hiking' || category === 'parks') mappedCategory = 'parks';
    else if (category === 'culture' || category === 'museums') mappedCategory = 'museums';
    else if (category === 'shopping') mappedCategory = 'shopping';

    const thresholds = qualityThresholds[mappedCategory] || qualityThresholds.default;

    // Rating check
    if (place.rating && place.rating < thresholds.minRating) return false;

    // Review count check
    if (place.reviews && place.reviews < thresholds.minReviews) return false;

    return true;
}

// ==========================================
// STAGE 5: DESTINATION RELEVANCE
// ==========================================

function isDiscoveryDestinationRelevant(place: Place, destination: string): boolean {
    const name = place.name.toLowerCase();
    const vicinity = (place.vicinity || '').toLowerCase();
    const destLower = destination.toLowerCase();

    // Direct vicinity check
    if (vicinity.includes(destLower)) return true;

    // Name contains destination
    if (name.includes(destLower)) return true;

    // Check for destination words in name/vicinity
    const destinationWords = destLower.split(/\s+/).filter(word => word.length > 2);
    const hasDestinationReference = destinationWords.some(word =>
        name.includes(word) || vicinity.includes(word)
    );

    if (!hasDestinationReference) return false;

    return true;
}

// ==========================================
// ENHANCEMENT & SCORING
// ==========================================

export async function enhanceDiscoveryPlaces(
    places: Place[],
    userLocation: { lat: number; lng: number } | null | undefined
): Promise<Place[]> {

    // Add distances
    let placesWithDistance = places;
    if (userLocation) {
        placesWithDistance = await calculateRealDistances(userLocation, places);
    }

    return placesWithDistance.map(place => {
        // Add credibility score
        place.credibilityScore = calculateDiscoveryCredibilityScore(place);

        // Add category tags
        place.categoryTags = extractCategoryTags(place.rawTypes || []);

        // ENHANCEMENT: Add Food & Dining specific fields if category is food-related
        if (isFoodCategory(place.category) || place.rawTypes?.includes('restaurant') || place.rawTypes?.includes('food')) {
            enhanceFoodPlace(place);
        }

        return place;
    });
}

function isFoodCategory(category: string): boolean {
    return ['food', 'restaurant', 'cafe', 'bar', 'nightlife'].includes(category);
}

function enhanceFoodPlace(place: Place) {
    const name = place.name.toLowerCase();
    const types = (place.rawTypes || []).join(' ').toLowerCase();
    const description = (place.description || '').toLowerCase();
    const combinedText = `${name} ${types} ${description}`;

    // 1. Infer Dietary Options
    place.dietaryOptions = [];
    if (combinedText.includes('veg') || combinedText.includes('green') || combinedText.includes('plant')) place.dietaryOptions.push('Vegetarian');
    if (combinedText.includes('vegan')) place.dietaryOptions.push('Vegan');
    if (combinedText.includes('jain') || combinedText.includes('pure veg')) place.dietaryOptions.push('Jain');
    if (combinedText.includes('halal') || combinedText.includes('arab') || combinedText.includes('mughlai')) place.dietaryOptions.push('Halal');
    if (combinedText.includes('gluten') || combinedText.includes('healthy')) place.dietaryOptions.push('Gluten-Free');
    if (combinedText.includes('keto') || combinedText.includes('diet')) place.dietaryOptions.push('Keto');

    // Default to Veg/Non-Veg based on cuisine hints if empty
    if (place.dietaryOptions.length === 0) {
        if (combinedText.includes('steak') || combinedText.includes('grill') || combinedText.includes('chicken') || combinedText.includes('mutton') || combinedText.includes('fish') || combinedText.includes('seafood')) {
            place.dietaryOptions.push('Non-Vegetarian');
        } else if (combinedText.includes('pure veg') || combinedText.includes('vegetarian only')) {
            place.dietaryOptions.push('Vegetarian');
        } else {
            // If ambiguous, assume it serves both (standard restaurant)
            place.dietaryOptions.push('Vegetarian');
            place.dietaryOptions.push('Non-Vegetarian');
        }
    }

    // 2. Infer Tags (Features & Cuisine)
    place.tags = [];
    // Cuisine
    if (combinedText.includes('north indian') || combinedText.includes('punjabi') || combinedText.includes('tandoor')) place.tags.push('North Indian');
    if (combinedText.includes('south indian') || combinedText.includes('dosa') || combinedText.includes('idli')) place.tags.push('South Indian');
    if (combinedText.includes('chinese') || combinedText.includes('asian') || combinedText.includes('noodle')) place.tags.push('Chinese');
    if (combinedText.includes('italian') || combinedText.includes('pizza') || combinedText.includes('pasta')) place.tags.push('Italian');
    // Features
    if (combinedText.includes('rooftop') || combinedText.includes('view') || combinedText.includes('terrace')) place.tags.push('Rooftop');
    if (combinedText.includes('live') || combinedText.includes('music')) place.tags.push('Live Music');
    if (combinedText.includes('pet') || combinedText.includes('dog')) place.tags.push('Pet-Friendly');
    if (combinedText.includes('delivery')) place.tags.push('Home Delivery');

    // 3. Simulate Social Stats (Mock Data for Demo)
    // We use the place ID to generate consistent "random" numbers
    const idNum = place.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isTrending = idNum % 5 === 0; // 20% chance

    place.socialStats = {
        trending: isTrending,
        views: isTrending ? `${(idNum % 90 + 10) / 10}M` : `${idNum % 50 + 5}K`,
        shares: isTrending ? `${idNum % 20 + 5}K` : `${idNum % 1000}`,
        platform: idNum % 3 === 0 ? 'TikTok' : (idNum % 3 === 1 ? 'Instagram' : 'YouTube')
    };

    // 4. Simulate Popular Dish - REMOVED as per user request (inappropriate suggestions)
    // place.popularDish = ...
}

function calculateDiscoveryCredibilityScore(place: Place): any {
    let score = 0;
    const maxScore = 10;

    // Rating weight (3 points)
    if (place.rating >= 4.5) score += 3;
    else if (place.rating >= 4.0) score += 2;
    else if (place.rating >= 3.5) score += 1;

    // Review count weight (3 points)
    const reviews = place.reviews || 0;
    if (reviews >= 100) score += 3;
    else if (reviews >= 50) score += 2;
    else if (reviews >= 20) score += 1;

    // Photo availability (2 points)
    if (place.photos && place.photos.length > 0) score += 2;
    else if (place.image) score += 1;

    // Price level indication (1 point)
    if (place.priceLevel && place.priceLevel >= 1) score += 1;

    // Opening hours availability (1 point)
    if (place.openingHours) score += 1;

    const total = (score / maxScore) * 10;

    return {
        total,
        breakdown: {
            rating: place.rating >= 4.0 ? 2 : 1,
            reviewCount: reviews > 50 ? 2 : 1,
            typeSpecificity: 1,
            priceLevel: 1,
            photoAvailability: 1,
            nameQuality: 1
        }
    };
}

function extractCategoryTags(types: string[]): string[] {
    const interestingTypes = [
        'restaurant', 'cafe', 'bar', 'park', 'museum', 'art_gallery',
        'shopping_mall', 'store', 'tourist_attraction', 'landmark',
        'historical_landmark', 'night_club', 'spa', 'gym', 'zoo', 'aquarium'
    ];

    return types
        .filter(t => interestingTypes.includes(t))
        .map(t => t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))
        .slice(0, 3);
}
