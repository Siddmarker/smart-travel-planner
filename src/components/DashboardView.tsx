'use client';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (for Logout)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DashboardProps {
  onPlanTrip: () => void;
  onDiscovery: () => void;
}

export default function DashboardView({ onPlanTrip, onDiscovery }: DashboardProps) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-8 font-sans">
      
      {/* HEADER WITH LOGOUT */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Welcome back, Traveler! 👋</h1>
          <p className="text-gray-500 mt-2">Ready to explore the real India today?</p>
        </div>
        
        {/* New Profile/Logout Section */}
        <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-gray-100">
           <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
           </div>
           <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-700">
             Logout
           </button>
        </div>
      </div>

      {/* ... (Keep the rest of your Cards/Grid code exactly the same) ... */}
      
      {/* MAIN FEATURES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
         {/* ... (Your Card 1 and Card 2 code from before) ... */}
         <div onClick={onPlanTrip} className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl">📅</div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-6 text-blue-600">✨</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Trip Planner</h2>
                <p className="text-gray-500 text-sm mb-6">Build a complete day-by-day itinerary.</p>
                <span className="text-blue-600 font-bold text-sm">Start Planning ➔</span>
            </div>
         </div>

         <div onClick={onDiscovery} className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-500 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl">🧭</div>
            <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-6 text-purple-600">🔭</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Discovery Mode</h2>
                <p className="text-gray-500 text-sm mb-6">Find hidden gems and real-time places.</p>
                <span className="text-purple-600 font-bold text-sm">Explore Now ➔</span>
            </div>
         </div>
      </div>
      
      {/* ... (Your Stats section) ... */}
      
    </div>
  );
}