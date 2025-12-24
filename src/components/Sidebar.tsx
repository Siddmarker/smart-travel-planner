'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SidebarProps {
  onCitySelect: (city: string) => void;
  selectedCity: string;
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  tripPlan: any[]; 
  onRemoveItem: (id: string) => void;
  onAddToTrip: (place: any) => void;
  isTripActive?: boolean;
  totalDays?: number;
  onResetApp?: () => void; // <--- NEW PROP for the Reset Button
}

type WizardStage = 'IDLE' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'NIGHT' | 'COMPLETED';

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
}
function deg2rad(deg: number) { return deg * (Math.PI/180); }

export default function Sidebar({ 
  onCitySelect, selectedCity, onFilterChange, activeFilter, tripPlan, onRemoveItem, onAddToTrip, 
  isTripActive = false, totalDays = 1, onResetApp 
}: SidebarProps) {
  
  const [cities, setCities] = useState<string[]>([]);
  const [cityPlaces, setCityPlaces] = useState<any[]>([]);
  
  // Force PLANNER tab if trip is active
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'PLANNER'>(isTripActive ? 'PLANNER' : 'EXPLORE');
  
  // WIZARD STATE
  const [stage, setStage] = useState<WizardStage>('IDLE');
  const [currentDay, setCurrentDay] = useState(1);
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [lastLocation, setLastLocation] = useState<{lat: number, lng: number} | null>(null);

  const FILTERS = ['ALL', 'SOLO', 'FAMILY', 'FRIENDS'];

  // Load Cities (For the main menu)
  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase.from('places').select('zone_id');
      if (data) {
        const uniqueCities = Array.from(new Set(data.map((item: any) => item.zone_id)));
        setCities(uniqueCities.sort());
      }
    }
    fetchCities();
  }, []);

  // Load Places when City Changes (For the list view)
  useEffect(() => {
    async function fetchPlacesInCity() {
      if (!selectedCity) return;
      // We fetch all columns so we have images, vibes, etc.
      const { data } = await supabase.from('places').select('*').eq('zone_id', selectedCity);
      if (data) setCityPlaces(data);
    }
    fetchPlacesInCity();
  }, [selectedCity]);

  // AI Planner Logic
  async function generateOptions(requiredType: string, timeTag?: string) {
    setLoadingOptions(true);
    setOptions([]);
    let query = supabase.from('places').select('*').eq('zone_id', selectedCity);

    if (requiredType === 'ACTIVITY') query = query.in('type', ['ACTIVITY', 'HIDDEN_GEM']);
    else query = query.eq('type', requiredType);

    if (timeTag) query = query.contains('best_time_tags', [timeTag]);

    const { data } = await query;
    if (data && data.length > 0) {
      let sorted = data;
      if (lastLocation) {
        sorted = data.map((place: any) => ({
          ...place,
          distanceFromLast: getDistance(lastLocation.lat, lastLocation.lng, place.lat, place.lng)
        })).sort((a: any, b: any) => a.distanceFromLast - b.distanceFromLast);
      } else {
        sorted = data.sort(() => 0.5 - Math.random());
      }
      setOptions(sorted.slice(0, 3));
    } else if (timeTag) {
       generateOptions(requiredType);
    }
    setLoadingOptions(false);
  }

  const handleSelection = (place: any) => {
    onAddToTrip({ ...place, slot: `Day ${currentDay} - ${stage}` }); 
    setLastLocation({ lat: place.lat, lng: place.lng });

    if (stage === 'MORNING') { setStage('LUNCH'); generateOptions('FOOD', 'LUNCH'); }
    else if (stage === 'LUNCH') { setStage('AFTERNOON'); generateOptions('ACTIVITY', 'AFTERNOON'); }
    else if (stage === 'AFTERNOON') { setStage('DINNER'); generateOptions('FOOD', 'DINNER'); }
    else if (stage === 'DINNER') { setStage('NIGHT'); generateOptions('STAY'); }
    else if (stage === 'NIGHT') {
      if (currentDay < totalDays) {
        setCurrentDay(currentDay + 1);
        setStage('MORNING');
        generateOptions('ACTIVITY', 'MORNING');
      } else {
        setStage('COMPLETED');
      }
    }
  };

  const startPlanning = () => {
    setStage('MORNING');
    setCurrentDay(1);
    setLastLocation(null);
    generateOptions('ACTIVITY', 'MORNING');
  };

  const resetPlanner = () => { setStage('IDLE'); setCurrentDay(1); setLastLocation(null); };

  const filteredCityPlaces = cityPlaces.filter(place => {
    if (activeFilter === 'ALL') return true;
    return place.vibes?.includes(activeFilter);
  });

  return (
    <div className="w-96 h-screen bg-white shadow-xl z-20 flex flex-col border-r border-gray-200">
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          2wards India
        </h1>
        <div className="flex gap-4 mt-4 text-xs font-bold border-b">
          <button onClick={() => setActiveTab('EXPLORE')} className={`pb-2 ${activeTab === 'EXPLORE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>EXPLORE</button>
          <button onClick={() => setActiveTab('PLANNER')} className={`pb-2 ${activeTab === 'PLANNER' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>AI PLANNER ✨</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'EXPLORE' && (
          <>
            {/* STRICT SWITCH: If Trip Active, Show Context Header & Places */}
            {isTripActive ? (
              <>
                <div className="p-4 bg-white border-b sticky top-0 z-10">
                   <div className="flex justify-between items-center mb-2">
                      <h2 className="text-lg font-black text-gray-800">{selectedCity}</h2>
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                        {activeFilter} MODE
                      </span>
                   </div>
                   <div className="flex justify-between items-center">
                     <p className="text-xs text-gray-400">Curating for {totalDays} Days</p>
                     
                     {/* --- THIS IS THE NEW RESET BUTTON --- */}
                     <button 
                       onClick={onResetApp}
                       className="text-[10px] text-red-500 font-bold underline hover:text-red-700"
                     >
                       Change Trip
                     </button>
                   </div>
                </div>
                
                {/* LIST OF PLACES IN THE CITY */}
                <div className="space-y-3 p-2">
                  {filteredCityPlaces.map((place) => (
                    <div key={place.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 hover:border-blue-400 transition-all">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm text-gray-800">{place.name}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${place.authenticity_score > 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {place.authenticity_score}% Auth
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{place.description}</p>
                      <button 
                         onClick={() => onAddToTrip({...place, slot: 'Saved'})}
                         className="self-start text-[10px] font-bold text-white bg-black px-3 py-1.5 rounded-full hover:bg-gray-800"
                       >
                         + Add to List
                       </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // DEFAULT MODE: Show Cities
              <>
                <div className="p-3 bg-white mb-2 shadow-sm">
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {FILTERS.map((mode) => (
                      <button key={mode} onClick={() => onFilterChange(mode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${activeFilter === mode ? 'bg-black text-white' : 'bg-white text-gray-500'}`}>{mode}</button>
                    ))}
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {cities.map((city) => (
                    <button key={city} onClick={() => onCitySelect(city)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${selectedCity === city ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>{city}</button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* PLANNER TAB */}
        {activeTab === 'PLANNER' && (
          <div className="p-4 h-full flex flex-col">
            {stage === 'IDLE' && (
              <div className="text-center mt-10">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="font-bold text-gray-800 mb-2">{totalDays} Day Itinerary</h3>
                <p className="text-xs text-gray-500 mb-6 px-4">
                  I will curate a complete <b>{totalDays}-Day</b> journey for you in {selectedCity}.
                </p>
                <button onClick={startPlanning} className="bg-black text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform">Start Generator</button>
              </div>
            )}

            {['MORNING', 'LUNCH', 'AFTERNOON', 'DINNER', 'NIGHT'].includes(stage) && (
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">DAY {currentDay} of {totalDays}</span>
                    <h3 className="font-black text-xl text-blue-900">{stage}</h3>
                  </div>
                  {lastLocation && <span className="text-[9px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">📍 Near Last Stop</span>}
                </div>
                {loadingOptions ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-xs animate-pulse">Scanning best spots...</div>
                ) : (
                  <div className="space-y-3">
                    {options.map((option) => (
                      <div key={option.id} onClick={() => handleSelection(option)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group">
                         <h4 className="font-bold text-sm text-gray-800 group-hover:text-blue-600">{option.name}</h4>
                         <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{option.description}</p>
                         {option.distanceFromLast && <span className="text-[9px] font-bold text-blue-600 mt-2 block">🚗 {option.distanceFromLast.toFixed(1)} km away</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {stage === 'COMPLETED' && (
              <div className="text-center mt-5">
                 <div className="text-4xl mb-2">🎉</div>
                 <h3 className="font-bold text-green-600 text-lg mb-4">Full Trip Ready!</h3>
                 <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left mb-6 max-h-60 overflow-y-auto">
                   {tripPlan.map((item, idx) => (
                     <div key={idx} className="p-3 border-b border-gray-100 last:border-0 flex items-center gap-3">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">{idx + 1}</div>
                        <div><p className="text-[9px] font-bold text-gray-400 uppercase">{item.slot}</p><p className="text-xs font-bold text-gray-800">{item.name}</p></div>
                     </div>
                   ))}
                 </div>
                 <button onClick={resetPlanner} className="text-xs font-bold text-gray-500 underline">Start Over</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}