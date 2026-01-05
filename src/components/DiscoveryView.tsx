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
  { id: 'restaurant', label: '🍽️ Restaurants' },
  { id: 'cafe', label: '☕ Cafes' },
  { id: 'shopping_mall', label: '🛍️ Shopping' },
  { id: 'lodging', label: '🏨 Hotels' },
  { id: 'park', label: '🌳 Parks' }
];

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // SEARCH STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(5000); // Default 5km
  const [diet, setDiet] = useState('ANY'); // ANY, VEG, NON_VEG

  // RESULTS STATE
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Initialize Service
    if (typeof window !== 'undefined' && window.google && !serviceRef.current) {
      const mapDiv = document.createElement('div');
      serviceRef.current = new window.google.maps.places.PlacesService(mapDiv);
    }
    // Auto-search on load
    if (initialCity) {
      performSearch(initialCity, activeCategory, radius);
    }
  }, [initialCity]);

  // --- SEARCH LOGIC ---
  const performSearch = (city: string, category: string, searchRadius: number) => {
    if (!serviceRef.current) return;
    setLoading(true);

    // Build Query
    let query = searchTerm
      ? `${searchTerm} in ${city}`
      : `${category.replace('_', ' ')} in ${city}`;

    // Add Diet Context to Query if needed
    if (category === 'restaurant' && diet === 'VEG') query += ' vegetarian';

    const request = {
      query: query,
      fields: ['name', 'geometry', 'formatted_address', 'photos', 'rating', 'user_ratings_total', 'place_id', 'types', 'price_level']
    };

    serviceRef.current.textSearch(request, (places, status) => {
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
    setSearchTerm(''); // Clear manual search when switching categories
    performSearch(initialCity, catId, radius);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(initialCity, activeCategory, radius);
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
            <h2 className="text-xl font-black text-gray-900">Discover {initialCity}</h2>
            <p className="text-xs text-gray-500">Explore top rated spots nearby</p>
          </div>
          <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-black transition-colors bg-gray-100 px-3 py-2 rounded-lg">
            ← Back to Plan
          </button>
        </div>

        {/* Middle Row: Search Bar & Filters */}
        <div className="px-6 py-4 grid gap-4 md:grid-cols-[2fr_1fr_1fr] items-center">

          {/* Search Bar */}
          <form onSubmit={handleManualSearch} className="relative">
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
              placeholder="Search specifically (e.g. 'Pizza', 'Museum')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </form>

          {/* Radius Slider */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
              <span>Radius</span>
              <span>{(radius / 1000).toFixed(1)} km</span>
            </div>
            <input
              type="range" min="1000" max="20000" step="1000"
              value={radius}
              onChange={(e) => {
                setRadius(Number(e.target.value));
                // Debounce search could be added here, but for now trigger on change
                performSearch(initialCity, activeCategory, Number(e.target.value));
              }}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>

          {/* Diet Filter */}
          <div>
            <select
              className="w-full p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold focus:outline-none cursor-pointer"
              value={diet}
              onChange={(e) => {
                setDiet(e.target.value);
                performSearch(initialCity, activeCategory, radius);
              }}
            >
              <option value="ANY">🍽️ Any Diet</option>
              <option value="VEG">🥦 Vegetarian</option>
              <option value="NON_VEG">🍗 Non-Veg</option>
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
            <p className="font-bold">Scouring the map...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p className="font-bold">No results found.</p>
            <p className="text-xs">Try increasing the radius or changing keywords.</p>
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
                  {/* Rating Badge */}
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

                  {/* Action Row */}
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