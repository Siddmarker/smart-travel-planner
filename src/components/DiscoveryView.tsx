'use client';
import { useState, useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';

const LIBRARIES: ("places")[] = ["places"];

// ... (CONSTANTS remain the same: DIET_OPTIONS, BUDGET_OPTIONS, RELIGION_OPTIONS) ...
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

const RELIGION_OPTIONS = [
  { id: 'ANY', label: 'All Faiths' },
  { id: 'HINDU', label: '🕉️ Hindu' },
  { id: 'MUSLIM', label: '☪️ Muslim' },
  { id: 'CHRISTIAN', label: '✝️ Christian' },
  { id: 'SIKH', label: '🪯 Sikh' },
  { id: 'BUDDHIST', label: '☸️ Buddhist' },
  { id: 'JAIN', label: '✋ Jain' }
];

interface DiscoveryProps {
  onAddToTrip: (place: any) => void;
  onBack?: () => void;
  initialCity?: string; // <--- NEW PROP
}

export default function DiscoveryView({ onAddToTrip, onBack, initialCity = '' }: DiscoveryProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  // STATE: Initialize searchTerm with the city passed from Dashboard
  const [searchTerm, setSearchTerm] = useState(initialCity); 
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tourist_attraction'); 
  
  // FILTERS
  const [diet, setDiet] = useState('ANY');
  const [budget, setBudget] = useState('ANY');
  const [religion, setReligion] = useState('ANY');
  const [radius, setRadius] = useState(10); 
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [usingGPS, setUsingGPS] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // --- AUTO-SEARCH ON LOAD ---
  // If a city was passed (e.g. "Madurai"), trigger search immediately when Maps loads
  useEffect(() => {
    if (isLoaded && placesServiceRef.current && initialCity) {
       performSearch(null, activeTab, diet, budget, radius, religion);
    }
  }, [isLoaded, initialCity]); 

  useEffect(() => {
    if (isLoaded && searchInputRef.current && window.google) {
      autocompleteRef.current = new google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'name', 'formatted_address'],
      });

      const hiddenDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(hiddenDiv);

      // Trigger initial search if we have a city but no service yet
      if (initialCity) {
         performSearch(null, activeTab, diet, budget, radius, religion);
      }

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.name) {
          setSearchTerm(place.name);
          setUsingGPS(false);
        }
      });
    }
  }, [isLoaded]);

  // --- GEOLOCATION ---
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
        performSearch(loc, activeTab, diet, budget, radius, religion);
      },
      (error) => {
        alert("Unable to retrieve location: " + error.message);
        setLoading(false);
      }
    );
  };

  const handleSearchClick = () => {
    performSearch(usingGPS ? userLocation : null, activeTab, diet, budget, radius, religion);
  };

  // --- SEARCH ENGINE ---
  const performSearch = (
    location: {lat: number, lng: number} | null, 
    category: string, 
    dietFilter: string, 
    budgetFilter: string, 
    searchRadius: number,
    religionFilter: string
  ) => {
    if (!placesServiceRef.current) return;
    
    // Safety check: Don't search if empty
    if (!searchTerm && !location) return;

    setLoading(true);
    setPlaces([]);

    // 1. Construct Query
    let baseQuery = category.replace(/_/g, ' '); 
    
    // Diet Context
    if (['restaurant', 'cafe', 'bakery'].includes(category) || category === 'food') {
       if (dietFilter !== 'ANY') baseQuery = `${DIET_OPTIONS.find(d => d.id === dietFilter)?.label.split(' ')[1]} ${baseQuery}`;
    }

    // Budget Context
    if (budgetFilter !== 'ANY') {
      const budgetTerm = budgetFilter === 'LOW' ? 'Cheap' : budgetFilter === 'HIGH' ? 'Luxury' : 'Best';
      baseQuery = `${budgetTerm} ${baseQuery}`;
    }

    // Religion Context
    if (category === 'religious_place' && religionFilter !== 'ANY') {
        const religionMap: Record<string, string> = {
            'HINDU': 'Hindu Temple',
            'MUSLIM': 'Mosque',
            'CHRISTIAN': 'Church',
            'SIKH': 'Gurdwara',
            'BUDDHIST': 'Buddhist Temple',
            'JAIN': 'Jain Temple'
        };
        baseQuery = religionMap[religionFilter] || baseQuery;
    }

    // KEY FIX: Ensure we use the searchTerm (e.g., "Madurai")
    const finalTextQuery = usingGPS ? baseQuery : `${baseQuery} in ${searchTerm}`;

    const request: google.maps.places.TextSearchRequest = {
      query: finalTextQuery,
    };

    if (usingGPS && location) {
      request.location = location;
      request.radius = searchRadius * 1000; 
    }

    placesServiceRef.current.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        
        const validPlaces = results.filter(place => {
            if (place.business_status !== 'OPERATIONAL') return false;
            // Relax rating filter slightly to catch more places in smaller cities
            const minRating = category === 'religious_place' ? 0 : 3.0; 
            if ((place.rating || 0) < minRating) return false;
            return true;
        });

        const formattedPlaces = validPlaces.map(place => ({
          id: place.place_id,
          name: place.name,
          description: place.formatted_address,
          image: place.photos?.[0]?.getUrl() || `https://source.unsplash.com/random/400x300/?${category.split('_')[0]}`,
          rating: place.rating,
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
          type: category,
          reviewCount: place.user_ratings_total
        }));

        setPlaces(formattedPlaces);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    if (searchTerm || usingGPS) handleSearchClick();
  }, [activeTab]);

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

      {/* SEARCH & FILTERS */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100 focus-within:border-blue-500 transition-all">
            <span className="text-gray-400">📍</span>
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setUsingGPS(false); }}
              placeholder="Search Area (e.g. Madurai)"
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

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          
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

          {activeTab === 'religious_place' && (
             <div className="flex items-center gap-2 animate-fade-in">
               <span className="text-[10px] font-bold text-gray-400 uppercase">Faith:</span>
               <select 
                 value={religion} 
                 onChange={(e) => setReligion(e.target.value)}
                 className="bg-purple-50 border-purple-200 text-purple-700 text-xs font-bold rounded-lg p-2 outline-none focus:border-purple-500"
               >
                 {RELIGION_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
               </select>
             </div>
          )}

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

          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Radius (km):</span>
             <input 
               type="number" 
               min="1" 
               max="50" 
               value={radius} 
               onChange={(e) => setRadius(Number(e.target.value))}
               className="w-16 bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg p-2 outline-none focus:border-blue-500 text-center"
             />
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {[
          { id: 'tourist_attraction', label: '🔥 Trending', icon: '✨' },
          { id: 'restaurant', label: 'Eat', icon: '🍽️' },
          { id: 'religious_place', label: 'Religious', icon: '🙏' },
          { id: 'museum', label: 'Museums', icon: '🏛️' },
          { id: 'night_club', label: 'Nightlife', icon: '🍻' }, 
          { id: 'play_spots', label: 'Play & Sports', icon: '🏏' },
          { id: 'off_road_trails', label: 'Off-Roading', icon: '🏍️' },
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
             {searchTerm ? `No places found in "${searchTerm}". Try adjusting spelling.` : 'Type a city name to start.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {places.map((place) => (
              <div key={place.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all cursor-pointer">
                <div className="h-40 bg-gray-200 w-full relative">
                  <img src={place.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={place.name} />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-1">
                    ⭐ {place.rating} <span className="text-gray-400">({place.reviewCount})</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 text-sm">{place.name}</h4>
                  <p className="text-[10px] text-gray-500 mb-4 line-clamp-2 min-h-[30px]">{place.description}</p>
                  
                  <div className="flex gap-2">
                     <button 
                       onClick={() => onAddToTrip(place)} 
                       className="flex-1 py-2.5 bg-black text-white text-[11px] font-bold rounded-xl hover:scale-105 transition-transform"
                     >
                       + Add to Trip
                     </button>
                     <button 
                       onClick={() => handleGetDirections(place)}
                       className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
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