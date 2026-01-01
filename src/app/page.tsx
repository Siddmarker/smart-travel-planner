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
  votes?: number; // New for voting
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface Expense {
  id: string;
  who: string;
  what: string;
  amount: number;
}

const TRIP_STEPS = [
  { id: 'MORNING', label: '🌞 Morning Activity', types: ['park', 'religious_place', 'tourist_attraction', 'point_of_interest'] },
  { id: 'LUNCH', label: '🍛 Lunch Spot', types: ['restaurant', 'cafe', 'food'] },
  { id: 'AFTERNOON', label: '🎨 Afternoon Vibe', types: ['museum', 'art_gallery', 'shopping_mall', 'tourist_attraction'] },
  { id: 'EVENING', label: '🌆 Evening Chill', types: ['park', 'night_club', 'bar', 'point_of_interest'] },
  { id: 'DINNER', label: '🍽️ Dinner', types: ['restaurant', 'food', 'bar'] }
];

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

  // APP STATE
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // WIZARD STATE
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepOptions, setStepOptions] = useState<Place[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  
  // TRIP DATA
  const [selectedCity, setSelectedCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); 
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // --- NEW: COLLAB HUB STATE ---
  const [collabTab, setCollabTab] = useState<'VOTE' | 'CHAT' | 'SPLIT'>('VOTE');
  
  // Fake Chat Data
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Alice', text: 'Hey guys! So excited for Bangalore! 🇮🇳', time: '10:00 AM', isMe: false },
    { id: '2', user: 'Bob', text: 'I really want to try the Idli places.', time: '10:05 AM', isMe: false },
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Fake Expenses
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: '1', who: 'Alice', what: 'Flight Booking', amount: 15000 },
    { id: '2', who: 'Bob', what: 'Airbnb Advance', amount: 5000 },
  ]);

  // Fake Voting Data
  const [votingOptions, setVotingOptions] = useState<Place[]>([]);

  // --- SEARCH ---
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

  // --- WIZARD LOGIC ---
  const startWizard = async () => {
    setIsWizardActive(true);
    setShowCreateModal(false);
    setIsLoadingOptions(true);
    setTripPlan([]); 
    setCurrentStepIndex(0);
    try {
      const { data: rawPlaces } = await supabase.from('places').select('*').or(`city.ilike.%${selectedCity}%,zone_id.ilike.%${selectedCity}%`);
      if (!rawPlaces || rawPlaces.length === 0) { alert("No data found."); setIsWizardActive(false); return; }
      generateOptionsForStep(0, rawPlaces, []); 
    } catch (err) { console.error(err); setIsWizardActive(false); }
  };

  const generateOptionsForStep = (stepIdx: number, allPlaces: Place[], currentTrip: Place[]) => {
    setIsLoadingOptions(true);
    const stepConfig = TRIP_STEPS[stepIdx];
    let candidates = allPlaces.filter(p => {
        const hasRightType = stepConfig.types.some(t => (p.type || '').toLowerCase().includes(t));
        return hasRightType && !currentTrip.some(picked => picked.id === p.id);
    });

    if (currentTrip.length > 0) {
        const lastPlace = currentTrip[currentTrip.length - 1];
        candidates = candidates.map(p => {
             const dist = Math.sqrt(Math.pow(p.lat - lastPlace.lat, 2) + Math.pow(p.lng - lastPlace.lng, 2));
             return { ...p, _dist: dist };
        }).sort((a: any, b: any) => a._dist - b._dist).slice(0, 15);
    }

    candidates = candidates.map(p => ({ ...p, aiScore: calculateRelevanceScore(p, groupType) })).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    setStepOptions(candidates.slice(0, 3));
    
    // --- NEW: For "Voting" demo, we just copy these options to the voting state ---
    if(stepIdx === 0) setVotingOptions(candidates.slice(0, 3).map(p => ({...p, votes: Math.floor(Math.random() * 3)}))); 
    
    setIsLoadingOptions(false);
  };

  const handleOptionSelect = (place: Place) => {
    const newTrip = [...tripPlan, place];
    setTripPlan(newTrip);
    const nextStep = currentStepIndex + 1;
    if (nextStep < TRIP_STEPS.length) {
        setCurrentStepIndex(nextStep);
        // In real app, we would re-fetch options here
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
    if (place.description) score += 5;
    return score;
  };

  // --- COLLAB HANDLERS ---
  const handleSendMessage = () => {
    if(!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), user: 'You', text: newMessage, time: 'Just now', isMe: true }]);
    setNewMessage('');
  };

  const handleVote = (id: string) => {
    setVotingOptions(votingOptions.map(p => p.id === id ? { ...p, votes: (p.votes || 0) + 1 } : p));
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

        {/* --- VIEW: COLLAB HUB (NEW) --- */}
        {activeView === 'COLLAB' as any && (
          <div className="h-full bg-gray-50 p-8 flex flex-col items-center">
             <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
                
                {/* Hub Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
                   <div>
                     <h2 className="text-2xl font-black text-gray-900">Travel Party Hub</h2>
                     <p className="text-sm text-gray-500">Planning: <b>{selectedCity || 'Your Trip'}</b></p>
                   </div>
                   <div className="flex bg-gray-100 p-1 rounded-xl">
                      {(['VOTE', 'CHAT', 'SPLIT'] as const).map(tab => (
                        <button 
                          key={tab}
                          onClick={() => setCollabTab(tab)}
                          className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${collabTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          {tab === 'VOTE' && '🗳️ Voting'}
                          {tab === 'CHAT' && '💬 Group Chat'}
                          {tab === 'SPLIT' && '💸 Splitwise'}
                        </button>
                      ))}
                   </div>
                </div>

                {/* TAB CONTENT */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                   
                   {/* 1. VOTING TAB */}
                   {collabTab === 'VOTE' && (
                     <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                           <p className="text-sm text-blue-800 font-bold">Invite friends to vote!</p>
                           <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold">🔗 Copy Link</button>
                        </div>

                        <h3 className="font-bold text-gray-900">Voting: Morning Activity</h3>
                        <div className="grid gap-4">
                           {votingOptions.length === 0 ? (
                             <div className="text-center text-gray-400 py-10">Start the wizard to generate options first!</div>
                           ) : votingOptions.map(option => (
                             <div key={option.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                   {option.image ? <img src={option.image} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-gray-300"/>}
                                </div>
                                <div className="flex-1">
                                   <h4 className="font-bold text-gray-900">{option.name}</h4>
                                   <p className="text-xs text-gray-500 line-clamp-1">{option.description}</p>
                                   
                                   {/* Vote Bar */}
                                   <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-green-500" style={{ width: `${((option.votes || 0) / 5) * 100}%` }}></div>
                                   </div>
                                   <p className="text-[10px] text-gray-400 mt-1">{option.votes} votes</p>
                                </div>
                                <button onClick={() => handleVote(option.id)} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-500 transition-all">
                                   👍
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                   {/* 2. CHAT TAB */}
                   {collabTab === 'CHAT' && (
                     <div className="flex flex-col h-full">
                        <div className="flex-1 space-y-4 mb-4">
                           {messages.map(msg => (
                             <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none shadow-sm'}`}>
                                   {!msg.isMe && <p className="text-[10px] font-bold opacity-50 mb-1">{msg.user}</p>}
                                   {msg.text}
                                   <p className={`text-[9px] mt-1 ${msg.isMe ? 'text-blue-200' : 'text-gray-400'}`}>{msg.time}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-gray-200 flex gap-2">
                           <input 
                             className="flex-1 bg-transparent p-2 text-sm focus:outline-none" 
                             placeholder="Type a message..."
                             value={newMessage}
                             onChange={e => setNewMessage(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                           />
                           <button onClick={handleSendMessage} className="bg-black text-white px-4 rounded-lg font-bold text-xs">Send</button>
                        </div>
                     </div>
                   )}

                   {/* 3. SPLITWISE TAB */}
                   {collabTab === 'SPLIT' && (
                     <div>
                        <div className="bg-green-50 p-6 rounded-2xl mb-6 text-center">
                           <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Total Trip Cost</p>
                           <h3 className="text-4xl font-black text-gray-900">₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</h3>
                           <p className="text-xs text-gray-500 mt-2">You owe <b>₹2,500</b> to Bob</p>
                        </div>

                        <h4 className="font-bold text-gray-900 mb-4">Recent Expenses</h4>
                        <div className="space-y-3">
                           {expenses.map(expense => (
                             <div key={expense.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-xs">
                                      {expense.who[0]}
                                   </div>
                                   <div>
                                      <p className="font-bold text-gray-900 text-sm">{expense.what}</p>
                                      <p className="text-xs text-gray-500">paid by {expense.who}</p>
                                   </div>
                                </div>
                                <span className="font-mono font-bold text-gray-900">₹{expense.amount.toLocaleString()}</span>
                             </div>
                           ))}
                        </div>
                        
                        <button className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:scale-[1.02] transition-transform">
                           + Add Expense
                        </button>
                     </div>
                   )}

                </div>
             </div>
          </div>
        )}

        {/* VIEW: SELECTION WIZARD */}
        {isWizardActive && (
            <div className="absolute inset-0 z-30 bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-4xl">
                    <div className="mb-8">
                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"><span>Building...</span><span>Step {currentStepIndex + 1}/{TRIP_STEPS.length}</span></div>
                        <div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStepIndex+1)/TRIP_STEPS.length)*100}%` }}></div></div>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-2">{TRIP_STEPS[currentStepIndex].label}</h2>
                    {isLoadingOptions ? <div className="h-64 flex items-center justify-center font-bold text-gray-400 animate-pulse">Finding spots...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {stepOptions.map((place) => (
                                <button key={place.id} onClick={() => handleOptionSelect(place)} className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition-all text-left h-80 flex flex-col">
                                    <div className="h-40 bg-gray-200 w-full relative">
                                        {place.image ? <img src={place.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl bg-blue-50">📍</div>}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-blue-600">{place.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">{place.description}</p>
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