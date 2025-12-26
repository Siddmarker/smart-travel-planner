'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CITIES = ['Agra', 'Bengaluru', 'Chennai', 'Coorg', 'Delhi', 'Goa', 'Jaipur', 'Kerala', 'Manali', 'Mumbai', 'Wayanad', 'Udaipur', 'Varanasi'];

interface TripSetupProps {
  onComplete: (details: any) => void;
  onSkip: () => void;
}

export default function TripSetup({ onComplete, onSkip }: TripSetupProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // FORM STATE
  const [citySearch, setCitySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [days, setDays] = useState(3);
  const [groupType, setGroupType] = useState('COUPLE');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState('MEDIUM'); // LOW, MEDIUM, LUXURY
  const [diet, setDiet] = useState('ANY');

  // Filter cities
  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  const handleCreateTrip = async () => {
    if (!citySearch) return alert("Please select a destination city.");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in.");

      // 1. Create Trip in DB
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert([{ 
          name: `Trip to ${citySearch}`, 
          city: citySearch, 
          created_by: user.id 
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      // 2. Add Admin
      await supabase.from('trip_members').insert([{
        trip_id: trip.id,
        user_id: user.id,
        email: user.email,
        role: 'ADMIN'
      }]);

      // 3. Launch App
      onComplete({ 
        tripId: trip.id,
        city: citySearch, 
        type: groupType, 
        days, travelers, diet, budget,
        isAdmin: true
      });

    } catch (error: any) {
      console.error(error);
      // Fallback for demo if DB fails
      onComplete({ city: citySearch, type: groupType, days, travelers, diet, budget, isAdmin: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      {/* MAIN CARD CONTAINER */}
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDE: INSPIRATIONAL IMAGE */}
        <div className="hidden md:flex w-1/3 bg-blue-600 relative overflow-hidden flex-col justify-between p-8 text-white">
          <div className="absolute inset-0 z-0">
             <img src="https://source.unsplash.com/random/800x1200/?india,travel" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-2">2wards India</h2>
            <p className="text-blue-100 text-sm">Design your perfect authentic journey.</p>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">📍</div>
               <div><p className="font-bold text-sm">Smart Itineraries</p><p className="text-xs text-white/70">AI-curated based on your vibe</p></div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">👥</div>
               <div><p className="font-bold text-sm">Collaborate</p><p className="text-xs text-white/70">Invite friends & vote on places</p></div>
             </div>
          </div>
        </div>

        {/* RIGHT SIDE: THE FORM */}
        <div className="flex-1 bg-gray-50 p-6 md:p-10 overflow-y-auto">
          
          <div className="max-w-xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">Plan Your Trip</h1>
              <p className="text-gray-500">Let's set up your dashboard in 30 seconds.</p>
            </div>

            {/* SECTION 1: DESTINATION */}
            <div className="space-y-4">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Destination</label>
               <div className="relative">
                 <input 
                   type="text" 
                   value={citySearch}
                   onChange={(e) => { setCitySearch(e.target.value); setIsDropdownOpen(true); }}
                   onFocus={() => setIsDropdownOpen(true)}
                   className="w-full p-5 bg-white rounded-2xl font-bold text-xl text-gray-800 shadow-sm border border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none placeholder-gray-300"
                   placeholder="e.g. Jaipur, Goa, Kerala..."
                 />
                 <span className="absolute right-5 top-5 text-2xl">🌏</span>
                 
                 {/* City Dropdown */}
                 {isDropdownOpen && filteredCities.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                     {filteredCities.map((city) => (
                       <div 
                         key={city}
                         onClick={() => { setCitySearch(city); setIsDropdownOpen(false); }}
                         className="p-4 hover:bg-blue-50 cursor-pointer text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0 flex items-center gap-3"
                       >
                         <span className="text-gray-400">📍</span> {city}
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>

            {/* SECTION 2: TRAVELERS & DURATION */}
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Duration</label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-blue-600">{days}</span>
                    <span className="text-xs font-bold text-gray-400">Days</span>
                  </div>
                  <input type="range" min="1" max="15" value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
               </div>

               <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Travelers</label>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-200">-</button>
                    <span className="text-xl font-black text-gray-800">{travelers}</span>
                    <button onClick={() => setTravelers(travelers + 1)} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold hover:bg-gray-800">+</button>
                  </div>
               </div>
            </div>

            {/* SECTION 3: GROUP TYPE */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Who are you with?</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'SOLO', icon: '🎒', label: 'Solo' },
                  { id: 'COUPLE', icon: '❤️', label: 'Couple' },
                  { id: 'FRIENDS', icon: '🥂', label: 'Friends' },
                  { id: 'FAMILY', icon: '👨‍👩‍👧‍👦', label: 'Family' }
                ].map((g) => (
                  <button 
                    key={g.id}
                    onClick={() => setGroupType(g.id)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                      ${groupType === g.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent bg-white text-gray-500 hover:bg-gray-100'}`}
                  >
                    <span className="text-2xl">{g.icon}</span>
                    <span className="text-xs font-bold">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 4: PREFERENCES (Diet & Budget) */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Diet</label>
                <div className="flex flex-wrap gap-2">
                   {['ANY', 'VEG', 'NON_VEG'].map(d => (
                     <button 
                       key={d} 
                       onClick={() => setDiet(d)} 
                       className={`px-3 py-2 rounded-lg text-xs font-bold border ${diet === d ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200'}`}
                     >
                       {d}
                     </button>
                   ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Budget</label>
                <div className="flex gap-2">
                   {['LOW', 'MEDIUM', 'HIGH'].map(b => (
                     <button 
                       key={b} 
                       onClick={() => setBudget(b)} 
                       className={`flex-1 py-2 rounded-lg text-xs font-bold border ${budget === b ? 'bg-green-100 text-green-700 border-green-500' : 'bg-white text-gray-500 border-gray-200'}`}
                     >
                       {b === 'LOW' ? '$' : b === 'MEDIUM' ? '$$' : '$$$'}
                     </button>
                   ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button 
              onClick={handleCreateTrip}
              disabled={loading}
              className="w-full py-5 bg-black text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span className="animate-pulse">Creating Dashboard...</span>
              ) : (
                <>Start Planning <span className="text-xl">➔</span></>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 cursor-pointer hover:underline" onClick={onSkip}>
              Skip setup and explore map directly
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}