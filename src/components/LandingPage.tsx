'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    // CHANGE IS HERE: h-full w-full overflow-y-auto (Enables scrolling inside the locked layout)
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900 font-sans">
      
      {/* NAVBAR */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            2wards India
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-black transition-colors">
                Log In
              </button>
            </Link>
            <Link href="/login">
              <button className="px-6 py-2.5 text-sm font-bold bg-black text-white rounded-full hover:scale-105 transition-transform shadow-lg">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6 border border-blue-100">
            ✨ AI-Powered Authentic Travel
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight tracking-tight">
            Discover the India <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Guidebooks Miss.
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop visiting tourist traps. Our AI curates personalized, authentic itineraries based on your vibe—whether you're solo, with family, or trekking with friends.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-blue-700 transition-all w-full sm:w-auto">
                Plan My Free Trip ➔
              </button>
            </Link>
            <button className="px-8 py-4 bg-gray-50 text-gray-700 rounded-full font-bold text-lg border border-gray-200 hover:bg-gray-100 transition-all w-full sm:w-auto">
              View Sample Itinerary
            </button>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🧞‍♂️', title: 'AI Curator', desc: 'Tell us your vibe, and we build a day-by-day plan instantly.' },
              { icon: '📍', title: 'Hidden Gems', desc: 'We verify every spot for authenticity. No fake tourist traps.' },
              { icon: '🤝', title: 'Smart Routing', desc: 'Our algorithm optimizes travel time so you see more.' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-12">Loved by Modern Travelers</h2>
        <div className="flex flex-wrap justify-center gap-6">
          <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center font-bold text-gray-500">A</div>
          <div className="w-12 h-12 rounded-full bg-blue-200 border-2 border-white shadow-md flex items-center justify-center font-bold text-blue-500">B</div>
          <div className="w-12 h-12 rounded-full bg-purple-200 border-2 border-white shadow-md flex items-center justify-center font-bold text-purple-500">C</div>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 font-bold text-xs text-gray-500 border-2 border-white shadow-md">
            +2k
          </div>
        </div>
      </section>

      {/* FOOTER PADDING */}
      <div className="h-20 bg-white"></div>

    </div>
  );
}