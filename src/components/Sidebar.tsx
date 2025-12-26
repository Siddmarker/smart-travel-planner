'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript, Libraries } from '@react-google-maps/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 1. STATIC LIBRARY DEFINITION (Prevents reload loops)
const LIBRARIES: Libraries = ["places"];

export type NavView = 'DASHBOARD' | 'PLAN' | 'DISCOVERY' | 'TRIPS' | 'SETTINGS';

interface SidebarProps {
  currentView: NavView;
  onChangeView: (view: NavView) => void;
  selectedCity?: string;
  tripPlan?: any[]; 
  onRemoveItem?: (id: string) => void;
  onAddToTrip?: (place: any) => void;
  isTripActive?: boolean;
  totalDays?: number;
  onResetApp?: () => void;
  diet?: string;      
  travelers?: number; 
  groupType?: string; 
  budget?: string; // NEW PROP
}

type WizardStage = 'IDLE' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'NIGHT' | 'COMPLETED';

export default function Sidebar({ 
  currentView, onChangeView,
  selectedCity = 'Bengaluru', tripPlan = [], onRemoveItem, onAddToTrip, 
  isTripActive = false, totalDays = 1, onResetApp,
  diet = 'ANY', travelers = 1, groupType = 'SOLO', budget = 'MEDIUM'
}: SidebarProps) {
  
  // 2. LOAD GOOGLE MAPS
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const [stage, setStage] = useState<WizardStage>('IDLE');
  const [currentDay, setCurrentDay] = useState(1);
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<'DB' | 'GOOGLE'>('DB');
  
  // 3. TRACK USED PLACES (Prevents Repeats)
  const [usedPlaceIds, setUsedPlaceIds] = useState<Set<string>>(new Set());

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 4. BULLETPROOF INITIALIZATION
  useEffect(() => {
    if (isLoaded && !loadError && window.google && !placesServiceRef.current) {
      try {
        const hiddenDiv = document.createElement('div');
        placesServiceRef.current = new google.maps.places.PlacesService(hiddenDiv);
      } catch (err) {
        console.error("Maps Init Error:", err);
      }
    }
  }, [isLoaded, loadError]);

  // --- THE "SALESMAN" ENGINE ---
  async function generateOptions(stageType: WizardStage) {
    if (!selectedCity) return;
    setLoadingOptions(true);
    setOptions([]);

    let category = 'ACTIVITY';
    if (['LUNCH', 'DINNER'].includes(stageType)) category = 'FOOD';
    if (stageType === 'NIGHT') category = 'STAY';

    // A. CHECK DATABASE (Curated Gems)
    const { data: dbPlaces } = await supabase
      .from('places')
      .select('*')
      .ilike('zone_id', selectedCity) 
      .eq('type', category)
      .limit(10);

    // Filter out used places from DB results
    const freshDbPlaces = dbPlaces?.filter(p => !usedPlaceIds.has(p.id)) || [];

    if (freshDbPlaces.length > 0) {
      const formatted = freshDbPlaces.slice(0, 4).map(p => ({
        ...p,
        slot: `Day ${currentDay} - ${stageType}`,
        source: 'Verified'
      }));
      setOptions(formatted);
      setSourceUsed('DB');
      setLoadingOptions(false);
      return;
    }

    // B. GOOGLE MAPS FALLBACK (The Smart Query)
    setSourceUsed('GOOGLE');
    if (!placesServiceRef.current) return;

    // --- SMART QUERY CONSTRUCTION ---
    let query = '';
    const dietStr = diet === 'NON_VEG' ? 'Famous Non-Veg' : diet === 'VEG' ? 'Pure Veg' : 'Best';
    const budgetStr = budget === 'LUXURY' ? 'Luxury 5-star' : budget === 'LOW' ? 'Affordable' : 'Top rated';
    
    if (category === 'ACTIVITY') {
       if (stageType === 'MORNING') query = `Famous landmarks or breakfast spots in ${selectedCity}`;
       if (stageType === 'AFTERNOON') query = `Museums, Parks or Shopping in ${selectedCity}`;
    }
    else if (category === 'FOOD') {
       query = `${dietStr} Restaurants for ${stageType.toLowerCase()} in ${selectedCity}`;
    }
    else if (category === 'STAY') {
       query = `${budgetStr} Hotels in ${selectedCity}`;
    }

    const request = {
      query: query,
      fields: ['name', 'formatted_address', 'rating', 'user_ratings_total', 'photos', 'geometry', 'place_id'],
    };

    placesServiceRef.current.textSearch(request, (results, status) => {
      setLoadingOptions(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        
        // C. INTELLIGENT FILTERING
        const smartResults = results
          .filter(p => !usedPlaceIds.has(p.place_id!)) // Remove duplicates
          .filter(p => (p.rating || 0) >= 4.0)         // Only Good places (4.0+)
          .filter(p => (p.user_ratings_total || 0) > 50) // Must be popular
          .slice(0, 4)                                 // Take top 4
          .map(place => ({
            id: place.place_id,
            name: place.name,
            description: place.formatted_address,
            rating: place.rating,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            image: place.photos?.[0]?.getUrl() || `https://source.unsplash.com/random/400x300/?${category}`,
            type: category,
            slot: `Day ${currentDay} - ${stageType}`,
            source: 'Google'
          }));
        
        setOptions(smartResults);
      }
    });
  }

  // --- FLOW LOGIC ---
  const handleSelection = (place: any) => {
    // 1. Add to Used List (So we don't show it again)
    setUsedPlaceIds(prev => new Set(prev).add(place.id));
    
    // 2. Add to Trip
    if(onAddToTrip) onAddToTrip({ ...place, slot: `Day ${currentDay} - ${stage}` }); 
    
    // 3. Advance Stage
    if (stage === 'MORNING') { setStage('LUNCH'); generateOptions('LUNCH'); }
    else if (stage === 'LUNCH') { setStage('AFTERNOON'); generateOptions('AFTERNOON'); }
    else if (stage === 'AFTERNOON') { setStage('DINNER'); generateOptions('DINNER'); }
    else if (stage === 'DINNER') { setStage('NIGHT'); generateOptions('NIGHT'); }
    else if (stage === 'NIGHT') {
      if (currentDay < totalDays!) {
        setCurrentDay(currentDay + 1);
        setStage('MORNING');
        generateOptions('MORNING');
      } else {
        setStage('COMPLETED');
      }
    }
  };

  const startPlanning = () => {
    setUsedPlaceIds(new Set()); // Reset history
    setStage('MORNING');
    setCurrentDay(1);
    generateOptions('MORNING');
  };

  const resetPlanner = () => { setStage('IDLE'); setCurrentDay(1); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };
  
  if (loadError) return <div className="p-4 text-red-500">Error loading Maps</div>;

  return (
    <div className="w-80 h-screen bg-white shadow-xl z-20 flex flex-col border-r border-gray-200">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          2wards India
        </h1>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
           {selectedCity} • {budget} • {diet === 'NON_VEG' ? '🍗 Non-Veg' : '🍽️ Any'}
        </p>
      </div>

      {/* NAV */}
      <div className="p-3 grid gap-1 border-b border-gray-100 bg-gray-50/50">
        {[
           { id: 'DASHBOARD', icon: '🏠', label: 'Dashboard' },
           { id: 'PLAN', icon: '✨', label: 'Plan Trip' },
           { id: 'DISCOVERY', icon: '🧭', label: 'Discovery' },
           { id: 'TRIPS', icon: '🎒', label: 'Your Trips' },
           { id: 'SETTINGS', icon: '⚙️', label: 'Settings' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => onChangeView(item.id as NavView)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all
              ${currentView === item.id 
                ? 'bg-black text-white shadow-md' 
                : 'text-gray-500 hover:bg-white hover:text-black'}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      {/* DYNAMIC CONTENT */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        
        {currentView === 'PLAN' && (
          <div className="h-full flex flex-col">
            {stage === 'IDLE' ? (
              <div className="text-center mt-10">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="font-bold text-gray-800 text-sm">AI Trip Generator</h3>
                <p className="text-xs text-gray-500 mb-6 px-4 leading-relaxed">
                  Ready to build Day 1 for <b>{selectedCity}</b>?
                  <br/>We'll hunt for the best {diet.toLowerCase().replace('_',' ')} spots.
                </p>
                <button onClick={startPlanning} className="bg-blue-600 text-white w-full py-4 rounded-xl font-bold text-xs shadow-lg hover:scale-105 transition-transform">
                  Start Planning
                </button>
                {onResetApp && (
                  <button onClick={onResetApp} className="mt-4 text-[10px] text-gray-400 underline hover:text-black">Change Destination</button>
                )}
              </div>
            ) : stage === 'COMPLETED' ? (
               <div className="text-center mt-10">
                 <div className="text-4xl mb-2">✅</div>
                 <h3 className="font-bold text-green-600 mb-2">Trip Ready!</h3>
                 <p className="text-xs text-gray-500 mb-4">Check "Your Trips" tab to see the full plan.</p>
                 <button onClick={resetPlanner} className="text-xs underline text-blue-600">Start Over</button>
               </div>
            ) : (
               <div className="flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">DAY {currentDay}</span>
                    <h3 className="font-black text-lg text-blue-900">{stage}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border
                    ${sourceUsed === 'DB' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                    {sourceUsed === 'DB' ? '✨ Curated' : '🌐 Web Results'}
                  </span>
                </div>
                
                {loadingOptions ? (
                  <div className="space-y-3">
                     <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
                     <div className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {options.length === 0 ? (
                       <div className="text-center text-gray-400 text-xs py-10">No specific matches found. Try searching manually.</div>
                    ) : options.map((option) => (
                      <div key={option.id} onClick={() => handleSelection(option)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 cursor-pointer group hover:shadow-md transition-all">
                         <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                            <img src={option.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {option.source === 'Verified' && (
                              <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded backdrop-blur-sm font-bold">Verified</span>
                            )}
                         </div>
                         <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{option.name}</h4>
                         <div className="flex items-center justify-between mt-1">
                           <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">⭐ {option.rating || 'New'}</span>
                           <span className="text-[9px] text-gray-400 font-bold">+ Add</span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
               </div>
            )}
          </div>
        )}

        {/* TRIPS VIEW */}
        {currentView === 'TRIPS' && (
          <div>
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Your Itinerary</h3>
            {tripPlan.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-xs text-gray-400 mb-2">No places added yet.</p>
                <button onClick={() => onChangeView('PLAN')} className="text-blue-600 font-bold text-xs">Go to Planner</button>
              </div>
            ) : (
              <div className="space-y-3 relative border-l-2 border-gray-200 ml-3 pl-5 pb-5">
                 {tripPlan.map((item, idx) => (
                   <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative group">
                      <div className="absolute -left-[29px] top-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                      <div className="text-[9px] font-bold text-blue-500 uppercase mb-1">{item.slot}</div>
                      <div className="font-bold text-xs text-gray-800 line-clamp-1">{item.name}</div>
                      {onRemoveItem && <button onClick={() => onRemoveItem(item.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 text-lg leading-none">×</button>}
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs shadow-sm border border-blue-100">
              {travelers}
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Profile</div>
              <div className="text-xs font-bold text-gray-800">Admin</div>
            </div>
         </div>
         <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Logout</button>
      </div>

    </div>
  );
}