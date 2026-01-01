'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript } from '@react-google-maps/api';

// COMPONENTS
import LandingPage from '@/components/LandingPage';
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';

const LIBRARIES: ("places")[] = ["places"];

// 1. INTERFACE (Matches your Supabase Structure)
interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  description?: string; 
  
  // Custom Columns
  zone_id?: string;
  city?: string;
  safety_score?: number;      
  trend_score?: number;       
  authenticity_score?: number;
  price_tier?: string;        
  vibes?: string[];           
  best_time_tags?: string[];  
  capacity_tier?: string;     
  amenities?: string[];       
  
  aiScore?: number;
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

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

  // --- 1. STRICT "AREA & CITY" SEARCH (No Venues) ---
  const handleCitySearch = async (query: string) => {
    setSelectedCity(query);
    
    if (query.length < 2) { // Allow searching with 2 letters
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // FIX: ONLY select city and zone_id. Do NOT select 'name'.
      const { data, error } = await supabase
        .from('places')
        .select('city, zone_id') // <--- This filters out venue names
        .or(`city.ilike.%${query}%,zone_id.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        // Collect matches from City and Zone columns only
        const raw = data.flatMap(p => [p.city, p.zone_id]);
        
        // Remove nulls, duplicates, and empty strings
        const unique = Array.from(new Set(
          raw.filter(s => s && typeof s === 'string' && s.length > 1)
        ));
        
        setCitySuggestions(unique as string[]);
        setShowSuggestions(unique.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } catch (err) {
      console.warn("Search warning:", err);
    }
  };

  const selectSuggestion = (name: string) => {
    setSelectedCity(name);
    setShowSuggestions(false);
  };

  // --- 2. ALGORITHM (Using Your DB Columns) ---
  const calculateRelevanceScore = (place: Place, group: string) => {
    try {
      let score = 50; 

      // Data extraction with defaults
      const safety = place.safety_score || 5;
      const trend = place.trend_score || 5;
      const authentic = place.authenticity_score || 5;
      const vibeTags = (place.vibes || []).map(v => v.toLowerCase());
      
      switch (group) {
        case 'SOLO': 
          score += authentic * 3; // Prioritize Authenticity
          if (vibeTags.includes('peaceful') || vibeTags.includes('cultural')) score += 20;
          break;

        case 'FRIENDS': 
          score += trend * 3; // Prioritize Trend
          if (vibeTags.includes('nightlife') || vibeTags.includes('party')) score += 20;
          break;

        case 'FAMILY': 
          score += safety * 4; // Prioritize Safety
          if (safety < 7) score -= 50; 
          break;

        case 'CORPORATE': 
          if (place.capacity_tier === 'High') score += 20;
          if (place.price_tier === 'Luxury') score += 15;
          break;
      }

      if (place.description && place.description.length > 10) score += 5;
      return Math.max(1, score);
    } catch (e) { return 10; } 
  };

  // --- 3. ITINERARY GENERATOR ---
  const generateItinerary = async () => {
    setIsGenerating(true);
    setShowCreateModal(false);
    
    let itinerary: Place[] = [];
    const usedIds: string[] = [];

    try {
      console.log("Fetching plan for:", selectedCity);

      // Search matches in City OR Zone_id (Broad search based on user selection)
      const { data: rawPlaces } = await supabase
        .from('places') 
        .select('*')
        .or(`city.ilike.%${selectedCity}%,zone_id.ilike.%${selectedCity}%`);

      if (!rawPlaces || rawPlaces.length === 0) {
          alert(`No places found for "${selectedCity}".`);
          setIsGenerating(false);
          return;
      }

      // Score
      const scoredPlaces = rawPlaces.map(p => ({ 
        ...p, 
        aiScore: calculateRelevanceScore(p, groupType) 
      }));
      scoredPlaces.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));

      // Select Top 5 Unique
      for (const place of scoredPlaces) {
         if (!usedIds.includes(place.id)) {
            itinerary.push(place);
            usedIds.push(place.id);
         }
         if (itinerary.length >= 5) break;
      }

      setTripPlan(itinerary);
      setIsGenerating(false);
      setActiveView('PLAN'); 

    } catch (err: any) {
      console.error("Generator Error:", err);
      alert("Error generating plan.");
      setIsGenerating(false);
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
                       placeholder="Search Area or City (e.g. Indiranagar)" 
                       value={selectedCity} 
                       onChange={(e) => handleCitySearch(e.target.value)}
                       autoComplete="off"
                     />
                     
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