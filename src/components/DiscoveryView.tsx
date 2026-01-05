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

const CATEGORIES = [
  { id: 'tourist_attraction', label: '🎡 Attractions' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'restaurant', label: '🍽️ Restaurants' },
  { id: 'cafe', label: '☕ Cafes' },
  { id: 'amusement_park', label: '🎢 Theme Parks' },
  { id: 'off_roading', label: '🏍️ Off-Roading' },
  { id: 'turf', label: '⚽ Turfs' },
  { id: 'shopping_mall', label: '🛍️ Shopping' },
  { id: 'lodging', label: '🏨 Hotels' },
  { id: 'park', label: '🌳 Parks' }
];

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // STATE
  const [currentCity, setCurrentCity] = useState(initialCity || 'Bangalore');
  const [searchTerm, setSearchTerm] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(5000);
  const [diet, setDiet] = useState('ANY');

  // RESULTS STATE
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  // REFS
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      const mapDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(mapDiv);
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    }

    if (initialCity) {
      setSearchTerm(initialCity);
      performSearch(initialCity, activeCategory, radius);
    }
  }, [initialCity]);

  // --- 1. LIVE LOCATION LOGIC ---
  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setSearchTerm("Locating..."); // Visual feedback

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            // Find the city name (locality)
            const cityComponent = results[0].address_components.find(c => c.types.includes('locality'));

            if (cityComponent) {
              const detectedCity = cityComponent.long_name;
              setSearchTerm(detectedCity);
              setCurrentCity(detectedCity);
              performSearch(detectedCity, activeCategory, radius);
            } else {
              alert("City not found in your location.");
              setSearchTerm("");
            }
          } else {
            alert("Could not detect location address.");
            setSearchTerm("");
          }
        });
      },
      () => {
        alert("Unable to retrieve your location. Please check permissions.");
        setSearchTerm("");
      }
    );
  };

  // --- 2. CITY AUTOCOMPLETE LOGIC ---
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (val.length < 3 || !autocompleteServiceRef.current) {
      setCitySuggestions([]);
      setShowDropdown(false);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions({
      input: val,
      types: ['(cities)'],
    }, (predictions, status) => {
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
    performSearch(cityName, activeCategory, radius);
  };

  // --- 3. SEARCH LOGIC ---
  const performSearch = (city: string, category: string, searchRadius: number) => {
    if (!placesServiceRef.current) return;
    setLoading(true);

    let query = '';
    switch (category) {
      case 'trending': query = `popular places in ${city}`; break;
      case 'off_roading': query = `off road biking trails in ${city}`; break;
      case 'turf': query = `sports turf cricket football in ${city}`; break;
      case 'amusement_park': query = `amusement park in ${city}`; break;
      default: query = `${category.replace('_', ' ')} in ${city}`; break;
    }

    if (['restaurant', 'cafe', 'trending'].includes(category)) {
      if (diet === 'VEG') query += ' pure vegetarian';
      if (diet === 'JAIN') query += ' jain food';
      if (diet === 'HALAL') query += ' halal';
      if (diet === 'EGG') query += ' eggetarian';
      if (diet === 'VEGAN') query += ' vegan';
    }

    const request = {
      query: query,
      fields: ['name', 'geometry', 'formatted_address', 'photos', 'rating', 'user_ratings_total', 'place_id', 'types', 'price_level']
    };

    placesServiceRef.current.textSearch(request, (places, status) => {
      setLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && places) {
        setResults(places as Place[]);
      } else {
        setResults([]);
      }
    });
  };

  // --- HANDLERS ---
  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    performSearch(currentCity, catId, radius);
  };

  const handleGetDirection = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">

        {/* Top Row: Title & Back */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Discover {currentCity}</h2>
            <p className="text-xs text-gray-500">Explore top spots in the city</p>
          </div>
          <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-black transition-colors bg-gray-100 px-3 py-2 rounded-lg">
            ← Back to Plan
          </button>
        </div>

        {/* Middle Row: CITY SEARCH & Filters */}
        <div className="px-6 py-4 grid gap-4 md:grid-cols-[2fr_1fr_1fr] items-center relative">

          {/* CITY INPUT + LIVE LOCATION BUTTON */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="Change City (e.g. Mysore)..."
                value={searchTerm}
                onChange={handleCityInput}
                autoComplete="off"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🌍</span>

              {/* DROPDOWN */}
              {showDropdown && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {citySuggestions.map((suggestion) => (
                    <div
                      key={suggestion.place_id}
                      onClick={() => selectCity(suggestion.description)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 text-sm font-bold text-gray-700 flex items-center gap-2"
                    >
                      <span>📍</span> {suggestion.description}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LIVE LOCATION BUTTON */}
            <button
              onClick={handleLiveLocation}
              className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center"
              title="Use My Live Location"
            >
              📍
            </button>
          </div>

          {/* Radius Input */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase whitespace-nowrap">Radius (km):</span>
            <input
              type="number"
              min="1"
              max="100"
              value={radius / 1000}
              onChange={(e) => {
                const km = Number(e.target.value);
                if (km >= 0) {
                  setRadius(km * 1000);
                  performSearch(currentCity, activeCategory, km * 1000);
                }
              }}
              className="w-full bg-transparent text-sm font-bold focus:outline-none text-gray-900"
            />
          </div>

          {/* Diet Filter */}
          <div>
            <select
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none cursor-pointer"
              value={diet}
              onChange={(e) => {
                setDiet(e.target.value);
                performSearch(currentCity, activeCategory, radius);
              }}
            >
              <option value="ANY">🍽️ Any Diet</option>
              <option value="VEG">🥦 Vegetarian</option>
              <option value="EGG">🍳 Eggetarian</option>
              <option value="NON_VEG">🍗 Non-Veg</option>
              <option value="JAIN">🌿 Jain</option>
              <option value="HALAL">🍖 Halal</option>
              <option value="VEGAN">🥗 Vegan</option>
            </select>
          </div>
        </div>

        {/* Bottom Row: Categories */}
        <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat.id
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. RESULTS GRID */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="animate-spin text-3xl mb-2">⏳</div>
            <p className="font-bold">Searching {currentCity}...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p className="font-bold">No results found.</p>
            <p className="text-xs">Try a different category or increase radius.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-gray-100">

                {/* Image */}
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                  {place.photos?.[0] ? (
                    <img
                      src={place.photos[0].getUrl({ maxWidth: 400 })}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={place.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100 text-3xl">📷</div>
                  )}
                  {place.rating && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                      ⭐ {place.rating} <span className="opacity-70">({place.user_ratings_total})</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-md text-gray-900 leading-tight mb-1 line-clamp-1" title={place.name}>
                    {place.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 flex-1">
                    {place.formatted_address}
                  </p>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleGetDirection(place)}
                      className="flex-1 bg-black text-white py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                      📍 Get Direction
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