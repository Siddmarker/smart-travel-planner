'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript } from '@react-google-maps/api';

// COMPONENTS
import LandingPage from '@/components/LandingPage';
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';

const LIBRARIES: ("places")[] = ["places"];

// TYPES
interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number; 
  types?: string[];     
  description?: string; 
  image?: string;
  aiScore?: number;     
  zone_id?: string; // Added for type safety
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  
  // 1. Google Maps Hook
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 2. Supabase Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    if (isLoaded && !placesServiceRef.current) {
        const hiddenDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(hiddenDiv);
    }

    return () => subscription.unsubscribe();
  }, [isLoaded]);

  // APP STATE
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // TRIP DATA
  const [selectedCity, setSelectedCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); 
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // --- 1. SMART SEARCH (Targeting zone_id) ---
  const handleCitySearch = async (query: string) => {
    setSelectedCity(query);
    
    if (query.length < 3) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      console.log("🔍 Searching DB for:", query);

      // CHANGED: Query 'zone_id' column
      const { data, error } = await supabase
        .from('places')
        .select('zone_id') 
        .ilike('zone_id', `%${query}%`)
        .limit(20);

      if (error) {
        console.error("❌ DB Error:", error.message);
        throw error;
      }

      console.log("✅ DB Result:", data);

      if (data && data.length > 0) {
        // Remove Duplicates (case-insensitive cleanup)
        const uniqueCities = Array.from(new Set(
          data
            .map((p: any) => p.zone_id) 
            .filter((c: any) => c) // Remove nulls
        ));

        setCitySuggestions(uniqueCities as string[]);
        setShowSuggestions(uniqueCities.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } catch (err) {
      console.warn("Search warning:", err);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (name: string) => {
    setSelectedCity(name);
    setShowSuggestions(false);
  };

  // --- 2. GEN 3.0 ALGORITHM ---
  const calculateRelevanceScore = (place: Place, group: string) => {
    try {
      let score = 0;
      const rating = place.rating || 3.0;
      const reviews = place.user_ratings_total || 10;
      const price = place.price_level || 2; 
      const tags = (place.types || []).join(' ').toLowerCase();
      const desc = (place.description || '').toLowerCase();

      const confidence = Math.max(1, Math.log10(reviews));
      let baseScore = (rating * confidence) / (price === 0 ? 1 : price);

      if (price <= 1 && (desc.includes('authentic') || desc.includes('best') || desc.includes('queue'))) {
         baseScore *= 1.5; 
      }
      score = baseScore;

      switch (group) {
        case 'SOLO': 
          if (reviews < 500 && rating > 4.5) score *= 2.0;
          if (tags.includes('hostel') || tags.includes('cafe') || tags.includes('bar')) score *= 1.3;
          break;
        case 'FRIENDS': 
          if (tags.includes('night_club') || tags.includes('bar') || desc.includes('lively')) score *= 1.4;
          if (reviews < 50) score *= 0.5;
          break;
        case 'FAMILY': 
          if (tags.includes('night_club') || tags.includes('bar')) score = 0;
          if (desc.includes('parking') || desc.includes('kid') || desc.includes('family')) score *= 2.0;
          break;
        case 'CORPORATE': 
          if (reviews < 200) score *= 0.2; 
          if (price >= 3) score *= 1.5; 
          break;
      }
      return score;
    } catch (e) { return 0; }
  };

  // --- 3. HYBRID GENERATOR (Supabase -> Google) ---
  const generateItinerary = async () => {
    setIsGenerating(true);
    setShowCreateModal(false);
    
    let currentLoc = { lat: 0, lng: 0 };
    const itinerary: Place[] = [];
    const usedIds: string[] = [];

    try {
      console.log("Generating plan for:", selectedCity);

      // CHANGED: Include zone_id in the search
      const { data: rawPlaces } = await supabase
        .from('places') 
        .select('*')
        .or(`zone_id.ilike.%${selectedCity}%,description.ilike.%${selectedCity}%,name.ilike.%${selectedCity}%`);

      if (rawPlaces && rawPlaces.length > 0) {
          console.log(`Found ${rawPlaces.length} curated places.`);
          currentLoc = { lat: rawPlaces[0].lat, lng: rawPlaces[0].lng };
          
          const scoredPlaces = rawPlaces.map(p => ({ ...p, aiScore: calculateRelevanceScore(p, groupType) }));
          scoredPlaces.sort((a, b) => b.aiScore - a.aiScore);

          const slots = [
            { name: 'Morning', types: ['tourist_attraction', 'religious_place', 'park'] },
            { name: 'Lunch', types: ['restaurant', 'cafe', 'food'] },
            { name: 'Afternoon', types: ['museum', 'art_gallery', 'tourist_attraction'] },
            { name: 'Evening', types: ['shopping_mall', 'point_of_interest', 'park'] },
            { name: 'Dinner', types: ['restaurant', 'bar', 'food'] }
          ];

          for (const slot of slots) {
            const candidates = scoredPlaces.filter(p => 
              !usedIds.includes(p.id) && p.aiScore > 0 && slot.types.some(t => (p.type || '').includes(t))
            );
            if (candidates.length > 0) {
              const winner = candidates[0]; 
              itinerary.push(winner);
              usedIds.push(winner.id);
            }
          }
      } else {
          // GOOGLE FALLBACK
          console.log("No curated data. Switching to Live Google Search...");
          
          if (!placesServiceRef.current) throw new Error("Google Maps not loaded yet");

          const request = {
            query: `Top tourist attractions in ${selectedCity}`,
            fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'types', 'price_level']
          };

          const googleResults = await new Promise<any[]>((resolve) => {
             placesServiceRef.current?.textSearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                   resolve(results);
                } else {
                   resolve([]);
                }
             });
          });

          if (googleResults.length === 0) throw new Error("Google found nothing either.");

          const formatted = googleResults.slice(0, 5).map(p => ({
            id: p.place_id,
            name: p.name,
            lat: p.geometry.location.lat(),
            lng: p.geometry.location.lng(),
            type: p.types?.[0] || 'tourist_attraction',
            rating: p.rating,
            user_ratings_total: p.user_ratings_total,
            price_level: p.price_level,
            types: p.types,
            description: p.formatted_address,
            image: p.photos?.[0]?.getUrl()
          }));

          itinerary.push(...formatted);
      }

      setTripPlan(itinerary);
      setIsGenerating(false);
      setActiveView('PLAN'); 

    } catch (err: any) {
      console.error("AI FAIL:", err);
      alert("Could not generate a plan. Please try manually.");
      setIsGenerating(false);
      setActiveView('DISCOVERY');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const addToTrip = (place: any) => {
    if (!tripPlan.find((p) => p.id === place.id)) setTripPlan((prev) => [...prev, place]);
  };
  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));
  
  const calculateDays = () => {
    if(!dates.start || !dates.end) return 1;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24)) + 1; 
  };

  if (!session) return <LandingPage />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* SIDEBAR */}
      <Sidebar 
        currentView={activeView}
        onChangeView={setActiveView}
        selectedCity={selectedCity}
        tripPlan={tripPlan}
        isTripActive={!!selectedCity}
        totalDays={calculateDays()}
        budget={budget}
        travelers={groupType === 'SOLO' ? 1 : (groupType === 'FRIENDS' ? 4 : 2)}
        diet="ANY"
        groupType={groupType}
        onRemoveItem={removeFromTrip}
        onAddToTrip={addToTrip}
        onResetApp={() => {
           if(confirm("Reset trip?")) { setSelectedCity(''); setTripPlan([]); setActiveView('DASHBOARD'); }
        }}
      />

      <main className="flex-1 relative h-full flex flex-col">
        {/* HEADER */}
        <header className="absolute top-0 right-0 p-6 z-20 flex items-center gap-4">
           <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-gray-100">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
               {session.user.email?.[0].toUpperCase()}
             </div>
             <span className="text-xs font-bold text-gray-600 hidden md:block pr-2">
               {session.user.email}
             </span>
           </div>
           
           <button onClick={handleLogout} className="bg-white text-gray-500 hover:text-red-500 p-2 rounded-full shadow-sm border border-gray-100 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
           </button>
        </header>

        {/* VIEW 1: DASHBOARD */}
        {activeView === 'DASHBOARD' && (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-white relative">
            <h2 className="text-3xl font-black mb-6">Where to next?</h2>
            
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform"
            >
              + Plan a New Trip
            </button>

            {/* MODAL */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg relative">
                   <h3 className="font-bold text-xl text-gray-900 mb-6">Create Your Vibe</h3>
                   
                   {/* DESTINATION + DROPDOWN */}
                   <div className="mb-4 relative">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</label>
                     <input 
                       className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" 
                       placeholder="Search database (e.g. Bang...)" 
                       value={selectedCity} 
                       onChange={(e) => handleCitySearch(e.target.value)}
                       autoComplete="off"
                     />
                     
                     {/* Smart Dropdown */}
                     {showSuggestions && (
                       <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 mt-1 max-h-40 overflow-y-auto">
                         {citySuggestions.map((suggestion, index) => (
                           <div 
                             key={index}
                             onClick={() => selectSuggestion(suggestion)}
                             className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0"
                           >
                             📍 {suggestion}
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Dates */}
                   <div className="flex gap-3 mb-4">
                     <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Start</label>
                        <input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, start: e.target.value})} />
                     </div>
                     <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">End</label>
                        <input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, end: e.target.value})} />
                     </div>
                   </div>

                   {/* GROUP TYPE SELECTOR */}
                   <div className="mb-6">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Who is traveling?</label>
                     <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'SOLO', label: '🧍 Solo', desc: 'Hidden Gems' },
                          { id: 'FRIENDS', label: '👯 Friends', desc: 'Vibes & Fun' },
                          { id: 'FAMILY', label: '👨‍👩‍👧‍👦 Family', desc: 'Safe & Easy' },
                          { id: 'CORPORATE', label: '💼 Corporate', desc: 'Premium' },
                        ].map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setGroupType(type.id)}
                            className={`p-3 rounded-xl border text-left transition-all
                              ${groupType === type.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            <div className="font-bold text-xs text-gray-900">{type.label}</div>
                            <div className="text-[10px] text-gray-500">{type.desc}</div>
                          </button>
                        ))}
                     </div>
                   </div>

                   <button 
                     onClick={generateItinerary}
                     disabled={!selectedCity || isGenerating}
                     className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center"
                   >
                     {isGenerating ? '🔮 AI is Analyzing...' : 'Generate Itinerary ➔'}
                   </button>
                   <button onClick={() => setShowCreateModal(false)} className="w-full mt-2 text-gray-400 text-xs font-bold py-2">Cancel</button>
                 </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: DISCOVERY */}
        {activeView === 'DISCOVERY' && (
           <DiscoveryView onAddToTrip={addToTrip} onBack={() => setActiveView('PLAN')} initialCity={selectedCity} />
        )}

        {/* VIEW 3: PLAN */}
        {activeView === 'PLAN' && (
           <div className="h-full w-full relative">
             <iframe 
               width="100%" height="100%" frameBorder="0" scrolling="no" 
               src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCity || 'India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
               className="grayscale hover:grayscale-0 transition-all duration-700 block"
             ></iframe>
             
             {tripPlan.length === 0 && !isGenerating && (
               <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white px-6 py-4 rounded-2xl shadow-xl text-center">
                 <p className="font-bold text-gray-800 mb-2">No curated plan found for {selectedCity}.</p>
                 <button onClick={() => setActiveView('DISCOVERY')} className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold">+ Add Places Manually</button>
               </div>
             )}
           </div>
        )}

        {(activeView === 'TRIPS' || activeView === 'SETTINGS') && (
           <div className="h-full flex items-center justify-center font-bold text-gray-400">Coming Soon...</div>
        )}
      </main>
    </div>
  );
}