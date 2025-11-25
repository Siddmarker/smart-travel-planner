import { Place, UserPreferences } from '@/types';

// STRICTER PLACE FILTRATION TO REMOVE LOCAL/NON-RELEVANT PLACES
export function applyEnhancedStrictFiltration(places: Place[], destination: string): Place[] {
    return places.filter(place => {
        // FILTER 1: REMOVE LOCAL/NEIGHBORHOOD PLACES
        if (isLocalIrrelevantPlace(place)) return false;

        // FILTER 2: ENSURE DESTINATION RELEVANCE
        if (!isDestinationRelevant(place, destination)) return false;

        // FILTER 3: MINIMUM QUALITY THRESHOLDS
        // Relaxed slightly for hidden gems, but generally strict
        if ((place.rating || 0) < 3.5) return false;
        if ((place.reviews || 0) < 10) return false;

        return true;
    });
}

// DETECT LOCAL/NON-RELEVANT PLACES
function isLocalIrrelevantPlace(place: Place): boolean {
    const localIndicators = [
        'local grocery', 'convenience store', 'pharmacy', 'hardware store',
        'gas station', 'auto repair', 'laundry', 'dry cleaner', 'bank',
        'post office', 'elementary school', 'high school', 'community college',
        'atm', 'insurance agency', 'lawyer', 'plumber', 'electrician'
    ];

    const placeName = place.name.toLowerCase();
    // In our Place type, we map Google types to a single category, but we might have raw types if we extended the interface.
    // For now, we rely on name and the mapped category.

    // Check if place name contains local indicators
    if (localIndicators.some(indicator => placeName.includes(indicator))) {
        return true;
    }

    // If we had access to raw google types, we would check them here.
    // Since we mapped them to 'shopping', 'activity', etc., we can check if a 'shopping' place sounds too generic.
    if (place.category === 'shopping') {
        const genericShoppingTerms = ['supermarket', 'mart', 'general store', 'department store'];
        if (genericShoppingTerms.some(term => placeName.includes(term))) {
            return true; // Likely a local grocery store
        }
    }

    return false;
}

function isDestinationRelevant(place: Place, destination: string): boolean {
    // This is a heuristic. If the place is in the destination city, it's likely relevant.
    // We can check if the address contains the destination name.
    if (place.description && place.description.toLowerCase().includes(destination.toLowerCase())) {
        return true;
    }
    // If we can't verify, we default to true to avoid over-filtering, 
    // relying on the radius search from Google Maps to be accurate.
    return true;
}

// ENHANCED FOOD PLACE FILTRATION
export function applyEnhancedFoodFiltration(foodPlaces: Place[], userPreferences: UserPreferences): Place[] {
    return foodPlaces.filter(place => {
        // BASIC QUALITY FILTERS
        if ((place.rating || 0) < 4.0) return false;
        if ((place.reviews || 0) < 20) return false;

        // ENHANCED CATEGORY FILTERING
        if (!isProperRestaurant(place)) return false;

        // DIETARY VARIETY ENSURANCE
        // We assume multiDayTrip is true if duration > 1
        const isMultiDay = userPreferences.trip_duration > 1;
        if (isMultiDay) {
            return hasDietaryVariety(place);
        }

        return true;
    });
}

function isProperRestaurant(place: Place): boolean {
    const name = place.name.toLowerCase();
    const notRestaurants = ['mcdonald', 'kfc', 'burger king', 'subway', 'domino', 'pizza hut', 'starbucks'];

    // Filter out fast food chains if user wants "proper" restaurants (optional, but good for "enhanced" feel)
    if (notRestaurants.some(chain => name.includes(chain))) {
        return false;
    }
    return true;
}

// ENSURE DIETARY VARIETY FOR MULTI-DAY TRIPS
function hasDietaryVariety(place: Place): boolean {
    const placeName = place.name.toLowerCase();
    // We don't have raw types, so we rely on name. 
    // In a real app, we'd fetch 'serves_vegetarian_food' etc from Place Details.

    // Map to track dietary options
    const dietaryOptions = {
        nonVeg: false,
        egg: false,
        multiCuisine: false
    };

    // Detect dietary options from place data
    const nonVegIndicators = ['chicken', 'mutton', 'fish', 'seafood', 'meat', 'non-veg', 'non veg', 'grill', 'bbq', 'steak'];
    const eggIndicators = ['egg', 'eggs', 'omelette', 'bistro', 'breakfast']; // Bistro/Breakfast often have eggs
    const cuisineTypes = ['indian', 'chinese', 'italian', 'mexican', 'continental', 'thai', 'japanese', 'asian'];

    dietaryOptions.nonVeg = nonVegIndicators.some(indicator => placeName.includes(indicator));

    dietaryOptions.egg = eggIndicators.some(indicator => placeName.includes(indicator));

    const cuisinesFound = cuisineTypes.filter(cuisine => placeName.includes(cuisine));
    dietaryOptions.multiCuisine = cuisinesFound.length > 0; // If it mentions a specific cuisine, it adds variety

    // If it's a generic "Restaurant" or "Kitchen", it likely serves multiple things.
    if (placeName.includes('restaurant') || placeName.includes('kitchen') || placeName.includes('bistro')) {
        return true;
    }

    // Return true if offers at least one dietary variety indicator
    return dietaryOptions.nonVeg || dietaryOptions.egg || dietaryOptions.multiCuisine;
}
