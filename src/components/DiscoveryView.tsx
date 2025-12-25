'use client';
import { useState, useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

// LIBRARIES: We only need the 'places' library from Google
const LIBRARIES: ("places")[] = ["places"];

export default function DiscoveryView({ onAddToTrip }: { onAddToTrip: (place: any) => void }) {
  // 1. LOAD GOOGLE MAPS SCRIPT
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '', // Make sure to add this to .env.local!
    libraries: LIBRARIES,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tourist_attraction'); // Default category

  // Refs for Google Services
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 2. SETUP AUTOCOMPLETE (The Dropdown System)
  useEffect(() => {
    if (isLoaded && searchInputRef.current) {
      // Initialize Autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['(cities)'], // Limit suggestions to Cities only
        fields: ['geometry', 'name'],
      });

      // Initialize Places Service (using a hidden div, since we don't display a map here)
      const hiddenDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(hiddenDiv);

      // Listen for selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.name) setSearchTerm(place.name); // Auto-fill input
        handleSearch(); // Auto-trigger search
      });
    }
  }, [isLoaded]);

  // 3. FETCH REAL PLACES FROM GOOGLE
  const handleSearch = () => {
    if (!placesServiceRef.current || !searchTerm) return;
    setLoading(true);
    setPlaces([]);

    const request = {
      query: `${activeTab} in ${searchTerm}`, // e.g., "tourist_attraction in Mumbai"
      fields: ['name', 'formatted_address', 'rating', 'photos', 'geometry', 'place_id'],
    };

    placesServiceRef.current.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Transform Google data to match your app's format
        const formattedPlaces = results.map(place => ({
          id: place.place_id,
          name: place.name,
          description: place.formatted_address,
          // Get the photo URL if it exists, otherwise use a placeholder
          image: place.photos?.[0]?.getUrl() || `https://source.unsplash.com/random/400x300/?${activeTab}`,
          rating: place.rating || 4.5,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          type: activeTab
        }));
        setPlaces(formattedPlaces);
      }
      setLoading(false);
    });
  };

  // Trigger search when Tab changes
  useEffect(() => {
    if (searchTerm && isLoaded) {
      handleSearch();
    }
  }, [activeTab]);

  if (!isLoaded) return <div className="p-10 text-center">Loading Google Maps...</div>;

  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-8 font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Discover Places</h1>
        <p className="text-gray-500 mt-1">Real-time suggestions powered by Google Maps</p>
      </div>

      {/* SEARCH BAR WITH AUTOCOMPLETE */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-200 mb-8 max-w-5xl">
        <div className="flex-1 flex items-center gap-3 px-4">
          <span className="text-gray-400">📍</span>
          <input 
            ref={searchInputRef} // <--- Attached to Google Autocomplete
            type="text" 
            placeholder="Search any city (e.g., Delhi, Paris, Tokyo)..."
            className="w-full font-bold text-gray-700 outline-none placeholder-gray-300"
            // We use uncontrolled input for Autocomplete to work best, keeping state in sync manually if needed
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleSearch}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* CATEGORIES (Updated to match Google Types) */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {[
          { id: 'tourist_attraction', label: '🔥 Trending', icon: '✨' },
          { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
          { id: 'lodging', label: 'Hotels', icon: '🏨' },
          { id: 'museum', label: 'Museums', icon: '🏛️' },
          { id: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
          { id: 'park', label: 'Nature', icon: '🌲' },
        ].map((cat) => (
           <button 
             key={cat.id} 
             onClick={() => setActiveTab(cat.id)}
             className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap
               ${activeTab === cat.id ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
           >
             <span>{cat.icon}</span> {cat.label}
           </button>
        ))}
      </div>

      {/* RESULTS GRID */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm min-h-[400px]">
        <h3 className="text-sm font-bold text-gray-800 mb-6">
          Results for <span className="text-blue-600">"{activeTab.replace('_', ' ')}"</span> in {searchTerm || '...'}
        </h3>

        {places.length === 0 && !loading ? (
          <div className="text-center py-20 text-gray-300">
            Type a city name above to see real results!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {places.map((place) => (
              <div key={place.id} className="group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all cursor-pointer">
                <div className="h-40 bg-gray-200 w-full relative">
                  <img 
                    src={place.image} 
                    className="w-full h-full object-cover" 
                    alt={place.name} 
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
                    ⭐ {place.rating}
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">{place.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-3 line-clamp-2">{place.description}</p>
                  <button 
                    onClick={() => onAddToTrip(place)} 
                    className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700"
                  >
                    + Add to Trip
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