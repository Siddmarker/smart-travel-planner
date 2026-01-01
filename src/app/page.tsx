'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript } from '@react-google-maps/api';

// COMPONENTS
import LandingPage from '@/components/LandingPage';
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';

const LIBRARIES: ("places")[] = ["places"];

// --- FIX 1: INITIALIZE SUPABASE OUTSIDE THE COMPONENT ---
// This prevents the "Multiple GoTrueClient" warning and freezing
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
  votes?: number; // For Voting Feature
}

// WIZARD CONFIG
const TRIP_STEPS = [
  { id: 'MORNING', label: '🌞 Morning Activity', types: ['park', 'religious_place', 'tourist_attraction', 'museum'] },
  { id: 'LUNCH', label: '🍛 Lunch Spot', types: ['restaurant', 'cafe', 'food'] },
  { id: 'AFTERNOON', label: '🎨 Afternoon Vibe', types: ['museum', 'art_gallery', 'shopping_mall', 'tourist_attraction'] },
  { id: 'EVENING', label: '🌆 Evening Chill', types: ['park', 'night_club', 'bar', 'point_of_interest'] },
  { id: 'DINNER', label: '🍽️ Dinner', types: ['restaurant', 'food', 'bar'] }
];

// FAKE CHAT DATA
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
  
  // TRIP DATA
  const [selectedCity, setSelectedCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); 
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // COLLAB STATE
  const [collabTab, setCollabTab] = useState<'VOTE' | 'CHAT' | 'SPLIT'>('VOTE');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Alice', text: 'Where are we going for lunch?', time: '10:00 AM', isMe: false }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', who: 'Alice', what: 'Flights', amount: 12000 }
  ]);
  const [votingOptions, setVotingOptions] = useState<Place[]>([]);


  // --- 1. SEARCH ---
  const handleCitySearch = async (query: string) => {
    setSelectedCity(query);
    if (query.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }
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

  // --- 2. WIZARD LOGIC (Fixed) ---
  const startWizard = async () => {
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
      // Generate first step
      generateOptionsForStep(0, rawPlaces, []); 
    } catch (err) {
      console.error(err);
      setIsWizardActive(false);
    }
  };

  const generateOptionsForStep = (stepIdx: number, allPlaces: Place[], currentTrip: Place[]) => {
    setIsLoadingOptions(true);
    const stepConfig = TRIP_STEPS[stepIdx];
    
    // A. Filter candidates
    let candidates = allPlaces.filter(p => {
        // Relaxed Filter: Check if Type matches OR if description matches tags
        const typeMatch = stepConfig.types.some(t => (p.type || '').toLowerCase().includes(t));
        const descMatch = stepConfig.types.some(t => (p.description || '').toLowerCase().includes(t));
        const alreadyPicked = currentTrip.some(picked => picked.id === p.id);
        
        return (typeMatch || descMatch) && !alreadyPicked;
    });

    // --- FIX 2: FALLBACK IF 0 RESULTS ---
    // If strict filtering failed, just grab ANY top rated place not yet picked
    if (candidates.length === 0) {
        console.warn(`No strict matches for ${stepConfig.label}, using generic fallback.`);
        candidates = allPlaces.filter(p => !currentTrip.some(picked => picked.id === p.id));
    }

    // B. Proximity Logic (If mid-trip)
    if (currentTrip.length > 0) {
        const lastPlace = currentTrip[currentTrip.length - 1];
        candidates = candidates.map(p => {
             const dist = Math.sqrt(Math.pow(p.lat - lastPlace.lat, 2) + Math.pow(p.lng - lastPlace.lng, 2));
             return { ...p, _dist: dist };
        }).sort((a: any, b: any) => a._dist - b._dist).slice(0, 15);
    }

    // C. Score & Pick Top 3
    candidates = candidates.map(p => ({ ...p, aiScore: calculateRelevanceScore(p, groupType) }))
                           .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    
    const finalOptions = candidates.slice(0, 3);
    setStepOptions(finalOptions);
    
    // Auto-populate voting options for the demo
    if (votingOptions.length === 0 && finalOptions.length > 0) {
        setVotingOptions(finalOptions.map(p => ({...p, votes: Math.floor(Math.random() * 3)})));
    }

    setIsLoadingOptions(false);
  };

  const handleOptionSelect = (place: Place) => {
    const newTrip = [...tripPlan, place];
    setTripPlan(newTrip);
    
    const nextStep = currentStepIndex + 1;
    if (nextStep < TRIP_STEPS.length) {
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
    return score;
  };

  // --- COLLAB LOGIC ---
  const handleSendMessage = () => {
    if(!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), user: 'You', text: newMessage, time: 'Now', isMe: true }]);
    setNewMessage('');
  };

  const handleVote = (id: string) => {
    setVotingOptions(prev => prev.map(p => p.id === id ? { ...p, votes: (p.votes || 0) + 1 } : p));
  };

  // HANDLERS
  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));
  const calculateDays = () => {
    if(!dates.start || !dates.end) return 1;
    return Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 3600 * 24)) + 1; 
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
        diet="ANY" groupType={groupType}
        onRemoveItem={removeFromTrip}
        onAddToTrip={() => {}} 
        onResetApp={() => { if(confirm("Reset?")) window.location.reload(); }}
      />

      <main className="flex-1 relative h-full flex flex-col">
        
        {/* HEADER */}
        <header className="absolute top-0 right-0 p-6 z-20 flex items-center gap-4">
           {/* COLLAB BUTTON */}
           <button 
             onClick={() => setActiveView('COLLAB' as any)}
             className="bg-white text-blue-600 px-4 py-2 rounded-full shadow-sm border border-blue-100 font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors"
           >
             👥 Invite & Vote
           </button>

           <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-gray-100">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
               {session.user.email?.[0].toUpperCase()}
             </div>
           </div>
           <button onClick={handleLogout} className="bg-white text-gray-500 hover:text-red-500 p-2 rounded-full shadow-sm border border-gray-100">Sign Out</button>
        </header>

        {/* --- VIEW: COLLAB HUB (Vote/Chat/Split) --- */}
        {activeView === 'COLLAB' as any && (
          <div className="h-full bg-gray-50 p-8 flex flex-col items-center pt-24">
             <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[75vh]">
                
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                   <div>
                     <h2 className="text-2xl font-black text-gray-900">Travel Party Hub</h2>
                     <p className="text-sm text-gray-500">Trip to <b>{selectedCity || 'Bangalore'}</b></p>
                   </div>
                   <div className="flex bg-gray-100 p-1 rounded-xl">
                      {(['VOTE', 'CHAT', 'SPLIT'] as const).map(tab => (
                        <button key={tab} onClick={() => setCollabTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${collabTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
                          {tab === 'VOTE' && '🗳️ Voting'}
                          {tab === 'CHAT' && '💬 Chat'}
                          {tab === 'SPLIT' && '💸 Split'}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                   {/* VOTING */}
                   {collabTab === 'VOTE' && (
                     <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm font-bold flex justify-between">
                           <span>Vote on which places to visit!</span>
                           <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Invite Friends</button>
                        </div>
                        {votingOptions.length === 0 ? <p className="text-center text-gray-400 mt-10">Start the Trip Wizard to generate options to vote on!</p> : votingOptions.map(opt => (
                           <div key={opt.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                {opt.image && <img src={opt.image} className="w-full h-full object-cover"/>}
                              </div>
                              <div className="flex-1">
                                 <h4 className="font-bold text-gray-900">{opt.name}</h4>
                                 <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2"><div className="bg-green-500 h-1.5 rounded-full transition-all" style={{width: `${(opt.votes||0)*20}%`}}></div></div>
                              </div>
                              <button onClick={() => handleVote(opt.id)} className="w-8 h-8 rounded-full border hover:bg-green-50 hover:border-green-500 flex items-center justify-center">👍</button>
                              <span className="text-xs font-bold w-4">{opt.votes}</span>
                           </div>
                        ))}
                     </div>
                   )}

                   {/* CHAT */}
                   {collabTab === 'CHAT' && (
                     <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-3 mb-4">
                           {messages.map(m => (
                              <div key={m.id} className={`flex ${m.isMe?'justify-end':'justify-start'}`}>
                                 <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.isMe?'bg-blue-600 text-white rounded-br-none':'bg-white shadow-sm rounded-bl-none'}`}>
                                    <p className="opacity-80 text-[10px] font-bold mb-1">{m.user}</p>
                                    {m.text}
                                 </div>
                              </div>
                           ))}
                        </div>
                        <div className="flex gap-2"><input className="flex-1 p-2 rounded-lg border text-sm" placeholder="Message..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMessage()}/><button onClick={handleSendMessage} className="bg-black text-white px-4 rounded-lg text-xs font-bold">Send</button></div>
                     </div>
                   )}

                   {/* SPLIT */}
                   {collabTab === 'SPLIT' && (
                      <div>
                         <div className="bg-green-100 p-6 rounded-2xl mb-6 text-center">
                            <h3 className="text-3xl font-black text-green-900">₹{expenses.reduce((a,b)=>a+b.amount,0).toLocaleString()}</h3>
                            <p className="text-xs font-bold text-green-700 uppercase">Total Trip Cost</p>
                         </div>
                         <div className="space-y-2">
                            {expenses.map(e => (
                               <div key={e.id} className="bg-white p-3 rounded-xl shadow-sm flex justify-between">
                                  <span className="text-sm font-bold">{e.what} <span className="text-gray-400 font-normal">by {e.who}</span></span>
                                  <span className="font-mono font-bold">₹{e.amount}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* --- VIEW: SELECTION WIZARD --- */}
        {isWizardActive && (
            <div className="absolute inset-0 z-30 bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-5xl">
                    <div className="mb-6">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"><span>Planning {selectedCity}</span><span>Step {currentStepIndex + 1}/{TRIP_STEPS.length}</span></div>
                        <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStepIndex+1)/TRIP_STEPS.length)*100}%` }}></div></div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{TRIP_STEPS[currentStepIndex].label}</h2>
                    
                    {isLoadingOptions ? (
                       <div className="h-64 flex items-center justify-center font-bold text-gray-400 animate-pulse">Finding best spots matching your vibe...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stepOptions.map((place) => (
                                <button key={place.id} onClick={() => handleOptionSelect(place)} className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition-all text-left h-72 flex flex-col relative border border-transparent hover:border-blue-500">
                                    <div className="h-32 bg-gray-200 w-full relative">
                                        {place.image ? <img src={place.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-50 to-purple-50">📍</div>}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">⭐ {place.aiScore?.toFixed(0)}% Match</div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-gray-900 mb-1 leading-tight">{place.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">{place.description || place.type}</p>
                                        <div className="mt-auto flex gap-1 flex-wrap">
                                           {place.vibes?.slice(0,2).map((v,i) => <span key={i} className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded uppercase font-bold text-gray-600">{v}</span>)}
                                        </div>
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
                   <div className="mb-4 relative">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</label>
                     <input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold" placeholder="Search Area or City..." value={selectedCity} onChange={(e) => handleCitySearch(e.target.value)} />
                     {showSuggestions && <div className="absolute top-full w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 mt-1 max-h-40 overflow-y-auto">{citySuggestions.map((s,i)=><div key={i} onClick={()=>selectSuggestion(s)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b border-gray-50">📍 {s}</div>)}</div>}
                   </div>
                   <div className="flex gap-3 mb-4">
                     <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Start</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, start: e.target.value})} /></div>
                     <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">End</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, end: e.target.value})} /></div>
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
        {activeView === 'PLAN' && <div className="h-full w-full relative"><iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCity || 'India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`} className="grayscale hover:grayscale-0 transition-all duration-700 block"></iframe></div>}
      </main>
    </div>
  );
}