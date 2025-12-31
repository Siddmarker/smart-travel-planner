'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// COMPONENTS
import LandingPage from '@/components/LandingPage';
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';

// TYPES
interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
}

export default function Home() {
  // --- AUTH SETUP ---
  const [session, setSession] = useState<any>(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- APP STATE ---
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- TRIP DATA ---
  const [selectedCity, setSelectedCity] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM');
  const [travelers, setTravelers] = useState(2);
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // --- HANDLERS ---
  const handleCreateTrip = (city: string, start: string, end: string, budgetLvl: string, ppl: number) => {
    setSelectedCity(city);
    setDates({ start, end });
    setBudget(budgetLvl);
    setTravelers(ppl);
    setShowCreateModal(false);
    
    // RESTORED: Go to 'PLAN' (Map View) instead of forcing 'DISCOVERY'
    setActiveView('PLAN'); 
  };

  const addToTrip = (place: any) => {
    if (!tripPlan.find((p) => p.id === place.id)) {
      setTripPlan([...tripPlan, place]);
      alert(`✅ Added ${place.name} to your trip!`);
    } else {
      alert(`⚠️ ${place.name} is already in your trip.`);
    }
  };

  const removeFromTrip = (id: string) => {
    setTripPlan(tripPlan.filter((p) => p.id !== id));
  };

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
      
      {/* SIDEBAR (Itinerary & Nav) */}
      <Sidebar 
        currentView={activeView}
        onChangeView={setActiveView}
        selectedCity={selectedCity}
        tripPlan={tripPlan}
        isTripActive={!!selectedCity}
        totalDays={calculateDays()}
        diet="ANY" 
        budget={budget}
        travelers={travelers}
        groupType="Friends"
        onRemoveItem={removeFromTrip}
        onAddToTrip={addToTrip}
        onResetApp={() => {
           if(confirm("End this trip and start over?")) {
             setSelectedCity('');
             setTripPlan([]);
             setActiveView('DASHBOARD');
           }
        }}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative h-full">
        
        {/* 1. DASHBOARD */}
        {activeView === 'DASHBOARD' && (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
            <h2 className="text-3xl font-black mb-6">Where to next?</h2>
            {!showCreateModal ? (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-black text-white text-lg font-bold px-8 py-4 rounded-2xl hover:scale-105 transition-transform shadow-xl"
              >
                + Plan a New Trip
              </button>
            ) : (
               /* WIZARD FORM */
               <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm w-full max-w-md animate-fade-in-up">
                 <h3 className="font-bold mb-4 text-gray-800">Trip Details</h3>
                 <div className="mb-3">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destination</label>
                   <input 
                     className="w-full mt-1 p-3 rounded-xl border font-bold text-sm" 
                     placeholder="City (e.g. Madurai)" 
                     value={selectedCity}
                     onChange={(e) => setSelectedCity(e.target.value)}
                   />
                 </div>
                 <div className="flex gap-2 mb-3">
                   <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start</label>
                      <input type="date" className="w-full mt-1 p-3 rounded-xl border text-xs font-bold" onChange={e => setDates({...dates, start: e.target.value})} />
                   </div>
                   <div className="flex-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End</label>
                      <input type="date" className="w-full mt-1 p-3 rounded-xl border text-xs font-bold" onChange={e => setDates({...dates, end: e.target.value})} />
                   </div>
                 </div>
                 <div className="mb-4">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Budget</label>
                   <select className="w-full mt-1 p-3 rounded-xl border text-sm font-bold" onChange={e => setBudget(e.target.value)}>
                      <option value="MEDIUM">💰 Moderate</option>
                      <option value="LOW">💸 Budget Friendly</option>
                      <option value="HIGH">💎 Luxury</option>
                   </select>
                 </div>
                 <button 
                   onClick={() => handleCreateTrip(selectedCity, dates.start, dates.end, budget, travelers)}
                   disabled={!selectedCity}
                   className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                 >
                   Start Planning ➔
                 </button>
                 <button onClick={() => setShowCreateModal(false)} className="w-full mt-2 text-gray-400 text-xs font-bold py-2">Cancel</button>
               </div>
            )}
          </div>
        )}

        {/* 2. DISCOVERY (Separate Tab) */}
        {activeView === 'DISCOVERY' && (
           <DiscoveryView 
             onAddToTrip={addToTrip} 
             onBack={() => setActiveView('PLAN')}
             initialCity={selectedCity} // Keeps the auto-search if you DO go here
           />
        )}

        {/* 3. PLAN / MAP (Default after creating trip) */}
        {activeView === 'PLAN' && (
           <div className="h-full w-full relative">
             <iframe 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               scrolling="no" 
               // Shows map of selected city
               src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCity || 'India')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
               className="grayscale hover:grayscale-0 transition-all duration-700 block"
             ></iframe>

             {/* Optional: Prompt to add places if trip is empty */}
             {tripPlan.length === 0 && (
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur px-6 py-4 rounded-2xl shadow-xl text-center">
                 <p className="font-bold text-gray-700 mb-2">Your itinerary is empty!</p>
                 <button 
                   onClick={() => setActiveView('DISCOVERY')}
                   className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold"
                 >
                   + Add Places from Discovery
                 </button>
               </div>
             )}
           </div>
        )}

        {(activeView === 'TRIPS' || activeView === 'SETTINGS') && (
           <div className="h-full flex items-center justify-center font-bold text-gray-400">
             Coming Soon...
           </div>
        )}

      </main>
    </div>
  );
}