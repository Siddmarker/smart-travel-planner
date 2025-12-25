'use client';
import { useState, useRef, useEffect } from 'react';

// Hardcoded list of popular Indian cities for the dropdown
const CITIES = [
  'Agra', 'Ahmedabad', 'Amritsar', 'Andaman Nicobar', 'Ayodhya',
  'Bengaluru', 'Chandigarh', 'Chennai', 'Coorg', 'Darjeeling',
  'Delhi', 'Goa', 'Gokarna', 'Hampi', 'Hyderabad',
  'Jaipur', 'Jaisalmer', 'Kochi', 'Kolkata', 'Ladakh',
  'Lakshadweep', 'Manali', 'Mumbai', 'Munnar', 'Mysuru',
  'Ooty', 'Pondicherry', 'Pune', 'Rishikesh', 'Shimla',
  'Udaipur', 'Varanasi', 'Varkala', 'Wayanad'
];

const DIETS = [
  { id: 'VEG', label: '🥗 Veg' },
  { id: 'NON_VEG', label: '🍗 Non-Veg' },
  { id: 'EGG', label: '🥚 Eggetarian' },
  { id: 'JAIN', label: '🥬 Jain' },
];

interface TripSetupProps {
  onComplete: (details: any) => void;
  onSkip: () => void;
}

export default function TripSetup({ onComplete, onSkip }: TripSetupProps) {
  // --- STATE ---
  const [days, setDays] = useState(3);
  const [groupType, setGroupType] = useState('SOLO');
  const [travelers, setTravelers] = useState(1); // New: Traveler Count
  const [diet, setDiet] = useState('VEG');       // New: Diet Preference

  // City Search State
  const [citySearch, setCitySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter cities based on typing
  const filteredCities = CITIES.filter(c => 
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStart = () => {
    if (!citySearch) return alert("Please select a city!");
    
    // Send all this rich data back to the main app
    onComplete({ 
      city: citySearch, 
      type: groupType, 
      days,
      travelers,
      diet
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
          <h2 className="text-2xl font-black text-white">2wards India</h2>
          <p className="text-blue-100 text-sm opacity-90">Design your perfect authentic journey.</p>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* 1. SEARCHABLE CITY DROPDOWN */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Where to?</label>
            <input 
              type="text"
              value={citySearch}
              onChange={(e) => { setCitySearch(e.target.value); setIsDropdownOpen(true); }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search city (e.g. Jaipur)"
              className="w-full p-4 bg-gray-50 rounded-xl font-bold text-gray-800 outline-none border-2 border-transparent focus:border-blue-500 transition-all"
            />
            {/* Dropdown List */}
            {isDropdownOpen && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto z-50">
                {filteredCities.map((city) => (
                  <div 
                    key={city}
                    onClick={() => { setCitySearch(city); setIsDropdownOpen(false); }}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-medium text-gray-700 transition-colors"
                  >
                    📍 {city}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. TRAVEL GROUP & COUNT */}
          <div>
             <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Who is traveling?</label>
             <div className="grid grid-cols-3 gap-2 mb-4">
               {['SOLO', 'FAMILY', 'FRIENDS'].map((type) => (
                 <button 
                   key={type}
                   onClick={() => setGroupType(type)}
                   className={`py-3 rounded-xl text-xs font-bold border-2 transition-all
                     ${groupType === type 
                       ? 'border-blue-500 bg-blue-50 text-blue-600' 
                       : 'border-gray-100 bg-white text-gray-400 hover:border-gray-300'}`}
                 >
                   {type}
                 </button>
               ))}
             </div>
             
             {/* Traveler Counter */}
             <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
               <span className="text-sm font-bold text-gray-600 px-2">Number of Travelers</span>
               <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-2 py-1">
                 <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black font-bold text-lg">-</button>
                 <span className="w-4 text-center font-black text-gray-800">{travelers}</span>
                 <button onClick={() => setTravelers(travelers + 1)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black font-bold text-lg">+</button>
               </div>
             </div>
          </div>

          {/* 3. TRIP DURATION */}
          <div>
             <div className="flex justify-between mb-2">
               <label className="text-xs font-bold text-gray-400 uppercase">Trip Duration</label>
               <span className="text-xs font-black text-blue-600">{days} Days</span>
             </div>
             <input 
               type="range" 
               min="1" max="10" 
               value={days} 
               onChange={(e) => setDays(parseInt(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
             />
          </div>

          {/* 4. DIET PREFERENCE (NEW) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Dietary Preference</label>
            <div className="flex gap-2 flex-wrap">
              {DIETS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDiet(d.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1
                    ${diet === d.id
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4">
            <button 
              onClick={handleStart}
              className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              Start Planning ➔
            </button>
            <button onClick={onSkip} className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 underline">
              Or just explore the map directly
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}