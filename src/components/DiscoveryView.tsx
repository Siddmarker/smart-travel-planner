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
}

interface DiscoveryViewProps {
  onAddToTrip: (place: any) => void; 
  onBack: () => void;
  initialCity: string;
}

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState('tourist attractions');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Init Google Service
    if (typeof window !== 'undefined' && window.google && !serviceRef.current) {
      const mapDiv = document.createElement('div');
      serviceRef.current = new window.google.maps.places.PlacesService(mapDiv);
    }
    // Search on load
    if (initialCity) {
      handleSearch(initialCity, 'tourist attractions');
    }
  }, [initialCity]);

  const handleSearch = (city: string, query: string) => {
    if (!serviceRef.current) return;
    setLoading(true);

    const request = {
      query: `${query} in ${city}`,
      fields: ['name', 'geometry', 'formatted_address', 'photos', 'rating', 'user_ratings_total', 'place_id', 'types']
    };

    serviceRef.current.textSearch(request, (places, status) => {
      setLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && places) {
        setResults(places as Place[]);
      }
    });
  };

  // --- NEW: GET DIRECTION LOGIC ---
  const handleGetDirection = (place: Place) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      
      {/* 1. Header Section */}
      <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-end sticky top-0 z-10 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Discover {initialCity}</h2>
          <p className="text-gray-500 text-sm mt-1">Find the best spots recommended for you</p>
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2">
          {['Top Attractions', 'Restaurants', 'Cafes', 'Shopping', 'Hotels'].map((tag) => (
            <button
              key={tag}
              onClick={() => { setSearchQuery(tag); handleSearch(initialCity, tag); }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                searchQuery === tag 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Results Grid (Restoring the Ooty Look) */}
      <div className="flex-1 overflow-y-auto p-8">
        <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase tracking-wider">
          Results for "{searchQuery}"
        </h3>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400 font-bold animate-pulse">
            Loading places...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
                
                {/* Image */}
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {place.photos?.[0] ? (
                    <img 
                      src={place.photos[0].getUrl({ maxWidth: 400 })} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={place.name} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100 text-4xl">📸</div>
                  )}
                  {/* Rating Badge */}
                  {place.rating && (
                    <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-md flex items-center gap-1">
                      ⭐ {place.rating} <span className="text-gray-400">({place.user_ratings_total})</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="font-bold text-lg text-gray-900 leading-tight mb-2 line-clamp-1" title={place.name}>
                    {place.name}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">
                    {place.formatted_address}
                  </p>
                  
                  {/* Action Row */}
                  <div className="flex gap-2 mt-auto">
                    {/* MAIN BUTTON: Get Direction */}
                    <button 
                      onClick={() => handleGetDirection(place)}
                      className="flex-1 bg-black text-white py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                    >
                      📍 Get Direction
                    </button>
                    
                    {/* Small Map Icon (Optional: Also opens maps) */}
                    <button 
                      onClick={() => handleGetDirection(place)}
                      className="w-10 h-auto bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
                    >
                      🗺️
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