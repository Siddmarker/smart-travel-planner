'use client';

import { useState, useEffect, useRef } from 'react';

// --- INTERFACES ---
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

// --- CONFIGURATION CONSTANTS ---
const CATEGORIES = [
  { id: 'tourist_attraction', label: '🎡 Attractions' },
  { id: 'trekking', label: '🥾 Trekking & Trails' },
  { id: 'local_market', label: '🌸 Santhe / Markets' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'iconic', label: '💎 Legendary Spots' },
  { id: 'late_night', label: '🌙 Late Night' },
  { id: 'restaurant', label: '🍽️ Restaurants' },
  { id: 'cafe', label: '☕ Cafes' },
  { id: 'lodging', label: '🏨 Hotels' },
  { id: 'amusement_park', label: '🎢 Theme Parks' },
  { id: 'off_roading', label: '🏍️ Off-Road' },
  { id: 'turf', label: '⚽ Turfs' },
  { id: 'shopping_mall', label: '🛍️ Shopping' },
  { id: 'park', label: '🌳 Parks' }
];

const STAY_TYPES = [
  { value: 'ANY', label: '🏨 Any Stay' },
  { value: 'resort', label: '🌴 Resort' },
  { value: 'villa', label: '🏡 Villa' },
  { value: 'homestay', label: '🏠 Homestay' },
  { value: 'hostel', label: '🎒 Hostel' },
  { value: 'apartment', label: '🏢 Apt' }
];

const BUDGET_LEVELS = [
  { value: 'ANY', label: '💰 Any Price' },
  { value: 'cheap', label: '💸 Budget' },
  { value: 'luxury', label: '💎 Luxury' },
  { value: 'premium', label: '✨ Premium' }
];

