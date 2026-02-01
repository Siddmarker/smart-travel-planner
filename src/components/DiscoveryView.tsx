'use client';

import { useState, useEffect, useRef } from 'react';

// --- 1. INTERFACES ---
interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: any };
  rating?: number;
  user_ratings_total?: number;
  photos?: any[];
  types?: string[];
  price_level?: number;
}

interface DiscoveryViewProps {
  onAddToTrip: (place: any) => void;
  onBack: () => void;
  initialCity: string;
}

// --- 2. CONFIGURATION & CONSTANTS ---
const CATEGORIES = [
  { id: 'tourist_attraction', label: '🎡 Attractions' },
  { id: 'trekking', label: '🥾 Trekking & Trails' },
  { id: 'local_market', label: '🌸 Santhe / Markets' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'iconic', label: '💎 Legendary Spots' },
  { id: 'late_night', label: '🌙 Late Night / 4AM' },
  { id: 'restaurant', label: '🍽️ Restaurants' },
  { id: 'cafe', label: '☕ Cafes' },
  { id: 'lodging', label: '🏨 Hotels & Stays' },
  { id: 'amusement_park', label: '🎢 Theme Parks' },
  { id: 'off_roading', label: '🏍️ Off-Roading' },
  { id: 'turf', label: '⚽ Turfs' },
  { id: 'shopping_mall', label: '🛍️ Shopping' },
  { id: 'park', label: '🌳 Parks' }
];

const STAY_TYPES = [
  { value: 'ANY', label: '🏨 Any Stay' },
  { value: 'resort', label: '🌴 Resort' },
  { value: 'villa', label: '🏡 Villa' },
  { value: 'homestay', label: '🏠 Homestay' },
  { value: 'hostel', label: '🎒 Hostel / Dorm' },
  { value: 'apartment', label: '🏢 Apartment' }
];

const BUDGET_LEVELS = [
  { value: 'ANY', label: '💰 Any Price' },
  { value: 'cheap', label: '💸 Budget' },
  { value: 'luxury', label: '💎 Luxury' },
  { value: 'premium', label: '✨ Premium' }
];

