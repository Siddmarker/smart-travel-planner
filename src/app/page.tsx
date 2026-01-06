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
  price_level?: number;
  vibes?: string[];           
  best_time_tags?: string[];  
  capacity_tier?: string;     
  amenities?: string[];       
  aiScore?: number;
  image?: string;
  votes?: number;
  distanceFromLast?: string;
}

// VIBE TAGS
const TRIP_VIBES = [
  { id: 'leisure', label: '🌴 Relaxing', keywords: ['resort', 'park', 'spa', 'lake'] },
  { id: 'foodie', label: '🍕 Food & Nightlife', keywords: ['restaurant', 'cafe', 'late_night', 'pub', 'bar'] },
  { id: 'heritage', label: '🏰 Heritage & Culture', keywords: ['temple', 'museum', 'fort', 'iconic', 'landmark'] },
  { id: 'adventure', label: '🏍️ Biking & Adventure', keywords: ['off_roading', 'amusement_park', 'turf', 'trek'] },
  { id: 'shopping', label: '🛍️ Shopping', keywords: ['mall', 'market', 'shopping'] }
];

// DAILY TEMPLATE
const DAILY_TEMPLATE = [
  { id: 'MORNING', label: '🌞 Morning Exploration', types: ['park', 'nature', 'temple', 'religious', 'landmark', 'museum', 'fort', 'sightseeing', 'off_roading'] },
  { id: 'LUNCH', label: '🍛 Lunch Break', types: ['restaurant', 'cafe', 'food', 'kitchen', 'bistro', 'dining', 'eatery', 'iconic'] },
  { id: 'AFTERNOON', label: '🎨 Afternoon Vibe', types: ['museum', 'gallery', 'mall', 'shopping', 'zoo', 'aquarium', 'hall', 'monument', 'market', 'amusement_park'] },
  { id: 'EVENING', label: '🌆 Evening Chill', types: ['park', 'sunset', 'lake', 'club', 'pub', 'bar', 'theater', 'cinema', 'beach', 'turf'] },
  { id: 'DINNER', label: '🍽️ Dinner Feast', types: ['restaurant', 'food', 'bar', 'grill', 'kitchen', 'dine', 'late_night'] }
];

// MAP STYLES
const mapContainerStyle = { width: '100%', height: '100%' };
const pathOptions = { strokeColor: '#2563EB', strokeOpacity: 0.8, strokeWeight: 4 };