// Utility to respect Google API rate limits
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // --- STATE MANAGEMENT ---
  const [currentCity, setCurrentCity] = useState(initialCity || 'Bangalore');
  const [cityCoords, setCityCoords] = useState<google.maps.LatLng | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(20000); // 20km default

  // Advanced Filters
  const [diet, setDiet] = useState('ANY');
  const [stayType, setStayType] = useState('ANY');
  const [budget, setBudget] = useState('ANY');

  // Results & Pagination Logic
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  // Autocomplete UI State
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Google Maps Service Refs
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  // --- INITIALIZATION ---
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

  // --- GEOCODING (Address -> Coordinates) ---
  const geocodeAndSearch = (cityName: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ address: cityName }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCityCoords(location);
        performSearch(cityName, activeCategory, location);
      } else {
        // Fallback search without explicit location bias if geocode fails
        performSearch(cityName, activeCategory, null);
      }
    });
  };

  // --- GPS LOCATION HANDLER ---
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
        
        // 1. Set Coordinates
        setCityCoords(latLng);

        // 2. Reverse Geocode to find the City Name
        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              // Extract the 'locality' (city name) from address components
              const cityComponent = results[0].address_components.find(c => c.types.includes('locality'));
              const cityName = cityComponent ? cityComponent.long_name : results[0].formatted_address;
              
              setSearchTerm(cityName);
              setCurrentCity(cityName);
              performSearch(cityName, activeCategory, latLng);
            } else {
              // Fallback if no address found
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
        alert("Unable to retrieve your location. Please check your browser permissions.");
        setGeoLoading(false);
      }
    );
  };

  // --- MAIN SEARCH FUNCTION ---
  const performSearch = (city: string, category: string, location: google.maps.LatLng | null) => {
    if (!placesServiceRef.current) return;

    setResults([]);
    setLoading(true);
    setStatusMessage(`Searching...`);

    let query = '';
    // If radius is huge (>50km), use broader terms
    const useBroadSearch = radius > 50000;

    if (location) {
      // --- Smart Keyword Logic based on Category ---
      switch (category) {
        case 'trekking': query = useBroadSearch ? `best trekking hills peaks` : `hiking trails hills nature`; break;
        case 'local_market': query = `flower market vegetable market bazaar santhe`; break;
        case 'off_roading': query = `off road trails dirt tracks`; break;
        case 'iconic': query = `legendary oldest famous restaurants`; break;
        case 'late_night': query = `late night food open 24 hours`; break;
        case 'trending': query = `popular tourist attractions`; break;
        case 'turf': query = `sports turf cricket football`; break;
        case 'amusement_park': query = `amusement park water park`; break;
        // Default behavior for standard categories
        default: query = category.replace('_', ' '); break;
      }
    } else {
      // Fallback if no location data
      query = `${category.replace('_', ' ')} in ${city}`;
    }

    // Append Filters to Query
    if (['restaurant', 'cafe', 'trending', 'iconic'].includes(category)) {
      if (diet === 'VEG') query += ' pure vegetarian';
      else if (diet === 'NON_VEG') query += ' non veg';
    }

    if (category === 'lodging') {
      if (stayType !== 'ANY') query = `${stayType} in ${city}`;
      if (budget !== 'ANY') query += ` ${budget}`;
    }

    // Google Maps Request Object
    const request: google.maps.places.TextSearchRequest = {
      query: query,
      ...(location && { location: location, radius: radius }),
    };

    let allPlaces: Place[] = [];

    // Recursive function to handle Google's Pagination (next_page_token)
    const fetchPage = () => {
      placesServiceRef.current?.textSearch(request, async (places, status, pagination) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && places) {
          
          // Filter out unwanted types (like travel agencies)
          const filtered = places.filter(p => !p.types?.includes('travel_agency'));
          
          allPlaces = [...allPlaces, ...(filtered as Place[])];
          
          // Deduplicate results based on place_id
          const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.place_id, item])).values());
          setResults(uniquePlaces);

          // Check if we need more pages (limit to ~60 results to save API quota)
          if (pagination && pagination.hasNextPage && allPlaces.length < 60) {
            setStatusMessage(`Loading more... (${uniquePlaces.length} found)`);
            // Google requires a short delay before requesting the next page
            await sleep(2000); 
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

    // Start the search
    fetchPage();
  };

  // --- UI EVENT HANDLERS ---
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    
    // Autocomplete Logic
    if (!val || val.length < 3 || !autocompleteServiceRef.current) {
      setCitySuggestions([]); setShowDropdown(false); return;
    }
    
    autocompleteServiceRef.current.getPlacePredictions({ input: val, types: ['(cities)'] }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setCitySuggestions(predictions); setShowDropdown(true);
      } else { 
        setCitySuggestions([]); setShowDropdown(false); 
      }
    });
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setCurrentCity(searchTerm); 
      geocodeAndSearch(searchTerm); 
      setShowDropdown(false);
    }
  };

  return (
    // FIX: max-w-[100vw] prevents the mobile page from being wider than the screen
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden w-full max-w-[100vw]">

      {/* --- HEADER SECTION --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20 flex-shrink-0">

        {/* Title & Back Button */}
        <div className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center border-b border-gray-100">
          <div className="overflow-hidden mr-2">
            <h2 className="text-lg md:text-xl font-black text-gray-900 truncate pr-2">Discover {currentCity}</h2>
            <p className="text-[10px] md:text-xs text-gray-500 truncate font-bold">Explore {activeCategory.replace('_', ' ')} spots</p>
          </div>
          <button onClick={onBack} className="flex-shrink-0 text-xs md:text-sm font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            ← Back
          </button>
        </div>

        {/* CONTROLS (Mobile Optimized Grid) */}
        <div className="px-4 py-3 md:px-6 flex flex-col gap-3">
          
          {/* Row 1: City Input (Full Width) */}
          <div className="w-full relative z-30">
            <input
              className="w-full pl-9 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
              placeholder="Enter City..."
              value={searchTerm}
              onChange={handleCityInput}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (citySuggestions.length > 0) setShowDropdown(true); }}
            />
            <span className="absolute left-3 top-3 text-gray-400">🌍</span>
            
            {/* GPS Button */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              title="Use Current Location"
            >
              {geoLoading ? (
                <span className="animate-spin block text-xs">⏳</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Suggestions Dropdown */}
            {showDropdown && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                {citySuggestions.map((s) => (
                  <div 
                    key={s.place_id} 
                    onClick={() => { 
                      setSearchTerm(s.description); 
                      setCurrentCity(s.description); 
                      setCitySuggestions([]); 
                      setShowDropdown(false); 
                      geocodeAndSearch(s.description); 
                    }} 
                    className="px-4 py-3 border-b border-gray-50 text-sm font-bold text-gray-700 truncate hover:bg-gray-50 cursor-pointer"
                  >
                    📍 {s.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 2: Radius Input + Search Button (Side-by-Side for Mobile) */}
          <div className="grid grid-cols-2 gap-2 h-12">
            
            {/* Radius */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 h-full">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Km:</span>
              <input
                type="number" min="1" max="500"
                value={radius / 1000}
                onChange={(e) => setRadius(Number(e.target.value) * 1000)}
                className="w-full bg-transparent text-sm font-bold focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={() => { 
                setCurrentCity(searchTerm); 
                geocodeAndSearch(searchTerm); 
                setShowDropdown(false); 
              }}
              className="bg-black text-white rounded-xl font-bold text-sm h-full shadow-md flex items-center justify-center active:scale-95 transition-transform hover:bg-gray-800"
            >
              Search
            </button>
          </div>

          {/* Row 3: Extra Filters (Full Width) */}
          <div className="w-full">
            {(['restaurant', 'cafe', 'iconic', 'late_night', 'trending'].includes(activeCategory)) ? (
              <select 
                className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none cursor-pointer" 
                value={diet} 
                onChange={(e) => { 
                  setDiet(e.target.value); 
                  if (cityCoords) performSearch(currentCity, activeCategory, cityCoords); 
                }}
              >
                <option value="ANY">🍽️ Any Diet</option>
                <option value="VEG">🥦 Vegetarian</option>
                <option value="NON_VEG">🍗 Non-Veg</option>
              </select>
            ) : activeCategory === 'lodging' ? (
              <div className="flex gap-2">
                <select 
                  className="w-1/2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none" 
                  value={stayType} 
                  onChange={(e) => { 
                    setStayType(e.target.value); 
                    if (cityCoords) performSearch(currentCity, activeCategory, cityCoords); 
                  }}
                >
                  {STAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                
                <select 
                  className="w-1/2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none" 
                  value={budget} 
                  onChange={(e) => { 
                    setBudget(e.target.value); 
                    if (cityCoords) performSearch(currentCity, activeCategory, cityCoords); 
                  }}
                >
                  {BUDGET_LEVELS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
            ) : null}
          </div>
        </div>

        {/* Categories Scroll (Horizontal) */}
        <div className="w-full overflow-x-auto no-scrollbar pb-2 border-t border-gray-50 pt-2">
          <div className="flex gap-2 px-4 w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { 
                  setActiveCategory(cat.id); 
                  if (cityCoords) performSearch(currentCity, cat.id, cityCoords); 
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RESULTS GRID --- */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" onClick={() => setShowDropdown(false)}>
        {loading && (
          <div className="text-center py-10 text-gray-400">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-bold">{statusMessage}</p>
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-2xl mb-2">🔭</p>
            <p className="text-gray-400 font-bold text-sm">No places found here.</p>
            <p className="text-gray-400 text-xs mt-1">Try increasing radius or changing category.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group">
                
                {/* Place Image */}
                <div className="h-32 bg-gray-200 relative w-full overflow-hidden">
                  {place.photos?.[0] ? (
                    <img 
                      src={place.photos[0].getUrl({ maxWidth: 400 })} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={place.name} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📷</div>
                  )}
                  {place.rating && (
                    <div className="absolute bottom-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">
                      ⭐ {place.rating} ({place.user_ratings_total})
                    </div>
                  )}
                </div>

                {/* Place Details */}
                <div className="p-3 flex flex-col flex-1">
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{place.name}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{place.formatted_address}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => onAddToTrip(place)} 
                      className="flex-1 bg-black text-white py-2 rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors"
                    >
                       + Add
                    </button>
                    <button 
                      onClick={() => window.open(`http://googleusercontent.com/maps.google.com/search?q=${encodeURIComponent(place.name || '')}&query_place_id=${place.place_id}`, '_blank')} 
                      className="w-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-blue-600 transition-colors"
                    >
                       ↗
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