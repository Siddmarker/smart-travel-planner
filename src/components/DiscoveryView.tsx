'use client';

import { useState, useEffect, useRef } from 'react';

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

// --- CATEGORIES ---
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

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // STATE
  const [currentCity, setCurrentCity] = useState(initialCity || 'Bangalore');
  const [cityCoords, setCityCoords] = useState<google.maps.LatLng | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(20000); // Default 20km

  // RESULTS
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  // AUTOCOMPLETE STATE
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // REFS
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  // 1. INITIALIZE GOOGLE MAPS
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

  // --- GEOCODING HELPER ---
  const geocodeAndSearch = (cityName: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ address: cityName }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCityCoords(location);
        performSearch(cityName, activeCategory, location);
      } else {
        performSearch(cityName, activeCategory, null);
      }
    });
  };

  // --- SEARCH LOGIC ---
  const performSearch = (city: string, category: string, location: google.maps.LatLng | null) => {
    if (!placesServiceRef.current) return;
    setLoading(true);

    let query = '';

    if (location) {
      // --- SMART RADIUS MODE ---
      switch (category) {
        case 'trekking': query = `hiking trails hills viewpoints nature`; break;
        case 'local_market': query = `flower market vegetable market bazaar santhe`; break;
        case 'off_roading': query = `off road trails dirt tracks`; break;
        case 'iconic': query = `legendary oldest famous restaurants`; break;
        case 'late_night': query = `late night food open 24 hours`; break;
        case 'trending': query = `popular tourist attractions`; break;
        default: query = category.replace('_', ' '); break;
      }
    } else {
      // --- FALLBACK TEXT MODE ---
      switch (category) {
        case 'trekking': query = `hiking trails hills peaks near ${city}`; break;
        case 'local_market': query = `market santhe bazaar in ${city}`; break;
        case 'off_roading': query = `off road trails near ${city}`; break;
        default: query = `${category.replace('_', ' ')} in ${city}`; break;
      }
    }

    const request: google.maps.places.TextSearchRequest = {
      query: query,
      ...(location && { location: location, radius: radius }),
    };

    placesServiceRef.current.textSearch(request, (places, status) => {
      setLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && places) {

        const filtered = places.filter(place => {
          const types = place.types || [];
          const name = (place.name || '').toLowerCase();

          // 1. Remove Agencies & Booking Offices
          if (types.includes('travel_agency')) return false;
          if (name.includes('travels') || name.includes('holidays') || name.includes('tours &')) return false;

          // 2. Trekking Specific Cleanups
          if (category === 'trekking') {
            if (types.includes('store') || types.includes('shopping_mall')) return false;
          }

          return true;
        });

        setResults(filtered as Place[]);
      } else {
        setResults([]);
      }
    });
  };

  // --- AUTOCOMPLETE HANDLER ---
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);

    // If empty or no service, hide dropdown
    if (!val || val.length < 3 || !autocompleteServiceRef.current) {
      setCitySuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Fetch predictions
    autocompleteServiceRef.current.getPlacePredictions({ input: val, types: ['(cities)'] }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setCitySuggestions(predictions);
        setShowDropdown(true);
      } else {
        setCitySuggestions([]);
        setShowDropdown(false);
      }
    });
  };

  const selectCity = (cityName: string) => {
    setSearchTerm(cityName);
    setCurrentCity(cityName);
    setCitySuggestions([]);
    setShowDropdown(false);
    geocodeAndSearch(cityName);
  };

  // Handle Numeric Radius Input
  const handleRadiusChange = (e: any) => {
    const km = Number(e.target.value);
    if (km >= 0) {
      const meters = km * 1000;
      setRadius(meters);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setCurrentCity(searchTerm);
      geocodeAndSearch(searchTerm);
      setShowDropdown(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden w-full max-w-full">

      {/* --- HEADER --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20 flex-shrink-0">

        {/* Title Row */}
        <div className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 truncate">Discover {currentCity}</h2>
            <p className="text-[10px] md:text-xs text-gray-500">Explore {activeCategory.replace('_', ' ')} spots</p>
          </div>
          <button onClick={onBack} className="text-sm md:text-base font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200">
            ← Back
          </button>
        </div>

        {/* CONTROLS ROW - MOBILE FIXED */}
        {/* 'flex-col' stacks them vertically on mobile. 'md:grid' puts them side-by-side on PC */}
        <div className="px-4 py-4 md:px-6 flex flex-col gap-3 md:grid md:grid-cols-12 items-center relative">

          {/* A. City Input with Dropdown */}
          <div className="w-full md:col-span-5 relative z-50">
            <input
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter City..."
              value={searchTerm}
              onChange={handleCityInput}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (citySuggestions.length > 0) setShowDropdown(true); }}
            />
            <span className="absolute left-3 top-3 text-gray-400">🌍</span>

            {/* THE DROPDOWN LIST */}
            {showDropdown && citySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                {citySuggestions.map((s) => (
                  <div
                    key={s.place_id}
                    onClick={() => selectCity(s.description)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 text-base font-medium text-gray-700 flex gap-2 items-center"
                  >
                    <span className="opacity-50">📍</span>
                    {s.description}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* B. RADIUS INPUT (Numeric) */}
          <div className="w-full md:col-span-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Radius (km):</span>
            <input
              type="number"
              min="1"
              max="500"
              value={radius / 1000}
              onChange={handleRadiusChange}
              className="w-full bg-transparent text-base font-bold focus:outline-none py-1"
              placeholder="20"
            />
          </div>

          {/* C. Search Button */}
          <div className="w-full md:col-span-3">
            <button
              onClick={() => { setCurrentCity(searchTerm); geocodeAndSearch(searchTerm); setShowDropdown(false); }}
              className="w-full bg-black text-white py-3 rounded-xl font-bold text-base hover:bg-gray-800 transition-all shadow-md active:scale-95"
            >
              Search
            </button>
          </div>
        </div>

        {/* CATEGORIES SCROLL */}
        <div className="px-4 md:px-6 pb-4 flex gap-2 overflow-x-auto hide-scrollbar">
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

      {/* --- SCROLLABLE CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6" onClick={() => setShowDropdown(false)}>
        {loading ? (
          <div className="text-center py-20 text-gray-400"><div className="animate-spin text-3xl mb-2">⏳</div>Searching...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-bold">No results found.</p>
            <p className="text-sm text-gray-400">Try increasing the radius or changing the city.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col h-full">
                <div className="h-40 bg-gray-200 relative">
                  {place.photos?.[0] ? (
                    <img src={place.photos[0].getUrl({ maxWidth: 400 })} className="w-full h-full object-cover" alt={place.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📷</div>
                  )}
                  {place.rating && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white">
                      ⭐ {place.rating} ({place.user_ratings_total})
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-base text-gray-900 line-clamp-1">{place.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{place.formatted_address}</p>
                  <button
                    onClick={() => window.open(`http://googleusercontent.com/maps.google.com/search?q=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`, '_blank')}
                    className="mt-auto w-full bg-gray-50 text-black py-3 rounded-xl text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors border border-gray-200"
                  >
                    Get Directions 📍
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}