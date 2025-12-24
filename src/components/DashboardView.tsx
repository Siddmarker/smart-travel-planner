'use client';

export default function DashboardView({ onCreateTrip }: { onCreateTrip: () => void }) {
  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-8">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Welcome back, Traveler! 👋</h1>
        <p className="text-gray-500 mt-2">Here is a summary of your authentic journeys.</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-2">🌏</div>
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Total Trips</h3>
          <p className="text-3xl font-black text-blue-600">12</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-2">⛺</div>
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Hidden Gems Found</h3>
          <p className="text-3xl font-black text-purple-600">47</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-4xl mb-2">🔥</div>
          <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider">Travel Streak</h3>
          <p className="text-3xl font-black text-orange-500">3 Months</p>
        </div>
      </div>

      {/* RECENT HISTORY */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Memories</h2>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
        {[
          { city: 'Coorg', date: 'Oct 2023', type: 'SOLO', img: 'https://images.unsplash.com/photo-1596328892606-44b70503f56e?q=80&w=200&auto=format&fit=crop' },
          { city: 'Varkala', date: 'Aug 2023', type: 'FRIENDS', img: 'https://images.unsplash.com/photo-1588267246284-48616198df49?q=80&w=200&auto=format&fit=crop' },
          { city: 'Udaipur', date: 'Dec 2022', type: 'FAMILY', img: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?q=80&w=200&auto=format&fit=crop' },
        ].map((trip, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            <img src={trip.img} className="w-16 h-16 rounded-lg object-cover" alt={trip.city} />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">{trip.city} Trip</h4>
              <p className="text-xs text-gray-400">{trip.date}</p>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
              {trip.type}
            </span>
          </div>
        ))}
      </div>

      {/* CALL TO ACTION */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-bold mb-1">Ready for your next adventure?</h2>
          <p className="text-white/80 text-sm">Let AI curate your perfect itinerary.</p>
        </div>
        <button 
          onClick={onCreateTrip}
          className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-md"
        >
          Plan New Trip ➔
        </button>
      </div>
    </div>
  );
}