// Helper to wait for Google's API limit (2 seconds between pages)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // --- 3. STATE MANAGEMENT ---
  const [currentCity, setCurrentCity] = useState(initialCity || 'Bangalore');
  const [cityCoords, setCityCoords] = useState<google.maps.LatLng | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(20000); // Default 20km

  // Extra Filters
  const [diet, setDiet] = useState('ANY');
  const [stayType, setStayType] = useState('ANY');
  const [budget, setBudget] = useState('ANY');

  // Results & Pagination
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(''); // To show "Loading more..."
  const [geoLoading, setGeoLoading] = useState(false); // GPS Loading State

  // Autocomplete
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Refs for Google Services
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  // --- 4. INITIALIZATION ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      const mapDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(mapDiv);
      geocoderRef.current = new window.google.maps.Geocoder();
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }

    if (initialCity) {
      setSearchTerm(initialCity);
      geocodeAndSearch(initialCity);
    }
  }, [initialCity]);

  // --- 5. GEOCODING & GPS LOGIC ---
  const geocodeAndSearch = (cityName: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ address: cityName }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCityCoords(location);
        performSearch(cityName, activeCategory, location);
      } else {
        // Fallback if geocoding fails, still try to search by text
        performSearch(cityName, activeCategory, null);
      }
    });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latLng = new window.google.maps.LatLng(latitude, longitude);
        
        // Update Coords State
        setCityCoords(latLng);

        // Reverse Geocode to get City Name
        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              // Try to extract city name
              const cityComponent = results[0].address_components.find(c => c.types.includes('locality'));
              const cityName = cityComponent ? cityComponent.long_name : results[0].formatted_address;
              
              setSearchTerm(cityName);
              setCurrentCity(cityName);
              performSearch(cityName, activeCategory, latLng);
            } else {
              setSearchTerm("Current Location");
              setCurrentCity("Current Location");
              performSearch("Current Location", activeCategory, latLng);
            }
            setGeoLoading(false);
          });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Check browser permissions.");
        setGeoLoading(false);
      }
    );
  };

  // --- 6. MAIN SEARCH LOGIC (ROBUST) ---
  const performSearch = (city: string, category: string, location: google.maps.LatLng | null) => {
    if (!placesServiceRef.current) return;

    // Reset Results
    setResults([]);
    setLoading(true);
    setStatusMessage(`Searching ${category.replace('_', ' ')}...`);

    let query = '';

    // STRATEGY: If radius > 50km, we use broader terms to find distant places
    const useBroadSearch = radius > 50000;

    if (location) {
      // --- SMART RADIUS MODE (Location Biased) ---
      switch (category) {
        case 'trekking': query = useBroadSearch ? `best trekking hills peaks` : `hiking trails hills nature`; break;
        case 'local_market': query = `flower market vegetable market bazaar santhe`; break;
        case 'off_roading': query = `off road trails dirt tracks`; break;
        case 'iconic': query = `legendary oldest famous restaurants`; break;
        case 'late_night': query = `late night food open 24 hours`; break;
        case 'trending': query = `popular tourist attractions`; break;
        case 'turf': query = `sports turf cricket football`; break;
        case 'amusement_park': query = `amusement park water park`; break;
        default: query = category.replace('_', ' '); break;
      }
    } else {
      // --- TEXT FALLBACK MODE (No Location) ---
      switch (category) {
        case 'trekking': query = `hiking trails hills peaks near ${city}`; break;
        case 'local_market': query = `market santhe bazaar in ${city}`; break;
        case 'off_roading': query = `off road trails near ${city}`; break;
        default: query = `${category.replace('_', ' ')} in ${city}`; break;
      }
    }

    // Apply Filters to Query String
    if (['restaurant', 'cafe', 'trending', 'iconic', 'late_night'].includes(category)) {
      if (diet === 'VEG') query += ' pure vegetarian';
      if (diet === 'JAIN') query += ' jain food';
      if (diet === 'HALAL') query += ' halal';
      if (diet === 'EGG') query += ' eggetarian';
      if (diet === 'VEGAN') query += ' vegan';
    }

    if (category === 'lodging') {
      if (stayType !== 'ANY') query = `${stayType} in ${city}`;
      if (budget !== 'ANY') query += ` ${budget}`;
    }

    const request: google.maps.places.TextSearchRequest = {
      query: query,
      ...(location && { location: location, radius: radius }),
    };

    // --- RECURSIVE PAGINATION HANDLER ---
    let allPlaces: Place[] = [];

    const fetchPage = (nextPageToken?: any) => {
      // NOTE: textSearch doesn't accept a pageToken directly in the initial request object in JS API.
      // Instead, we rely on the pagination object callback.

      placesServiceRef.current?.textSearch(request, async (places, status, pagination) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && places) {

          // 1. Filter out unwanted types
          const filtered = places.filter(place => {
            const types = place.types || [];
            const name = (place.name || '').toLowerCase();
            if (types.includes('travel_agency')) return false;
            if (name.includes('travels') || name.includes('holidays') || name.includes('tours &')) return false;
            if (category === 'trekking' && (types.includes('store') || types.includes('shopping_mall'))) return false;
            return true;
          });

          // 2. Accumulate Results
          allPlaces = [...allPlaces, ...(filtered as Place[])];

          // Remove duplicates by ID
          const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.place_id, item])).values());
          setResults(uniquePlaces);

          // 3. Handle Pagination (Max 60 results / 3 pages)
          if (pagination && pagination.hasNextPage && allPlaces.length < 60) {
            setStatusMessage(`Loading more results... (${uniquePlaces.length} found)`);
            await sleep(2000); // MANDATORY WAIT for Google API
            pagination.nextPage();
          } else {
            setLoading(false);
            setStatusMessage('');
          }
        } else {
          setLoading(false);
        }
      });
    };

    // Start fetching
    fetchPage();
  };

  // --- 7. UI HANDLERS ---
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val || val.length < 3 || !autocompleteServiceRef.current) {
      setCitySuggestions([]); setShowDropdown(false); return;
    }
    autocompleteServiceRef.current.getPlacePredictions({ input: val, types: ['(cities)'] }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setCitySuggestions(predictions); setShowDropdown(true);
      } else { setCitySuggestions([]); setShowDropdown(false); }
    });
  };

  const selectCity = (cityName: string) => {
    setSearchTerm(cityName); setCurrentCity(cityName); setCitySuggestions([]); setShowDropdown(false);
    geocodeAndSearch(cityName);
  };

  const handleRadiusChange = (e: any) => {
    const km = Number(e.target.value);
    if (km >= 0) {
      const meters = km * 1000;
      setRadius(meters);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setCurrentCity(searchTerm); geocodeAndSearch(searchTerm); setShowDropdown(false);
    }
  };

  return (
    // FIX: max-w-[100vw] prevents the "Zoomed Out" effect
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden w-full max-w-[100vw]">

      {/* --- HEADER --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20 flex-shrink-0">

        {/* Title Row */}
        <div className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center border-b border-gray-100">
          <div className="overflow-hidden">
            <h2 className="text-lg md:text-xl font-black text-gray-900 truncate pr-2">Discover {currentCity}</h2>
            <p className="text-[10px] md:text-xs text-gray-500 truncate font-bold">Explore {activeCategory.replace('_', ' ')} spots</p>
          </div>
          <button onClick={onBack} className="flex-shrink-0 text-xs md:text-sm font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200">
            ← Back
          </button>
        </div>

        {/* CONTROLS (Mobile Optimized Grid) */}
        <div className="px-4 py-4 md:px-6 flex flex-col gap-4 md:grid md:grid-cols-12 items-center relative">

          {/* A. City Input (WITH LIVE LOCATION PIN) */}
          <div className="w-full md:col-span-4 relative z-50">
            <input
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base font-bold focus:outline-none focus:ring-2 focus:ring-black/5 shadow-sm"
              placeholder="Enter City..."
              value={searchTerm}
              onChange={handleCityInput}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (citySuggestions.length > 0) setShowDropdown(true); }}
            />
            <span className="absolute left-3 top-3.5 text-gray-400">🌍</span>

            {/* LIVE LOCATION BUTTON */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-blue-600 transition-colors z-20"
              title="Use Current Location"
            >
              {geoLoading ? (
                <span className="animate-spin block">⏳</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {showDropdown && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                {citySuggestions.map((s) => (
                  <div key={s.place_id} onClick={() => selectCity(s.description)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 text-base font-medium text-gray-700 flex gap-2 items-center">
                    <span className="opacity-50">📍</span>{s.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. Radius Input & Search Button (Side-by-Side on Mobile) */}
          <div className="w-full md:col-span-5 grid grid-cols-2 gap-3">
             <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Radius:</span>
                <input
                  type="number" min="1" max="500"
                  value={radius / 1000}
                  onChange={handleRadiusChange}
                  className="w-full bg-transparent text-base font-bold focus:outline-none"
                  placeholder="20"
                />
             </div>
             <button
              onClick={() => { setCurrentCity(searchTerm); geocodeAndSearch(searchTerm); setShowDropdown(false); }}
              className="w-full bg-black text-white py-3 rounded-xl font-bold text-base hover:bg-gray-800 transition-all shadow-md active:scale-95 flex items-center justify-center"
             >
              Search
             </button>
          </div>

          {/* C. Filters (Full Width) */}
          <div className="w-full md:col-span-3">
            {(['restaurant', 'cafe', 'iconic', 'late_night', 'trending'].includes(activeCategory)) ? (
              <select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none cursor-pointer" value={diet} onChange={(e) => { setDiet(e.target.value); if (cityCoords) performSearch(currentCity, activeCategory, cityCoords); }}>
                <option value="ANY">🍽️ Any Diet</option>
                <option value="VEG">🥦 Vegetarian</option>
                <option value="EGG">🍳 Eggetarian</option>
                <option value="NON_VEG">🍗 Non-Veg</option>
              </select>
            ) : activeCategory === 'lodging' ? (
              <div className="flex gap-2">
                <select className="w-1/2 p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" value={stayType} onChange={(e) => { setStayType(e.target.value); if (cityCoords) performSearch(currentCity, activeCategory, cityCoords); }}>
                  {STAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="w-1/2 p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" value={budget} onChange={(e) => { setBudget(e.target.value); if (cityCoords) performSearch(currentCity, activeCategory, cityCoords); }}>
                  {BUDGET_LEVELS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            ) : (
              <div className="text-xs text-gray-400 text-center italic py-3">No extra filters</div>
            )}
          </div>
        </div>

        {/* Categories Scroll */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 border-t border-gray-50 pt-2">
          <div className="flex gap-2 px-4 md:px-6 w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); if (cityCoords) performSearch(currentCity, cat.id, cityCoords); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RESULTS GRID --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50" onClick={() => setShowDropdown(false)}>
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <p className="font-bold">{statusMessage}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold">No results found.</p>
            <p className="text-sm text-gray-400">Try increasing the radius or changing the city.</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          // FIX: Desktop Grid (lg:grid-cols-4)
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col h-full">

                {/* FIX: aspect-video for perfect 16:9 images */}
                <div className="aspect-video bg-gray-200 relative w-full overflow-hidden">
                  {place.photos?.[0] ? (
                    <img src={place.photos[0].getUrl({ maxWidth: 400 })} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={place.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>
                  )}

                  {place.rating && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white">⭐ {place.rating} ({place.user_ratings_total})</div>
                  )}

                  {/* RESTORED: The "Local Market" pink badge from original code */}
                  {activeCategory === 'local_market' && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-md">🌸 Local Market</div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-base text-gray-900 line-clamp-1">{place.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{place.formatted_address}</p>

                  <div className="mt-auto flex gap-2">
                    {/* FIX: Primary Button = Get Directions */}
                    <button
                      onClick={() => window.open(`http://googleusercontent.com/maps.google.com/search?q=${encodeURIComponent(place.name || '')}&query_place_id=${place.place_id}`, '_blank')}
                      className="flex-1 bg-black text-white py-3 rounded-xl text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
                    >
                      Get Directions 📍
                    </button>
                    {/* FIX: Secondary Button = Add (+) */}
                    <button 
                      onClick={() => onAddToTrip(place)} 
                      className="w-12 flex items-center justify-center bg-gray-100 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-600 transition-colors border border-gray-200"
                      title="Add to Plan"
                    >
                      <span className="text-xl font-bold">+</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}