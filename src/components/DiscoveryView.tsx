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
  onAddToTrip: (place: any) => void; // Kept for compatibility, but unused for now
  onBack: () => void;
  initialCity: string;
}

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState('tourist attractions');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    // Initialize Places Service
    if (typeof window !== 'undefined' && window.google && !serviceRef.current) {
      const mapDiv = document.createElement('div');
      serviceRef.current = new window.google.maps.places.PlacesService(mapDiv);
    }
    // Auto-search on load
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
    // Opens Google Maps in a new tab with the destination set
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Discover {initialCity}</h2>
          <p className="text-sm text-gray-500">Find top rated places around you</p>
        </div>
        <button onClick={onBack} className="text-sm font-bold text-gray-400 hover:text-black transition-colors">
          ← Back to Plan
        </button>
      </div>

      {/* Categories / Search Tags */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
        {['Top Attractions', 'Restaurants', 'Cafes', 'Shopping', 'Hotels'].map((tag) => (
          <button
            key={tag}
            onClick={() => { setSearchQuery(tag); handleSearch(initialCity, tag); }}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              searchQuery === tag ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-4">Results for "{searchQuery}" in {initialCity}</h3>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400 font-bold animate-pulse">
            Searching best spots...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((place) => (
              <div key={place.place_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all flex flex-col h-full">
                
                {/* Image Section */}
                <div className="h-48 w-full bg-gray-200 relative">
                  {place.photos?.[0] ? (
                    <img 
                      src={place.photos[0].getUrl({ maxWidth: 400 })} 
                      className="w-full h-full object-cover" 
                      alt={place.name} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">📸</div>
                  )}
                  {/* Rating Badge */}
                  {place.rating && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
                      ⭐ {place.rating} <span className="text-gray-400 font-normal">({place.user_ratings_total})</span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-lg text-gray-900 mb-1 truncate" title={place.name}>{place.name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{place.formatted_address}</p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    {/* UPDATED BUTTON: GET DIRECTION */}
                    <button 
                      onClick={() => handleGetDirection(place)}
                      className="flex-1 bg-black text-white py-2.5 rounded-lg font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <span>📍</span> Get Direction
                    </button>
                    
                    {/* Map Icon Button (Optional: Opens in Plan view or similar) */}
                    <button 
                      onClick={() => handleGetDirection(place)} // reusing direction for map icon too
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
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