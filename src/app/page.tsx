'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript, GoogleMap, Marker, Polyline } from '@react-google-maps/api';

// COMPONENTS
import LandingPage from '@/components/LandingPage';
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';

const LIBRARIES: ("places")[] = ["places"];

// --- INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// TYPES
interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  description?: string; 
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
  image?: string;
  votes?: number; 
}

// DAILY TEMPLATE
const DAILY_TEMPLATE = [
  { id: 'MORNING', label: '🌞 Morning Exploration', types: ['park', 'religious_place', 'tourist_attraction', 'landmark', 'museum'] },
  { id: 'LUNCH', label: '🍛 Lunch Break', types: ['restaurant', 'cafe', 'food'] },
  { id: 'AFTERNOON', label: '🎨 Afternoon Vibe', types: ['museum', 'art_gallery', 'shopping_mall', 'tourist_attraction', 'zoo'] },
  { id: 'EVENING', label: '🌆 Evening Chill', types: ['park', 'night_club', 'bar', 'point_of_interest', 'movie_theater'] },
  { id: 'DINNER', label: '🍽️ Dinner Feast', types: ['restaurant', 'food', 'bar'] }
];

// MAP STYLES
const mapContainerStyle = { width: '100%', height: '100%' };
const pathOptions = { strokeColor: '#2563EB', strokeOpacity: 0.8, strokeWeight: 4 };

// FAKE DATA
interface ChatMessage { id: string; user: string; text: string; time: string; isMe: boolean; }
interface Expense { id: string; who: string; what: string; amount: number; }

