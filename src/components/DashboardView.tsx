'use client';

// specific props for navigation
interface DashboardProps {
  onPlanTrip: () => void;
  onDiscovery: () => void; // <--- Added this capability
}

export default function DashboardView({ onPlanTrip, onDiscovery }: DashboardProps) {
  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-8 font-sans">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900">Welcome back, Traveler! 👋</h1>
        <p className="text-gray-500 mt-2">Ready to explore the real India today?</p>
      </div>

      {/* MAIN FEATURES (THE NEW HUB) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        
        {/* CARD 1: MULTI-DAY PLANNER */}
        <div 
          onClick={onPlanTrip}
          className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl">📅</div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-6 text-blue-600">
              ✨
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Trip Planner</h2>
            <p className="text-gray-500 text-sm mb-6">
              Build a complete day-by-day itinerary for your next vacation based on your vibe and group type.
            </p>
            <span className="inline-flex items-center text-blue-600 font-bold text-sm group-hover:gap-2 transition-all">
              Start Planning ➔
            </span>
          </div>
        </div>

        {/* CARD 2: DISCOVERY MODE (NEW) */}
        <div 
          onClick={onDiscovery}
          className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-500 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-9xl">🧭</div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-6 text-purple-600">
              🔭
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Discovery Mode</h2>
            <p className="text-gray-500 text-sm mb-6">
              Find hidden gems, trending cafes, and local attractions near you right now. No itinerary needed.
            </p>
            <span className="inline-flex items-center text-purple-600 font-bold text-sm group-hover:gap-2 transition-all">
              Explore Now ➔
            </span>
          </div>
        </div>

      </div>

      {/* USER STATS (Moved down) */}
      <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-4">Your Travel Stats</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="text-2xl">🌏</div>
          <div><p className="text-2xl font-black text-gray-900">12</p><p className="text-xs text-gray-400 font-bold">Trips Taken</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="text-2xl">⛺</div>
          <div><p className="text-2xl font-black text-gray-900">47</p><p className="text-xs text-gray-400 font-bold">Places Saved</p></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4">
          <div className="text-2xl">🔥</div>
          <div><p className="text-2xl font-black text-gray-900">Level 3</p><p className="text-xs text-gray-400 font-bold">Explorer Rank</p></div>
        </div>
      </div>

    </div>
  );
}