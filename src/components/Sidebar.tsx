'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the 4 Main Views
export type NavView = 'DASHBOARD' | 'PLAN' | 'DISCOVERY' | 'TRIPS' | 'SETTINGS';

interface SidebarProps {
  currentView: NavView;
  onChangeView: (view: NavView) => void;
  
  // Data Props for Planner/Discovery
  onCitySelect?: (city: string) => void;
  selectedCity?: string;
  onFilterChange?: (filter: string) => void;
  activeFilter?: string;
  tripPlan?: any[]; 
  onRemoveItem?: (id: string) => void;
  onAddToTrip?: (place: any) => void;
  isTripActive?: boolean;
  totalDays?: number;
  onResetApp?: () => void;
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
  currentView, onChangeView,
  onCitySelect, selectedCity, onFilterChange, activeFilter = 'ALL', 
  tripPlan = [], onRemoveItem, onAddToTrip, 
  isTripActive = false, totalDays = 1, onResetApp 
}: SidebarProps) {
  
  // --- PLANNER/DISCOVERY LOGIC ---
  const [cities, setCities] = useState<string[]>([]);
  const [cityPlaces, setCityPlaces] = useState<any[]>([]);
  const [internalCity, setInternalCity] = useState('');
  const [internalFilter, setInternalFilter] = useState('ALL');

  const currentCity = selectedCity || internalCity;
  const currentFilter = activeFilter || internalFilter;
  
  const [stage, setStage] = useState<WizardStage>('IDLE');
  const [currentDay, setCurrentDay] = useState(1);
  const [options, setOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [lastLocation, setLastLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase.from('places').select('zone_id');
      if (data) {
        const unique = Array.from(new Set(data.map((item: any) => item.zone_id))).sort();
        setCities(unique);
        if (!currentCity && unique.length > 0) setInternalCity(unique[0]);
      }
    }
    fetchCities();
  }, []);

  useEffect(() => {
    if (!currentCity) return;
    async function fetch() {
      const { data } = await supabase.from('places').select('*').eq('zone_id', currentCity);
      if (data) setCityPlaces(data);
    }
    fetch();
  }, [currentCity]);

  // Wizard Generator Logic
  async function generateOptions(requiredType: string, timeTag?: string) {
    setLoadingOptions(true);
    setOptions([]);
    let query = supabase.from('places').select('*').eq('zone_id', currentCity);
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
    } else if (timeTag) generateOptions(requiredType);
    setLoadingOptions(false);
  }

  const handleSelection = (place: any) => {
    if(onAddToTrip) onAddToTrip({ ...place, slot: `Day ${currentDay} - ${stage}` }); 
    setLastLocation({ lat: place.lat, lng: place.lng });

    if (stage === 'MORNING') { setStage('LUNCH'); generateOptions('FOOD', 'LUNCH'); }
    else if (stage === 'LUNCH') { setStage('AFTERNOON'); generateOptions('ACTIVITY', 'AFTERNOON'); }
    else if (stage === 'AFTERNOON') { setStage('DINNER'); generateOptions('FOOD', 'DINNER'); }
    else if (stage === 'DINNER') { setStage('NIGHT'); generateOptions('STAY'); }
    else if (stage === 'NIGHT') {
      if (currentDay < totalDays!) {
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

  const handleCityClick = (city: string) => { if (onCitySelect) onCitySelect(city); else setInternalCity(city); };
  const handleFilterClick = (mode: string) => { if (onFilterChange) onFilterChange(mode); else setInternalFilter(mode); };
  
  const filteredCityPlaces = cityPlaces.filter(place => currentFilter === 'ALL' || place.vibes?.includes(currentFilter));

  return (
    <div className="w-80 h-screen bg-white shadow-xl z-20 flex flex-col border-r border-gray-200">
      
      {/* 1. APP HEADER */}
      <div className="p-5 border-b border-gray-100">
        <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          2wards India
        </h1>
      </div>

      {/* 2. MAIN NAVIGATION BUTTONS */}
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

      {/* 3. DYNAMIC CONTENT AREA (Changes based on selection) */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        
        {/* VIEW: PLANNER */}
        {currentView === 'PLAN' && (
          <div className="p-4 h-full flex flex-col">
            {stage === 'IDLE' ? (
              <div className="text-center mt-5">
                <div className="text-4xl mb-2">📅</div>
                <h3 className="font-bold text-gray-800 text-sm">AI Trip Generator</h3>
                <p className="text-xs text-gray-500 mb-4 px-2">
                  Building a <b>{totalDays}-Day</b> trip for <b>{currentCity}</b>.
                </p>
                <button onClick={startPlanning} className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold text-xs shadow-md">
                  Start Generating
                </button>
                {onResetApp && (
                  <button onClick={onResetApp} className="mt-3 text-[10px] text-gray-400 underline">Change City/Days</button>
                )}
              </div>
            ) : (
               // WIZARD UI
               <div className="flex-1 flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">DAY {currentDay}</span>
                    <h3 className="font-black text-lg text-blue-900">{stage}</h3>
                  </div>
                </div>
                {loadingOptions ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-xs animate-pulse">Scanning...</div>
                ) : (
                  <div className="space-y-2">
                    {options.map((option) => (
                      <div key={option.id} onClick={() => handleSelection(option)} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-blue-500 cursor-pointer">
                         <h4 className="font-bold text-xs text-gray-800">{option.name}</h4>
                         <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{option.description}</p>
                      </div>
                    ))}
                  </div>
                )}
               </div>
            )}
            {stage === 'COMPLETED' && (
               <div className="text-center mt-5">
                 <h3 className="font-bold text-green-600 mb-2">Trip Ready!</h3>
                 <button onClick={resetPlanner} className="text-xs underline">Start Over</button>
               </div>
            )}
          </div>
        )}

        {/* VIEW: DISCOVERY */}
        {currentView === 'DISCOVERY' && (
          <>
            <div className="p-3 bg-white mb-2 shadow-sm sticky top-0 z-10">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {['ALL', 'SOLO', 'FAMILY', 'FRIENDS'].map((mode) => (
                  <button key={mode} onClick={() => handleFilterClick(mode)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${currentFilter === mode ? 'bg-black text-white' : 'bg-white text-gray-500'}`}>{mode}</button>
                ))}
              </div>
            </div>
            <div className="p-2 space-y-1">
              {cities.map((city) => (
                <button key={city} onClick={() => handleCityClick(city)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${currentCity === city ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>{city}</button>
              ))}
            </div>
          </>
        )}

        {/* VIEW: TRIPS */}
        {currentView === 'TRIPS' && (
          <div className="p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Your Itinerary</h3>
            {tripPlan.length === 0 ? (
              <p className="text-xs text-gray-400">No places added yet.</p>
            ) : (
              <div className="space-y-2">
                 {tripPlan.map((item, idx) => (
                   <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative">
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

      {/* 4. USER PROFILE (Fixed Bottom) */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
          </div>
          <div>
             <h4 className="font-bold text-sm text-gray-900">John Doe</h4>
             <p className="text-[10px] text-gray-500">Traveller Level 3</p>
          </div>
        </div>
      </div>

    </div>
  );
}