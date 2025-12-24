'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- UPDATED INTERFACE: Added 'onSkip' ---
interface TripSetupProps {
  onComplete: (details: { city: string; type: string; days: number }) => void;
  onSkip: () => void; // <--- This line was missing or not saved!
}

export default function TripSetup({ onComplete, onSkip }: TripSetupProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCity, setSelectedCity] = useState('');
  const [travelerType, setTravelerType] = useState('SOLO');
  const [days, setDays] = useState(2);

  useEffect(() => {
    async function fetchCities() {
      const { data } = await supabase.from('places').select('zone_id');
      if (data) {
        const unique = Array.from(new Set(data.map((item: any) => item.zone_id))).sort();
        setCities(unique);
        if (unique.length > 0) setSelectedCity(unique[0]);
      }
      setLoading(false);
    }
    fetchCities();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ city: selectedCity, type: travelerType, days });
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading destinations...</div>;

  return (
    <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">2wards India</h1>
          <p className="text-gray-500 text-sm">Design your perfect authentic journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Where to?</label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-xl font-bold text-gray-800 outline-none transition-all">
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Who is traveling?</label>
            <div className="grid grid-cols-3 gap-2">
              {['SOLO', 'FAMILY', 'FRIENDS'].map((type) => (
                <button key={type} type="button" onClick={() => setTravelerType(type)} className={`p-3 rounded-xl text-xs font-bold border-2 transition-all ${travelerType === type ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}>{type}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">How many days?</label>
            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl">
              <input type="range" min="1" max="7" value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              <span className="font-black text-blue-600 w-12 text-center">{days} Days</span>
            </div>
          </div>

          <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all text-sm">Start Planning ➔</button>
        
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={onSkip} // Using the new prop here
              className="text-xs text-gray-400 hover:text-black underline font-medium"
            >
              Or just explore the map directly
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}