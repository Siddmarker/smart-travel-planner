'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript } from '@react-google-maps/api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const LIBRARIES: ("places")[] = ["places"];

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
}

type WizardStage = 'IDLE' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'NIGHT' | 'COMPLETED';

export default function Sidebar({ 
  currentView, onChangeView,
  selectedCity = 'Delhi', tripPlan = [], onRemoveItem, onAddToTrip, 
  isTripActive = false, totalDays = 1, onResetApp,
  diet = 'VEG', travelers = 1, groupType = 'SOLO'
}: SidebarProps) {
  
  const router = useRouter();
  
  // LOAD GOOGLE MAPS
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const [stage, setStage] = useState<WizardStage>('IDLE');
  const [currentDay, setCurrentDay] = useState(1);
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<'DB' | 'GOOGLE'>('DB'); // Track where data came from
  
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (isLoaded && !placesServiceRef.current) {
      const hiddenDiv = document.createElement('div');
      placesServiceRef.current = new google.maps.places.PlacesService(hiddenDiv);
    }
  }, [isLoaded]);

  // --- HYBRID GENERATOR ENGINE ---
  async function generateOptions(stageType: WizardStage) {
    if (!selectedCity) return;
    setLoadingOptions(true);
    setOptions([]);

    // 1. DETERMINE CATEGORY
    let category = 'ACTIVITY';
    let timeTag = stageType; // e.g., 'MORNING'

    if (['LUNCH', 'DINNER'].includes(stageType)) category = 'FOOD';
    if (stageType === 'NIGHT') category = 'STAY';

    console.log(`🔎 Checking Database for: ${selectedCity} (${category})...`);

    // 2. CHECK SUPABASE (DATABASE) FIRST
    const { data: dbPlaces } = await supabase
      .from('places')
      .select('*')
      .ilike('zone_id', selectedCity) // Case-insensitive match (Agra vs AGRA)
      .eq('type', category)
      .contains('best_time_tags', [timeTag])
      .limit(5);

    if (dbPlaces && dbPlaces.length > 0) {
      // ✅ FOUND IN DB
      console.log("✅ Found in DB!", dbPlaces.length);
      const formatted = dbPlaces.map(p => ({
        ...p,
        slot: `Day ${currentDay} - ${stageType}`,
        source: 'Verified' // UI Badge
      }));
      setOptions(formatted);
      setSourceUsed('DB');
      setLoadingOptions(false);
      return; // STOP HERE. Do not call Google.
    }

    // 3. FALLBACK TO GOOGLE (If DB was empty)
    console.log("⚠️ DB Empty. Calling Google Maps...");
    setSourceUsed('GOOGLE');
    
    if (!placesServiceRef.current) return;

    // Build Smart Query for Google
    const dietTerm = diet === 'VEG' ? 'Pure Veg' : diet === 'JAIN' ? 'Jain Food' : 'Best';
    const groupTerm = groupType === 'FAMILY' ? 'Family Friendly' : 'Popular';
    
    let query = '';
    if (category === 'ACTIVITY') query = `Top ${groupTerm} attractions in ${selectedCity}`;
    if (category === 'FOOD') query = `${dietTerm} Restaurants for ${stageType.toLowerCase()} in ${selectedCity}`;
    if (category === 'STAY') query = `Safe hotels in ${selectedCity}`;

    const request = {
      query: query,
      fields: ['name', 'formatted_address', 'rating', 'photos', 'geometry', 'place_id'],
    };

    placesServiceRef.current.textSearch(request, (results, status) => {
      setLoadingOptions(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        const formatted = results.slice(0, 4).map(place => ({
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
        setOptions(formatted);
      }
    });
  }

  // --- PROGRESSION LOGIC ---
  const handleSelection = (place: any) => {
    if(onAddToTrip) onAddToTrip({ ...place, slot: `Day ${currentDay} - ${stage}` }); 
    
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
    setStage('MORNING');
    setCurrentDay(1);
    generateOptions('MORNING');
  };

  const resetPlanner = () => { setStage('IDLE'); setCurrentDay(1); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };
  
  return (
    <div className="w-80 h-screen bg-white shadow-xl z-20 flex flex-col border-r border-gray-200">
      
      {/* HEADER */}
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          2wards India
        </h1>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">
           {selectedCity} • {diet === 'VEG' ? '🥬 Pure Veg' : '🍽️ Any Food'}
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
              <div className="text-center mt-5">
                <div className="text-4xl mb-2">📅</div>
                <h3 className="font-bold text-gray-800 text-sm">AI Trip Generator</h3>
                <p className="text-xs text-gray-500 mb-4 px-2">
                  Ready to build Day 1 for <b>{selectedCity}</b>?
                </p>
                <button onClick={startPlanning} className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold text-xs shadow-md">
                  Start Day {currentDay}
                </button>
                {onResetApp && (
                  <button onClick={onResetApp} className="mt-3 text-[10px] text-gray-400 underline">Change Settings</button>
                )}
              </div>
            ) : stage === 'COMPLETED' ? (
               <div className="text-center mt-5">
                 <h3 className="font-bold text-green-600 mb-2">Trip Ready!</h3>
                 <p className="text-xs text-gray-500 mb-4">Check "Your Trips" tab to see the full plan.</p>
                 <button onClick={resetPlanner} className="text-xs underline">Start Over</button>
               </div>
            ) : (
               <div className="flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">DAY {currentDay}</span>
                    <h3 className="font-black text-lg text-blue-900">{stage}</h3>
                  </div>
                  {/* SOURCE INDICATOR BADGE */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border
                    ${sourceUsed === 'DB' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                    {sourceUsed === 'DB' ? '✨ Curated' : '🌐 Web Results'}
                  </span>
                </div>
                
                {loadingOptions ? (
                  <div className="space-y-3">
                     <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                     <div className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {options.map((option) => (
                      <div key={option.id} onClick={() => handleSelection(option)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 cursor-pointer group">
                         <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                            <img src={option.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {option.source === 'Verified' && (
                              <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">Verified</span>
                            )}
                         </div>
                         <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{option.name}</h4>
                         <div className="flex items-center gap-1 mt-1">
                           <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">⭐ {option.rating || 'New'}</span>
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
              <p className="text-xs text-gray-400">No places added yet.</p>
            ) : (
              <div className="space-y-2 relative border-l-2 border-gray-200 ml-2 pl-4">
                 {tripPlan.map((item, idx) => (
                   <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative mb-4">
                      <div className="absolute -left-[25px] top-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <div className="text-[9px] font-bold text-blue-500 uppercase mb-1">{item.slot}</div>
                      <div className="font-bold text-xs text-gray-800">{item.name}</div>
                      {onRemoveItem && <button onClick={() => onRemoveItem(item.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500">×</button>}
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">{travelers}👤</div>
            <div className="text-xs font-bold text-gray-500">{diet === 'VEG' ? 'Veg' : 'Any'}</div>
         </div>
         <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:underline">Logout</button>
      </div>

    </div>
  );
}