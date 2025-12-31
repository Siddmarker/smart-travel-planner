'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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
  rating?: number;
  user_ratings_total?: number;
  price_level?: number; // 0=Free, 1=Cheap, 2=Moderate, 3=Expensive, 4=Very Expensive
  types?: string[];     // e.g. ['bar', 'restaurant']
  description?: string; // keywords like "authentic", "lively"
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  // APP STATE
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // TRIP DATA
  const [selectedCity, setSelectedCity] = useState('');
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); // Default: The Vibe Chasers
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // --- THE "PERSONA ENGINE" ALGORITHM ---
  const calculateRelevanceScore = (place: Place, group: string) => {
    let score = 0;

    // 1. DATA NORMALIZATION
    const rating = place.rating || 3.0;
    const reviews = place.user_ratings_total || 10;
    const price = place.price_level || 2; // Default to Moderate if unknown
    const tags = (place.types || []).join(' ').toLowerCase();
    const desc = (place.description || '').toLowerCase();

    // 2. VALUE VELOCITY FORMULA: (Rating x Log(Reviews)) / Price
    // We use Math.log10(reviews) to dampen the effect of having 10,000 reviews vs 1,000
    const confidence = Math.max(1, Math.log10(reviews));
    let baseScore = (rating * confidence) / (price === 0 ? 1 : price);

    // 3. "HOLE-IN-THE-WALL" DETECTOR
    // If Cheap AND (Authentic OR Queue OR No Frills) -> Boost 50%
    if (price <= 1 && (desc.includes('authentic') || desc.includes('best') || desc.includes('queue'))) {
       baseScore *= 1.5; 
    }

    score = baseScore;

    // 4. PERSONA ADJUSTMENTS
    switch (group) {
      case 'SOLO': // "The Seeker"
        // Hidden Gem Weight: Boost things with fewer reviews but high ratings
        if (reviews < 500 && rating > 4.5) score *= 2.0;
        // Social Weight
        if (tags.includes('hostel') || tags.includes('cafe') || tags.includes('bar')) score *= 1.3;
        break;

      case 'FRIENDS': // "The Vibe Chasers"
        // "Vibe" Boost
        if (tags.includes('night_club') || tags.includes('bar') || desc.includes('lively')) score *= 1.4;
        // Avoid "Too Quiet" (Low reviews often mean quiet)
        if (reviews < 50) score *= 0.5;
        break;

      case 'FAMILY': // "The Protectors"
        // Safety Filter: Strictly penalize bars/nightlife
        if (tags.includes('night_club') || tags.includes('bar')) score = 0;
        // Convenience Boost
        if (desc.includes('parking') || desc.includes('kid') || desc.includes('family')) score *= 2.0;
        break;

      case 'CORPORATE': // "The Team Builders"
        // Reliability Weight: Must have high review count
        if (reviews < 200) score *= 0.2; // Huge penalty for unproven spots
        // Capacity Check: Boost large establishments (often correlated with price/type)
        if (price >= 3) score *= 1.5; // Expense account friendly
        break;
    }

    return score;
  };

  const generateItinerary = async () => {
    setIsGenerating(true);
    setShowCreateModal(false);
    
    // Initial Context
    let currentLoc = { lat: 0, lng: 0 };
    const itinerary: Place[] = [];
    const usedIds: string[] = [];

    try {
      // A. FETCH RAW DATA
      const { data: rawPlaces, error } = await supabase
        .from('places') 
        .select('*')
        .ilike('city', `%${selectedCity}%`);

      if (error) throw error;
      
      if (!rawPlaces || rawPlaces.length === 0) {
        alert("No data found. Switching to Discovery.");
        setIsGenerating(false);
        setActiveView('DISCOVERY');
        return;
      }

      // Initialize location to first place found
      currentLoc = { lat: rawPlaces[0].lat, lng: rawPlaces[0].lng };

      // B. SCORE ALL PLACES based on selected PERSONA
      const scoredPlaces = rawPlaces.map(p => ({
        ...p,
        aiScore: calculateRelevanceScore(p, groupType)
      }));

      // Sort by AI Score descending
      scoredPlaces.sort((a, b) => b.aiScore - a.aiScore);

      // C. ROLLING STATE ASSEMBLY (Morning -> Lunch -> Afternoon -> Evening -> Dinner)
      const slots = [
        { name: 'Morning', types: ['tourist_attraction', 'religious_place', 'park'] },
        { name: 'Lunch', types: ['restaurant', 'cafe', 'food'] },
        { name: 'Afternoon', types: ['museum', 'art_gallery', 'tourist_attraction'] },
        { name: 'Evening', types: ['shopping_mall', 'point_of_interest', 'park'] },
        { name: 'Dinner', types: ['restaurant', 'bar', 'food'] }
      ];

      for (const slot of slots) {
        // 1. Filter by Category & Usage
        // We take the top 50% of scored places to ensure quality, then sort by distance
        const candidates = scoredPlaces.filter(p => 
          !usedIds.includes(p.id) && 
          p.aiScore > 0 && // Filter out 0 scores (like bars for families)
          slot.types.some(t => (p.type || '').includes(t)) // Fuzzy type match
        );

        if (candidates.length > 0) {
          // 2. Proximity Optimization (State Constraint)
          // Find the candidate closest to currentLoc, but Weighted by AI Score
          // We don't want the closest place if it sucks. We want the best place reasonably close.
          
          let bestCandidate = null;
          let bestCompositeScore = -Infinity;

          candidates.slice(0, 10).forEach(p => {
             // Distance heuristic (Euclidean is fine for sorting)
             const dist = Math.sqrt(Math.pow(p.lat - currentLoc.lat, 2) + Math.pow(p.lng - currentLoc.lng, 2));
             // Composite = AI Score - Distance Penalty
             // (Adjust penalty weight as needed)
             const composite = p.aiScore - (dist * 100); 
             
             if (composite > bestCompositeScore) {
               bestCompositeScore = composite;
               bestCandidate = p;
             }
          });

          if (bestCandidate) {
             const winner: Place = bestCandidate;
             itinerary.push(winner);
             usedIds.push(winner.id);
             currentLoc = { lat: winner.lat, lng: winner.lng }; // Update Rolling State
          }
        }
      }

      setTripPlan(itinerary);
      setIsGenerating(false);
      setActiveView('PLAN'); 

    } catch (err: any) {
      console.error("AI Error:", err);
      setIsGenerating(false);
    }
  };

  // HANDLERS
  const addToTrip = (place: any) => {
    if (!tripPlan.find((p) => p.id === place.id)) setTripPlan((prev) => [...prev, place]);
  };
  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));

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
        totalDays={1} 
        budget={budget}
        travelers={groupType === 'SOLO' ? 1 : 4} // Visual helper
        onRemoveItem={removeFromTrip}
        onAddToTrip={addToTrip}
        onResetApp={() => {
           if(confirm("Reset trip?")) { setSelectedCity(''); setTripPlan([]); setActiveView('DASHBOARD'); }
        }}
      />

      <main className="flex-1 relative h-full">
        
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg">
                   
                   <h3 className="font-bold text-xl text-gray-900 mb-6">Create Your Vibe</h3>
                   
                   {/* City */}
                   <div className="mb-4">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</label>
                     <input 
                       className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold" 
                       placeholder="City (e.g. Madurai)" 
                       value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
                     />
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

                   {/* GROUP TYPE SELECTOR (Crucial for Persona Engine) */}
                   <div className="mb-6">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Who is traveling?</label>
                     <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'SOLO', label: '🧍 Solo Explorer', desc: 'Hidden Gems' },
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
                     className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
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