export default function Home() {
  const [session, setSession] = useState<any>(null);
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // APP STATE
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // WIZARD STATE
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepOptions, setStepOptions] = useState<Place[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [allCityPlaces, setAllCityPlaces] = useState<Place[]>([]);
  const [dynamicSteps, setDynamicSteps] = useState<any[]>([]);
  
  // TRIP DATA
  const [selectedCity, setSelectedCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); 
  const [diet, setDiet] = useState('ANY'); 
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // COLLAB STATE
  const [collabTab, setCollabTab] = useState<'VOTE' | 'CHAT' | 'SPLIT'>('VOTE');
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', user: 'System', text: 'Welcome to the Trip Chat!', time: 'Now', isMe: false }]);
  const [newMessage, setNewMessage] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [votingOptions, setVotingOptions] = useState<Place[]>([]);

  // MAP CENTER CALCULATION
  const mapCenter = useMemo(() => {
    if (tripPlan.length > 0) return { lat: tripPlan[0].lat, lng: tripPlan[0].lng };
    return { lat: 12.9716, lng: 77.5946 }; // Default Bangalore
  }, [tripPlan]);

  // --- 1. SEARCH ---
  const handleCitySearch = async (query: string) => {
    setSelectedCity(query);
    if (query.length < 2) { setCitySuggestions([]); setShowSuggestions(false); return; }
    try {
      const { data } = await supabase.from('places').select('city, zone_id').or(`city.ilike.%${query}%,zone_id.ilike.%${query}%`).limit(15);
      if (data && data.length > 0) {
        const raw = data.flatMap(p => [p.city, p.zone_id]);
        const unique = Array.from(new Set(raw.filter(s => s && s.length > 1)));
        setCitySuggestions(unique as string[]);
        setShowSuggestions(unique.length > 0);
      } else setShowSuggestions(false);
    } catch (err) { console.warn(err); }
  };
  const selectSuggestion = (name: string) => { setSelectedCity(name); setShowSuggestions(false); };

  // --- 2. MULTI-DAY WIZARD GENERATOR ---
  const startWizard = async () => {
    // A. Calculate Days
    let totalDays = 1;
    if (dates.start && dates.end) {
        const start = new Date(dates.start);
        const end = new Date(dates.end);
        const diff = end.getTime() - start.getTime();
        totalDays = Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)) + 1);
    }

    // B. Build Steps (FIXED LINE BELOW)
    const fullItinerarySteps: any[] = []; 
    for (let i = 1; i <= totalDays; i++) {
        DAILY_TEMPLATE.forEach(step => {
            fullItinerarySteps.push({
                ...step,
                day: i,
                label: `Day ${i}: ${step.label}`
            });
        });
    }
    setDynamicSteps(fullItinerarySteps);

    // C. Init
    setIsWizardActive(true);
    setShowCreateModal(false);
    setIsLoadingOptions(true);
    setTripPlan([]); 
    setCurrentStepIndex(0);

    try {
      console.log("Fetching all places for:", selectedCity);
      const { data: rawPlaces } = await supabase
        .from('places')
        .select('*')
        .or(`city.ilike.%${selectedCity}%,zone_id.ilike.%${selectedCity}%`);

      if (!rawPlaces || rawPlaces.length === 0) {
        alert("No data found. Try 'Bangalore'.");
        setIsWizardActive(false);
        return;
      }

      setAllCityPlaces(rawPlaces); 
      generateOptionsForStep(0, rawPlaces, [], fullItinerarySteps); 
    } catch (err) {
      console.error(err);
      setIsWizardActive(false);
    }
  };

  const generateOptionsForStep = (stepIdx: number, allPlaces: Place[], currentTrip: Place[], stepsList = dynamicSteps) => {
    setIsLoadingOptions(true);
    const stepConfig = stepsList[stepIdx];
    
    // A. Filter (RELAXED)
    let candidates = allPlaces.filter(p => {
        const typeMatch = stepConfig.types.some((t: string) => (p.type || '').toLowerCase().includes(t));
        const descMatch = stepConfig.types.some((t: string) => (p.description || '').toLowerCase().includes(t));
        const alreadyPicked = currentTrip.some(picked => picked.id === p.id);
        return (typeMatch || descMatch) && !alreadyPicked;
    });

    // --- FALLBACK (Ensures 4 options) ---
    if (candidates.length < 4) {
        const remainingNeeded = 4 - candidates.length;
        const fallbackCandidates = allPlaces.filter(p => 
            !currentTrip.some(picked => picked.id === p.id) && 
            !candidates.some(c => c.id === p.id) 
        );
        // Sort by popularity/score to show good stuff like Cubbon Park
        fallbackCandidates.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        candidates = [...candidates, ...fallbackCandidates.slice(0, remainingNeeded)];
    }

    // B. Proximity (If mid-day)
    if (currentTrip.length > 0 && !stepConfig.id.includes('MORNING')) {
        const lastPlace = currentTrip[currentTrip.length - 1];
        candidates = candidates.map(p => {
             const dist = Math.sqrt(Math.pow(p.lat - lastPlace.lat, 2) + Math.pow(p.lng - lastPlace.lng, 2));
             return { ...p, _dist: dist };
        }).sort((a: any, b: any) => a._dist - b._dist).slice(0, 15);
    }

    // C. Score
    candidates = candidates.map(p => ({ ...p, aiScore: calculateRelevanceScore(p, groupType) }))
                           .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    
    setStepOptions(candidates.slice(0, 4)); // Increased to 4
    setIsLoadingOptions(false);
  };

  const handleOptionSelect = (place: Place) => {
    const newTrip = [...tripPlan, place];
    setTripPlan(newTrip);
    
    const nextStep = currentStepIndex + 1;
    if (nextStep < dynamicSteps.length) {
        setCurrentStepIndex(nextStep);
        generateOptionsForStep(nextStep, allCityPlaces, newTrip);
    } else {
        setIsWizardActive(false);
        setActiveView('PLAN');
    }
  };

  const calculateRelevanceScore = (place: Place, group: string) => {
    let score = 50;
    const safety = place.safety_score || 5;
    const trend = place.trend_score || 5;
    const vibeTags = (place.vibes || []).map(v => v.toLowerCase());
    
    if (group === 'FRIENDS') { score += trend * 5; if(vibeTags.includes('social')) score += 20; }
    if (group === 'FAMILY') { score += safety * 5; if(vibeTags.includes('peaceful')) score += 20; }
    if (diet !== 'ANY' && place.description?.toLowerCase().includes(diet.toLowerCase())) score += 30;

    return score;
  };

  // HANDLERS
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));
  const calculateDays = () => {
    if(!dates.start || !dates.end) return 1;
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 3600 * 24)) + 1); 
  };

  if (!session) return <LandingPage />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
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
        diet={diet} groupType={groupType}
        onRemoveItem={removeFromTrip}
        onAddToTrip={() => {}} 
        onResetApp={() => { if(confirm("Reset?")) window.location.reload(); }}
      />

      <main className="flex-1 relative h-full flex flex-col">
        
        {/* HEADER */}
        <header className="absolute top-0 right-0 p-6 z-20 flex items-center gap-4">
           {tripPlan.length > 0 && (
             <button onClick={() => setActiveView('COLLAB' as any)} className="bg-white text-blue-600 px-4 py-2 rounded-full shadow-sm border border-blue-100 font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors">
               👥 Invite & Vote
             </button>
           )}
           <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-gray-100">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
               {session.user.email?.[0].toUpperCase()}
             </div>
           </div>
           <button onClick={handleLogout} className="bg-white text-gray-500 hover:text-red-500 p-2 rounded-full shadow-sm border border-gray-100">Sign Out</button>
        </header>

        {/* --- VIEW: COLLAB HUB --- */}
        {activeView === 'COLLAB' as any && (
          <div className="h-full bg-gray-50 p-8 flex flex-col items-center pt-24">
             <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[75vh]">
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                   <div><h2 className="text-2xl font-black text-gray-900">Travel Party Hub</h2><p className="text-sm text-gray-500">Trip to <b>{selectedCity}</b></p></div>
                   <div className="flex bg-gray-100 p-1 rounded-xl">
                      {(['VOTE', 'CHAT', 'SPLIT'] as const).map(tab => (
                        <button key={tab} onClick={() => setCollabTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${collabTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>{tab}</button>
                      ))}
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                   {collabTab === 'VOTE' && (
                     <div className="space-y-4">
                        {tripPlan.map(opt => (
                           <div key={opt.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">{opt.image && <img src={opt.image} className="w-full h-full object-cover"/>}</div>
                              <div className="flex-1"><h4 className="font-bold text-gray-900">{opt.name}</h4></div>
                              <button className="w-8 h-8 rounded-full border hover:bg-green-50 hover:border-green-500 flex items-center justify-center">👍</button>
                           </div>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- VIEW: SELECTION WIZARD --- */}
        {isWizardActive && (
            <div className="absolute inset-0 z-30 bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-6xl">
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"><span>Planning Day {dynamicSteps[currentStepIndex]?.day}</span><span>Step {currentStepIndex + 1}/{dynamicSteps.length}</span></div>
                        <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStepIndex+1)/dynamicSteps.length)*100}%` }}></div></div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{dynamicSteps[currentStepIndex]?.label}</h2>
                    
                    {isLoadingOptions ? (
                       <div className="h-64 flex items-center justify-center font-bold text-gray-400 animate-pulse">Finding spots...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stepOptions.map((place) => (
                                <button key={place.id} onClick={() => handleOptionSelect(place)} className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition-all text-left h-72 flex flex-col relative border border-transparent hover:border-blue-500">
                                    <div className="h-32 bg-gray-200 w-full relative">
                                        {place.image ? <img src={place.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-50 to-purple-50">📍</div>}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">⭐ {place.aiScore?.toFixed(0)}%</div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-md text-gray-900 mb-1 leading-tight">{place.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2">{place.description || place.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW: DASHBOARD */}
        {activeView === 'DASHBOARD' && !isWizardActive && (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-white relative">
            <h2 className="text-3xl font-black mb-6">Where to next?</h2>
            <button onClick={() => setShowCreateModal(true)} className="bg-black text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform">+ Plan a New Trip</button>
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg relative">
                   <h3 className="font-bold text-xl text-gray-900 mb-6">Create Your Vibe</h3>
                   
                   {/* DESTINATION */}
                   <div className="mb-4 relative">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</label>
                     <input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold" placeholder="Search City..." value={selectedCity} onChange={(e) => handleCitySearch(e.target.value)} />
                     {showSuggestions && <div className="absolute top-full w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 mt-1 max-h-40 overflow-y-auto">{citySuggestions.map((s,i)=><div key={i} onClick={()=>selectSuggestion(s)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b border-gray-50">📍 {s}</div>)}</div>}
                   </div>
                   
                   <div className="flex gap-3 mb-4">
                     <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Start</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, start: e.target.value})} /></div>
                     <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">End</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, end: e.target.value})} /></div>
                   </div>
                   
                   {/* DIET SELECTOR */}
                   <div className="mb-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Food Preference</label>
                      <select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" value={diet} onChange={e => setDiet(e.target.value)}>
                         <option value="ANY">🍽️ Any</option>
                         <option value="VEG">🥦 Vegetarian</option>
                         <option value="VEGAN">🥗 Vegan</option>
                         <option value="HALAL">🍖 Halal</option>
                      </select>
                   </div>

                   <div className="mb-6"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Who is traveling?</label><div className="grid grid-cols-2 gap-2">{[{ id: 'SOLO', label: '🧍 Solo', desc: 'Hidden Gems' }, { id: 'FRIENDS', label: '👯 Friends', desc: 'Vibes & Fun' }, { id: 'FAMILY', label: '👨‍👩‍👧‍👦 Family', desc: 'Safe & Easy' }, { id: 'CORPORATE', label: '💼 Corporate', desc: 'Premium' }].map((t) => <button key={t.id} onClick={() => setGroupType(t.id)} className={`p-3 rounded-xl border text-left transition-all ${groupType === t.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}><div className="font-bold text-xs">{t.label}</div></button>)}</div></div>
                   <button onClick={startWizard} disabled={!selectedCity} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50">Start Customizing ➔</button>
                   <button onClick={() => setShowCreateModal(false)} className="w-full mt-2 text-gray-400 text-xs font-bold py-2">Cancel</button>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'DISCOVERY' && <DiscoveryView onAddToTrip={() => {}} onBack={() => setActiveView('PLAN')} initialCity={selectedCity} />}
        
        {/* VIEW: PLAN (INTERACTIVE MAP) */}
        {activeView === 'PLAN' && isLoaded && (
           <div className="h-full w-full relative">
             <GoogleMap 
               mapContainerStyle={mapContainerStyle} 
               center={mapCenter} 
               zoom={12}
               options={{ disableDefaultUI: false, zoomControl: true }}
             >
                {/* ROUTE LINE */}
                <Polyline path={tripPlan.map(p => ({ lat: p.lat, lng: p.lng }))} options={pathOptions} />

                {/* MARKERS */}
                {tripPlan.map((place, index) => (
                  <Marker 
                    key={place.id}
                    position={{ lat: place.lat, lng: place.lng }}
                    label={{ text: `${index + 1}`, color: "white", fontWeight: "bold" }}
                    title={place.name}
                  />
                ))}
             </GoogleMap>
           </div>
        )}

        {(activeView === 'TRIPS' || activeView === 'SETTINGS') && <div className="h-full flex items-center justify-center font-bold text-gray-400">Coming Soon...</div>}
      </main>
    </div>
  );
}