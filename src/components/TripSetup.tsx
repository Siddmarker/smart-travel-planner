'use client';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CITIES = ['Agra', 'Bengaluru', 'Chennai', 'Coorg', 'Delhi', 'Goa', 'Jaipur', 'Kerala', 'Manali', 'Mumbai', 'Wayanad'];
const DIETS = [{ id: 'VEG', label: '🥗 Veg' }, { id: 'NON_VEG', label: '🍗 Non-Veg' }];

interface TripSetupProps {
  onComplete: (details: any) => void;
  onSkip: () => void;
}

export default function TripSetup({ onComplete, onSkip }: TripSetupProps) {
  const [days, setDays] = useState(3);
  const [groupType, setGroupType] = useState('SOLO');
  const [travelers, setTravelers] = useState(1);
  const [diet, setDiet] = useState('VEG');
  const [citySearch, setCitySearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ... (Keep your existing City Search logic here) ...
  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  const handleStart = async () => {
    if (!citySearch) return alert("Please select a city!");
    setLoading(true);

    try {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to create a trip");

      // 2. Create Trip in DB
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

      // 3. Add Creator as ADMIN
      const { error: memberError } = await supabase
        .from('trip_members')
        .insert([{
          trip_id: trip.id,
          user_id: user.id,
          email: user.email,
          role: 'ADMIN' // <--- SPECIAL PRIVILEGE
        }]);

      if (memberError) throw memberError;

      // 4. Pass Data to Main App
      onComplete({ 
        tripId: trip.id, // We now have a Real ID!
        city: citySearch, 
        type: groupType, 
        days, travelers, diet,
        isAdmin: true
      });

    } catch (error: any) {
      alert("Error creating trip: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8 space-y-6">
        <h2 className="text-2xl font-black text-center">Plan Your Journey</h2>
        
        {/* CITY INPUT */}
        <div className="relative">
           <label className="text-xs font-bold text-gray-400">Where to?</label>
           <input 
             value={citySearch} 
             onChange={(e) => { setCitySearch(e.target.value); setIsDropdownOpen(true); }}
             className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200" 
             placeholder="Search City..."
           />
           {isDropdownOpen && filteredCities.length > 0 && (
              <div className="absolute top-full w-full bg-white shadow-xl border z-10 max-h-40 overflow-auto">
                 {filteredCities.map(c => (
                   <div key={c} onClick={() => { setCitySearch(c); setIsDropdownOpen(false); }} className="p-3 hover:bg-blue-50 cursor-pointer">{c}</div>
                 ))}
              </div>
           )}
        </div>

        {/* CONTROLS (Simplifying for brevity - paste your existing UI controls here) */}
        <div>
           <label className="text-xs font-bold text-gray-400">Duration</label>
           <input type="range" min="1" max="10" value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
           <div className="text-right font-bold text-blue-600">{days} Days</div>
        </div>

        <button 
          onClick={handleStart} 
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all"
        >
          {loading ? "Creating Trip..." : "Start Planning ➔"}
        </button>
      </div>
    </div>
  );
}