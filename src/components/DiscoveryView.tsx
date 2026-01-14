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
  { id: 'local_market', label: '🌸 Santhe / Markets' }, // <--- NEW CATEGORY ADDED HERE
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

// FILTER OPTIONS
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

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // CORE STATE
  const [currentCity, setCurrentCity] = useState(initialCity || 'Bangalore');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(5000);

  // CONDITIONAL FILTERS STATE
  const [diet, setDiet] = useState('ANY');
  const [stayType, setStayType] = useState('ANY');
  const [budget, setBudget] = useState('ANY');

  // RESULTS STATE
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  // SUGGESTIONS STATE
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

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
      performSearch(initialCity, activeCategory);
    }
  }, [initialCity]);

  // --- SEARCH LOGIC ---
  const performSearch = (city: string, category: string) => {
    if (!placesServiceRef.current) return;
    setLoading(true);

    let query = '';

    // 1. BASE QUERY MAPPING
    switch (category) {
      case 'trending': query = `popular places in ${city}`; break;
      case 'off_roading': query = `off road biking trails in ${city}`; break;
      case 'turf': query = `sports turf cricket football in ${city}`; break;
      case 'amusement_park': query = `amusement park in ${city}`; break;

      // --- NEW CATEGORIES ---
      case 'iconic': query = `legendary famous old restaurants in ${city}`; break;
      case 'late_night': query = `late night food early morning biryani in ${city}`; break;
      
      // 🌸 NEW SANKRANTHI LOGIC 🌸
      case 'local_market': query = `flower market vegetable mandi santhe traditional bazaar in ${city}`; break;

      default: query = `${category.replace('_', ' ')} in ${city}`; break;
    }

    // 2. APPLY FOOD FILTERS (Only for Food Categories)
    if (['restaurant', 'cafe', 'trending', 'iconic', 'late_night'].includes(category)) {
      if (diet === 'VEG') query += ' pure vegetarian';
      if (diet === 'JAIN') query += ' jain food';
      if (diet === 'HALAL') query += ' halal';
      if (diet === 'EGG') query += ' eggetarian';
      if (diet === 'VEGAN') query += ' vegan';
    }

    // 3. APPLY STAY FILTERS (Only for Lodging)
    if (category === 'lodging') {
      if (stayType !== 'ANY') query = `${stayType} in ${city}`;
      if (budget !== 'ANY') query += ` ${budget}`;
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

  // --- CITY AUTOCOMPLETE ---
  const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val.length < 3 || !autocompleteServiceRef.current) {
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
    performSearch(cityName, activeCategory);
  };

  const handleLiveLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
    setSearchTerm("Locating...");
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (res, status) => {
        if (status === "OK" && res?.[0]) {
          const city = res[0].address_components.find(c => c.types.includes('locality'))?.long_name;
          if (city) { setSearchTerm(city); setCurrentCity(city); performSearch(city, activeCategory); }
        } else { alert("Location failed."); setSearchTerm(""); }
      });
    });
  };

  const handleGetDirection = (place: Place) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=$?q=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">

        {/* Title */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div><h2 className="text-xl font-black text-gray-900">Discover {currentCity}</h2><p className="text-xs text-gray-500">Explore top rated spots nearby</p></div>
          <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-black transition-colors bg-gray-100 px-3 py-2 rounded-lg">← Back to Plan</button>
        </div>

        {/* INPUTS ROW */}
        <div className="px-6 py-4 grid gap-3 md:grid-cols-12 items-center relative">

          {/* A. CITY SEARCH (Width: 4/12) */}
          <div className="md:col-span-4 relative flex gap-2">
            <div className="relative flex-1">
              <input className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none" placeholder="Change City..." value={searchTerm} onChange={handleCityInput} />
              <span className="absolute left-3 top-2.5 text-gray-400">🌍</span>
              {showDropdown && citySuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {citySuggestions.map((s) => (
                    <div key={s.place_id} onClick={() => selectCity(s.description)} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 text-sm font-bold text-gray-700 flex gap-2"><span>📍</span> {s.description}</div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleLiveLocation} className="px-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100">📍</button>
          </div>

          {/* B. RADIUS (Width: 3/12) */}
          <div className="md:col-span-3 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase whitespace-nowrap">Dist (km)</span>
            <input type="number" min="1" max="100" value={radius / 1000} onChange={(e) => { const km = Number(e.target.value); if (km >= 0) { setRadius(km * 1000); performSearch(currentCity, activeCategory); } }} className="w-full bg-transparent text-sm font-bold focus:outline-none text-gray-900" />
          </div>

          {/* C. CONDITIONAL FILTERS (Width: 5/12) */}
          <div className="md:col-span-5 flex gap-2">

            {/* 1. RESTAURANT FILTERS */}
            {(['restaurant', 'cafe', 'iconic', 'late_night', 'trending'].includes(activeCategory)) && (
              <select className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none cursor-pointer" value={diet} onChange={(e) => { setDiet(e.target.value); performSearch(currentCity, activeCategory); }}>
                <option value="ANY">🍽️ Any Diet</option>
                <option value="VEG">🥦 Vegetarian</option>
                <option value="EGG">🍳 Eggetarian</option>
                <option value="NON_VEG">🍗 Non-Veg</option>
                <option value="JAIN">🌿 Jain</option>
                <option value="HALAL">🍖 Halal</option>
                <option value="VEGAN">🥗 Vegan</option>
              </select>
            )}

            {/* 2. HOTEL FILTERS */}
            {activeCategory === 'lodging' && (
              <>
                <select className="w-1/2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none cursor-pointer" value={stayType} onChange={(e) => { setStayType(e.target.value); performSearch(currentCity, activeCategory); }}>
                  {STAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="w-1/2 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none cursor-pointer" value={budget} onChange={(e) => { setBudget(e.target.value); performSearch(currentCity, activeCategory); }}>
                  {BUDGET_LEVELS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </>
            )}

            {/* 3. DEFAULT */}
            {!['restaurant', 'cafe', 'lodging', 'iconic', 'late_night', 'trending'].includes(activeCategory) && (
              <div className="w-full text-xs text-gray-400 flex items-center justify-center italic">No extra filters</div>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => { setActiveCategory(cat.id); performSearch(currentCity, cat.id); }} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. RESULTS GRID */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? <div className="h-full flex flex-col items-center justify-center text-gray-400"><div className="animate-spin text-3xl mb-2">⏳</div><p className="font-bold">Searching {currentCity}...</p></div> : results.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-gray-400"><p className="font-bold">No results found.</p><p className="text-xs">Try increasing radius or changing filters.</p></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full border border-gray-100">
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                  {place.photos?.[0] ? <img src={place.photos[0].getUrl({ maxWidth: 400 })} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={place.name} /> : <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100 text-3xl">📷</div>}
                  {place.rating && <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">⭐ {place.rating} <span className="opacity-70">({place.user_ratings_total})</span></div>}
                  
                  {/* ✨ BADGE FOR SANTHE MARKETS ✨ */}
                  {activeCategory === 'local_market' && (
                    <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-md">
                      🌸 Festival Special
                    </div>
                  )}

                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-md text-gray-900 leading-tight mb-1 line-clamp-1" title={place.name}>{place.name}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 flex-1">{place.formatted_address}</p>
                  <div className="flex gap-2 mt-auto"><button onClick={() => handleGetDirection(place)} className="flex-1 bg-black text-white py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg">📍 Get Direction</button></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}