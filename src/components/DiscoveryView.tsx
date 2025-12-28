'use client';
import { useState, useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const LIBRARIES: ("places")[] = ["places"];

// 1. CONSTANTS FOR FILTERS
const DIET_OPTIONS = [
  { id: 'ANY', label: 'Any Diet' },
  { id: 'VEG', label: '🥗 Veg' },
  { id: 'NON_VEG', label: '🍗 Non-Veg' },
  { id: 'JAIN', label: '🥬 Jain' },
  { id: 'HALAL', label: '🥩 Halal' },
  { id: 'VEGAN', label: '🌱 Vegan' }
];

const BUDGET_OPTIONS = [
  { id: 'ANY', label: 'Any Price' },
  { id: 'LOW', label: '💰 Cheap' },
  { id: 'MEDIUM', label: '💰💰 Moderate' },
  { id: 'HIGH', label: '💰💰💰 Luxury' }
];

interface DiscoveryProps {
  onAddToTrip: (place: any) => void;
  onBack?: () => void;
}

export default function DiscoveryView({ onAddToTrip, onBack }: DiscoveryProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  // STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tourist_attraction'); 
  
  // NEW FILTERS STATE
  const [diet, setDiet] = useState('ANY');
  const [budget, setBudget] = useState('ANY');
  const [radius, setRadius] = useState(10); // Default 10km
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [usingGPS, setUsingGPS] = useState(false);

  // REFS
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isLoaded && searchInputRef.current && window.google) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'name', 'formatted_address'],
      });

      const hiddenDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(hiddenDiv);

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.name) {
          setSearchTerm(place.name);
          setUsingGPS(false); // Manually typed overrides GPS
        }
      });
    }
  }, [isLoaded]);

  // --- 2. GEOLOCATION HANDLER ---
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);
        setUsingGPS(true);
        setSearchTerm("Current Location");
        setLoading(false);
        // Trigger search immediately with new location
        performSearch(loc, activeTab, diet, budget, radius);
      },
      (error) => {
        alert("Unable to retrieve location: " + error.message);
        setLoading(false);
      }
    );
  };

  const handleSearchClick = () => {
    performSearch(usingGPS ? userLocation : null, activeTab, diet, budget, radius);
  };

  // --- 3. SMART SEARCH ENGINE ---
  const performSearch = (
    location: {lat: number, lng: number} | null, 
    category: string, 
    dietFilter: string, 
    budgetFilter: string, 
    searchRadius: number
  ) => {
    if (!placesServiceRef.current) return;
    if (!searchTerm && !location) return alert("Please enter a city or use your location.");

    setLoading(true);
    setPlaces([]);

    // A. Construct the Query
    let baseQuery = category.replace(/_/g, ' '); // e.g., "turf grounds"
    
    // Add Diet Context (Only for food categories)
    if (['restaurant', 'cafe', 'bakery'].includes(category) || category === 'food') {
       if (dietFilter !== 'ANY') baseQuery = `${DIET_OPTIONS.find(d => d.id === dietFilter)?.label.split(' ')[1]} ${baseQuery}`;
    }

    // Add Budget Context
    if (budgetFilter !== 'ANY') {
      const budgetTerm = budgetFilter === 'LOW' ? 'Cheap' : budgetFilter === 'HIGH' ? 'Luxury' : 'Best';
      baseQuery = `${budgetTerm} ${baseQuery}`;
    }

    // B. Contextual Search String
    // If using GPS: "Veg Restaurants" (location passed in options)
    // If Text Search: "Veg Restaurants in Indiranagar"
    const finalTextQuery = usingGPS ? baseQuery : `${baseQuery} in ${searchTerm}`;

    // --- FIX IS HERE: Removed 'fields' property ---
    const request: google.maps.places.TextSearchRequest = {
      query: finalTextQuery,
      // fields: [...] <--- REMOVED THIS LINE
    };

    // Apply Location Biasing if GPS is active
    if (usingGPS && location) {
      request.location = location;
      request.radius = searchRadius * 1000; // Convert km to meters
    }

    placesServiceRef.current.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const formattedPlaces = results.map(place => ({
          id: place.place_id,
          name: place.name,
          description: place.formatted_address,
          image: place.photos?.[0]?.getUrl() || `https://source.unsplash.com/random/400x300/?${category.split('_')[0]}`,
          rating: place.rating || 4.0,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          type: category
        }));
        setPlaces(formattedPlaces);
      }
      setLoading(false);
    });
  };

  // Auto-run search when category changes (only if we already have a location/term)
  useEffect(() => {
    if (searchTerm || usingGPS) handleSearchClick();
  }, [activeTab]);

  // --- 4. NAVIGATION HANDLER ---
  const handleGetDirections = (place: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.id}`;
    window.open(url, '_blank');
  };

  if (!isLoaded) return <div className="p-10 text-center">Loading Discovery Engine...</div>;

  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-gray-200 hover:shadow-md transition-all text-gray-600 font-bold">←</button>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Discover</h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
               Real-time suggestions by AI based on your VIBE!!
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS CONTAINER */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 mb-8">
        
        {/* ROW 1: SEARCH BAR + GPS */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 focus-within:border-blue-500 transition-all">
            <span className="text-gray-400">📍</span>
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setUsingGPS(false); }}
              placeholder="Search Area (e.g. Koramangala)"
              className="w-full bg-transparent font-bold text-gray-700 outline-none placeholder-gray-400 text-sm"
            />
          </div>
          
          <button 
            onClick={handleUseMyLocation}
            className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border transition-all
              ${usingGPS ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            🎯 <span className="hidden md:inline">Use My Location</span>
          </button>
          
          <button 
            onClick={handleSearchClick}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform text-sm"
          >
            {loading ? 'Scanning...' : 'Search'}
          </button>
        </div>

        {/* ROW 2: SMART FILTERS */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          
          {/* DIET FILTER (Show only for food categories to reduce clutter) */}
          {['restaurant', 'cafe'].includes(activeTab) && (
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Diet:</span>
               <select 
                 value={diet} 
                 onChange={(e) => setDiet(e.target.value)}
                 className="bg-gray-50 border-gray-200 text-xs font-bold rounded-lg p-2 outline-none focus:border-blue-500"
               >
                 {DIET_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
               </select>
             </div>
          )}

          {/* BUDGET FILTER */}
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-gray-400 uppercase">Budget:</span>
             <select 
               value={budget} 
               onChange={(e) => setBudget(e.target.value)}
               className="bg-gray-50 border-gray-200 text-xs font-bold rounded-lg p-2 outline-none focus:border-blue-500"
             >
               {BUDGET_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
             </select>
          </div>

          {/* RADIUS SLIDER */}
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
             <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Radius: {radius} km</span>
             <input 
               type="range" min="1" max="50" value={radius} 
               onChange={(e) => setRadius(parseInt(e.target.value))}
               className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
          </div>

        </div>
      </div>

      {/* CATEGORIES (Updated List) */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {[
          { id: 'tourist_attraction', label: '🔥 Trending', icon: '✨' },
          { id: 'restaurant', label: 'Eat', icon: '🍽️' },
          
          // --- NEW CATEGORIES ---
          { id: 'night_club', label: 'Nightlife', icon: '🍻' }, 
          { id: 'off_road_trails', label: 'Off-Roading', icon: '🏍️' },
          { id: 'play_spots', label: 'Play & Sports', icon: '🏏' }, // Covers cricket, badminton, bowling
          // --------------------

          { id: 'turf_grounds', label: 'Turfs', icon: '⚽' },
          { id: 'lodging', label: 'Stay', icon: '🏨' },
          { id: 'shopping_mall', label: 'Shop', icon: '🛍️' },
        ].map((cat) => (
           <button 
             key={cat.id} 
             onClick={() => setActiveTab(cat.id)}
             className={`px-5 py-3 rounded-full text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap
               ${activeTab === cat.id ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
           >
             <span>{cat.icon}</span> {cat.label}
           </button>
        ))}
      </div>

      {/* RESULTS GRID */}
      <div className="min-h-[300px]">
        <h3 className="text-sm font-bold text-gray-800 mb-4 px-1">
          Results for <span className="text-blue-600">"{activeTab.replace(/_/g, ' ')}"</span>
          {usingGPS ? ' near you' : ` in ${searchTerm || '...'}`}
        </h3>

        {places.length === 0 && !loading ? (
          <div className="text-center py-20 text-gray-300 border-2 border-dashed border-gray-200 rounded-3xl">
            <div className="text-4xl mb-2">🔭</div>
            Use "Use My Location" or type an area to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {places.map((place) => (
              <div key={place.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all cursor-pointer">
                <div className="h-40 bg-gray-200 w-full relative">
                  <img src={place.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={place.name} />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                    ⭐ {place.rating}
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 text-sm">{place.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-4 line-clamp-2 min-h-[30px]">{place.description}</p>
                  
                  <div className="flex gap-2">
                     {/* GET DIRECTIONS BUTTON (Primary) */}
                     <button 
                       onClick={() => handleGetDirections(place)}
                       className="flex-1 py-2.5 bg-blue-600 text-white text-[11px] font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1 shadow-blue-100 shadow-lg"
                     >
                       🗺️ Directions
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