// KEYWORDS
const NON_VEG_KEYWORDS = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'steak', 'seafood', 'fish', 'kebab', 'biryani']; 
const HOTEL_KEYWORDS = ['hotel', 'resort', 'inn', 'stay', 'suites', 'cottage', 'residency', 'lodge', 'grand', 'plaza', 'dorm', 'hostel', 'room', 'living', 'apartment', 'villa', 'bnb'];

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
  const [startCoords, setStartCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // TRIP DATA
  const [selectedCity, setSelectedCity] = useState('');
  const [startLocation, setStartLocation] = useState(''); 
  const [showStartHelp, setShowStartHelp] = useState(false); 
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); 
  const [diet, setDiet] = useState('ANY'); 
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // COLLAB STATE
  const [collabTab, setCollabTab] = useState<'VOTE' | 'CHAT' | 'SPLIT'>('VOTE');
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', user: 'System', text: 'Welcome to the Trip Chat!', time: 'Now', isMe: false }]);
  const [newMessage, setNewMessage] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [votingOptions, setVotingOptions] = useState<Place[]>([]);

  // MAP CENTER
  const mapCenter = useMemo(() => {
    if (tripPlan.length > 0) return { lat: tripPlan[0].lat, lng: tripPlan[0].lng };
    return { lat: 12.9716, lng: 77.5946 };
  }, [tripPlan]);

  // --- NEW: NAVIGATION HANDLER (Fixes the Stuck Wizard Issue) ---
  const handleViewChange = (view: NavView) => {
    setActiveView(view);
    // If going to Dashboard, Force Close Wizard
    if (view === 'DASHBOARD') {
        setIsWizardActive(false);
        setShowCreateModal(false);
    }
  };

  // --- 1. SEARCH & LOCATION ---
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

  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
    setSelectedCity("Locating...");
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (res, status) => {
            if (status === "OK" && res?.[0]) {
                const city = res[0].address_components.find(c => c.types.includes('locality'))?.long_name;
                if (city) { setSelectedCity(city); handleCitySearch(city); }
            } else { alert("Could not detect city."); setSelectedCity(""); }
        });
    }, () => { alert("Permission denied."); setSelectedCity(""); });
  };

  const toggleVibe = (vibeId: string) => {
    if (selectedVibes.includes(vibeId)) {
        setSelectedVibes(selectedVibes.filter(id => id !== vibeId));
    } else {
        setSelectedVibes([...selectedVibes, vibeId]);
    }
  };

  // --- 2. GEOCODE HELPER ---
  const getGeocode = (address: string): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else resolve(null);
      });
    });
  };

  // --- 3. MULTI-DAY WIZARD ---
  const startWizard = async () => {
    let totalDays = 1;
    if (dates.start && dates.end) {
        const start = new Date(dates.start);
        const end = new Date(dates.end);
        totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    }

    const fullItinerarySteps: any[] = []; 
    for (let i = 1; i <= totalDays; i++) {
        DAILY_TEMPLATE.forEach(step => {
            fullItinerarySteps.push({ ...step, day: i, label: `Day ${i}: ${step.label}` });
        });
    }
    setDynamicSteps(fullItinerarySteps);

    // GEOCODE START LOCATION
    let initialCoords = null;
    if (startLocation) {
        initialCoords = await getGeocode(startLocation);
        setStartCoords(initialCoords);
    }

    setIsWizardActive(true);
    setShowCreateModal(false);
    setIsLoadingOptions(true);
    setTripPlan([]); 
    setCurrentStepIndex(0);

    try {
      const { data: rawPlaces } = await supabase.from('places').select('*').or(`city.ilike.%${selectedCity}%,zone_id.ilike.%${selectedCity}%`);
      if (!rawPlaces || rawPlaces.length === 0) { alert("No data found. Try 'Bangalore'."); setIsWizardActive(false); return; }
      setAllCityPlaces(rawPlaces); 
      // Pass initialCoords to generator
      generateOptionsForStep(0, rawPlaces, [], fullItinerarySteps, initialCoords); 
    } catch (err) { console.error(err); setIsWizardActive(false); }
  };

  const generateOptionsForStep = (
      stepIdx: number, 
      allPlaces: Place[], 
      currentTrip: Place[], 
      stepsList = dynamicSteps, 
      initialCoords: {lat: number, lng: number} | null = startCoords
  ) => {
    setIsLoadingOptions(true);
    const stepConfig = stepsList[stepIdx];
    
    // Determine Reference Point
    let referencePoint = null;
    if (currentTrip.length > 0) {
        const last = currentTrip[currentTrip.length - 1];
        referencePoint = { lat: last.lat, lng: last.lng };
    } else if (initialCoords && stepIdx === 0) {
        referencePoint = initialCoords;
    }

    // 1. FILTER CANDIDATES
    let candidates = allPlaces.filter(p => {
        const searchStr = `${p.type} ${p.description} ${p.name} ${p.vibes?.join(' ')}`.toLowerCase();
        let matchesType = stepConfig.types.some((t: string) => searchStr.includes(t));
        if (selectedVibes.length > 0) {
            const vibeKeywords = selectedVibes.flatMap(vid => TRIP_VIBES.find(v => v.id === vid)?.keywords || []);
            if (vibeKeywords.some(k => searchStr.includes(k))) matchesType = true;
        }
        const alreadyPicked = currentTrip.some(picked => picked.id === p.id);
        return matchesType && !alreadyPicked;
    });

    // 2. ANTI-HOTEL
    if (!stepConfig.id.includes('DINNER') && !stepConfig.id.includes('LUNCH')) {
        const isLikelyHotel = (p: Place) => HOTEL_KEYWORDS.some(kw => (p.name + " " + (p.type || "")).toLowerCase().includes(kw));
        const nonHotelCandidates = candidates.filter(p => !isLikelyHotel(p));
        if (nonHotelCandidates.length > 0) candidates = nonHotelCandidates;
    }

    // 3. DIET & BUDGET
    if (diet !== 'ANY') {
        candidates = candidates.filter(p => {
            const text = (p.name + " " + p.description).toLowerCase();
            const isNonVeg = NON_VEG_KEYWORDS.some(kw => text.includes(kw));
            if (diet === 'VEG' || diet === 'VEGAN' || diet === 'JAIN') return !isNonVeg || text.includes('pure veg');
            return true;
        });
    }
    
    candidates = candidates.filter(p => {
        const price = p.price_tier || (p.price_level === 0 ? 'Budget' : p.price_level === 4 ? 'Luxury' : 'Standard');
        if (budget === 'LOW') return price === 'Budget' || (p.price_level !== undefined && p.price_level <= 1);
        if (budget === 'HIGH') return price === 'Luxury' || price === 'Premium' || (p.price_level !== undefined && p.price_level >= 3);
        return true; 
    });

    // 4. FALLBACK
    if (candidates.length < 4) {
        const remainingNeeded = 4 - candidates.length;
        let fallbackCandidates = allPlaces.filter(p => 
            !currentTrip.some(picked => picked.id === p.id) && 
            !candidates.some(c => c.id === p.id)
        );
        if (!stepConfig.id.includes('DINNER') && !stepConfig.id.includes('LUNCH')) {
             fallbackCandidates = fallbackCandidates.filter(p => !HOTEL_KEYWORDS.some(kw => p.name.toLowerCase().includes(kw)));
        }
        if (referencePoint) {
             fallbackCandidates.sort((a, b) => {
                 const distA = Math.sqrt(Math.pow(a.lat - referencePoint!.lat, 2) + Math.pow(a.lng - referencePoint!.lng, 2));
                 const distB = Math.sqrt(Math.pow(b.lat - referencePoint!.lat, 2) + Math.pow(b.lng - referencePoint!.lng, 2));
                 return distA - distB;
             });
        }
        candidates = [...candidates, ...fallbackCandidates.slice(0, remainingNeeded)];
    }

    // 5. SCORE (PROXIMITY + VIBE)
    candidates = candidates.map(p => {
        let score = calculateRelevanceScore(p, groupType);
        let distanceText = "";

        if (referencePoint) {
             const distDeg = Math.sqrt(Math.pow(p.lat - referencePoint.lat, 2) + Math.pow(p.lng - referencePoint.lng, 2));
             const distKm = distDeg * 111;
             distanceText = `${distKm.toFixed(1)} km away`;
             if (distKm < 3) score += 30;
             else if (distKm < 8) score += 15;
             else if (distKm > 20) score -= 20; 
        }

        const text = (p.name + " " + p.description + " " + (p.vibes?.join(' ') || '')).toLowerCase();
        selectedVibes.forEach(vid => {
            const keywords = TRIP_VIBES.find(v => v.id === vid)?.keywords || [];
            if (keywords.some(k => text.includes(k))) score += 25; 
        });

        return { ...p, aiScore: score, distanceFromLast: distanceText };
    });

    candidates.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    setStepOptions(candidates.slice(0, 4)); 
    setIsLoadingOptions(false);
  };

  const handleOptionSelect = (place: Place) => {
    const newTrip = [...tripPlan, place];
    setTripPlan(newTrip);
    const nextStep = currentStepIndex + 1;
    if (nextStep < dynamicSteps.length) {
        setCurrentStepIndex(nextStep);
        generateOptionsForStep(nextStep, allCityPlaces, newTrip, dynamicSteps, startCoords);
    } else {
        setIsWizardActive(false);
        setActiveView('PLAN');
    }
  };

  const calculateRelevanceScore = (place: Place, group: string) => {
    let score = 50;
    const safety = place.safety_score || 5;
    const trend = place.trend_score || 5;
    if (group === 'FRIENDS') { score += trend * 5; }
    if (group === 'FAMILY') { score += safety * 5; }
    if (diet !== 'ANY' && place.description?.toLowerCase().includes(diet.toLowerCase())) score += 30;
    return score;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));
  const calculateDays = () => {
    if(!dates.start || !dates.end) return 1;
    return Math.max(1, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 3600 * 24)) + 1); 
  };

  if (!session) return <LandingPage />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR: NOW USING handleViewChange TO FIX NAVIGATION */}
      <Sidebar 
        currentView={activeView}
        onChangeView={handleViewChange}
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
        <header className="absolute top-0 right-0 p-6 z-20 flex items-center gap-4">
           {tripPlan.length > 0 && <button onClick={() => setActiveView('COLLAB' as any)} className="bg-white text-blue-600 px-4 py-2 rounded-full shadow-sm border border-blue-100 font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors">👥 Invite & Vote</button>}
           <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-gray-100"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">{session.user.email?.[0].toUpperCase()}</div></div>
           <button onClick={handleLogout} className="bg-white text-gray-500 hover:text-red-500 p-2 rounded-full shadow-sm border border-gray-100">Sign Out</button>
        </header>

        {activeView === 'COLLAB' as any && (
          <div className="h-full bg-gray-50 p-8 flex flex-col items-center pt-24">
             <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[75vh]">
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                   <div><h2 className="text-2xl font-black text-gray-900">Travel Party Hub</h2><p className="text-sm text-gray-500">Trip to <b>{selectedCity}</b></p></div>
                   <div className="flex bg-gray-100 p-1 rounded-xl">{(['VOTE', 'CHAT', 'SPLIT'] as const).map(tab => <button key={tab} onClick={() => setCollabTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${collabTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>{tab}</button>)}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                   {collabTab === 'VOTE' && <div className="space-y-4">{tripPlan.map(opt => <div key={opt.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">{opt.image && <img src={opt.image} className="w-full h-full object-cover"/>}</div><div className="flex-1"><h4 className="font-bold text-gray-900">{opt.name}</h4></div><button className="w-8 h-8 rounded-full border hover:bg-green-50 hover:border-green-500 flex items-center justify-center">👍</button></div>)}</div>}
                </div>
             </div>
          </div>
        )}

        {isWizardActive && (
            <div className="absolute inset-0 z-30 bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-6xl">
                    <div className="mb-6"><div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"><span>Planning Day {dynamicSteps[currentStepIndex]?.day}</span><span>Step {currentStepIndex + 1}/{dynamicSteps.length}</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStepIndex+1)/dynamicSteps.length)*100}%` }}></div></div></div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{dynamicSteps[currentStepIndex]?.label}</h2>
                    {isLoadingOptions ? <div className="h-64 flex items-center justify-center font-bold text-gray-400 animate-pulse">Filtering best spots...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stepOptions.map((place) => (
                                <button key={place.id} onClick={() => handleOptionSelect(place)} className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition-all text-left h-72 flex flex-col relative border border-transparent hover:border-blue-500">
                                    <div className="h-32 bg-gray-200 w-full relative">
                                        {place.image ? <img src={place.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-50 to-purple-50">📍</div>}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">⭐ {place.aiScore?.toFixed(0)}%</div>
                                        {place.distanceFromLast && <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">👣 {place.distanceFromLast}</div>}
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

        {activeView === 'DASHBOARD' && !isWizardActive && (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-white relative">
            <h2 className="text-3xl font-black mb-6">Where to next?</h2>
            <button onClick={() => setShowCreateModal(true)} className="bg-black text-white text-lg font-bold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-transform">+ Plan a New Trip</button>
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
                   <h3 className="font-bold text-xl text-gray-900 mb-6">Create Your Vibe</h3>
                   
                   {/* DESTINATION + LIVE LOCATION */}
                   <div className="mb-4 relative">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</label>
                     <div className="flex gap-2">
                        <input className="flex-1 p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold" placeholder="Search City..." value={selectedCity} onChange={(e) => handleCitySearch(e.target.value)} />
                        <button onClick={handleUseLiveLocation} className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100" title="Use My Location">📍</button>
                     </div>
                     {showSuggestions && <div className="absolute top-full w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 mt-1 max-h-40 overflow-y-auto">{citySuggestions.map((s,i)=><div key={i} onClick={()=>selectSuggestion(s)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b border-gray-50">📍 {s}</div>)}</div>}
                   </div>

                   {/* NEW: START LOCATION */}
                   <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                         <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Location</label>
                         <button onClick={() => setShowStartHelp(!showStartHelp)} className="text-[10px] text-blue-500 font-bold hover:underline">Why ask? ❓</button>
                      </div>
                      <input 
                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-xs" 
                        placeholder="e.g. Airport, Hotel, Home..." 
                        value={startLocation}
                        onChange={(e) => setStartLocation(e.target.value)}
                      />
                      {showStartHelp && (
                        <div className="mt-2 bg-blue-50 text-blue-800 text-[10px] p-2 rounded-lg border border-blue-100">
                           💡 We use this to suggest the first activity closest to your arrival point, optimizing your travel route.
                        </div>
                      )}
                   </div>
                   
                   {/* DATES */}
                   <div className="flex gap-3 mb-4">
                     <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Start</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, start: e.target.value})} /></div>
                     <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">End</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, end: e.target.value})} /></div>
                   </div>
                   
                   {/* DIET & BUDGET ROW */}
                   <div className="flex gap-3 mb-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Diet</label>
                            <select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" value={diet} onChange={e => setDiet(e.target.value)}>
                                <option value="ANY">🍽️ Any</option>
                                <option value="VEG">🥦 Vegetarian</option>
                                <option value="VEGAN">🥗 Vegan</option>
                                <option value="JAIN">🌿 Jain</option>
                                <option value="HALAL">🍖 Halal</option>
                                <option value="EGG">🍳 Eggetarian</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Budget</label>
                            <select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" value={budget} onChange={e => setBudget(e.target.value)}>
                                <option value="LOW">💸 Budget</option>
                                <option value="MEDIUM">⚖️ Standard</option>
                                <option value="HIGH">💎 Luxury</option>
                            </select>
                        </div>
                   </div>

                   {/* TRIP VIBE (NEW) */}
                   <div className="mb-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Trip Vibe (Select all that apply)</label>
                      <div className="flex flex-wrap gap-2">
                         {TRIP_VIBES.map((v) => (
                            <button 
                               key={v.id} 
                               onClick={() => toggleVibe(v.id)}
                               className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                                   selectedVibes.includes(v.id) 
                                   ? 'bg-black text-white border-black shadow-md' 
                                   : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                               }`}
                            >
                               {v.label}
                            </button>
                         ))}
                      </div>
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
        {activeView === 'PLAN' && isLoaded && (
           <div className="h-full w-full relative">
             <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={12} options={{ disableDefaultUI: false, zoomControl: true }}>
                <Polyline path={tripPlan.map(p => ({ lat: p.lat, lng: p.lng }))} options={pathOptions} />
                {tripPlan.map((place, index) => (<Marker key={place.id} position={{ lat: place.lat, lng: place.lng }} label={{ text: `${index + 1}`, color: "white", fontWeight: "bold" }} title={place.name} />))}
             </GoogleMap>
           </div>
        )}
      </main>
    </div>
  );
}