'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// --- 1. SETUP SUPABASE FOR BLOGS ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: any };
  rating?: number;
  user_ratings_total?: number;
  photos?: any[];
  types?: string[];
  price_level?: number;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  excerpt: string;
  created_at: string;
}

interface DiscoveryViewProps {
  onAddToTrip: (place: any) => void;
  onBack: () => void;
  initialCity: string;
}

// --- CATEGORIES ---
const CATEGORIES = [
  { id: 'tourist_attraction', label: '🎡 Attractions' },
  { id: 'trekking', label: '🥾 Trekking & Trails' },
  { id: 'local_market', label: '🌸 Santhe / Markets' },
  { id: 'trending', label: '🔥 Trending' },
  { id: 'iconic', label: '💎 Legendary Spots' },
  { id: 'late_night', label: '🌙 Late Night / 4AM' },
  { id: 'restaurant', label: '🍽️ Restaurants' },
  { id: 'cafe', label: '☕ Cafes' },
  { id: 'lodging', label: '🏨 Hotels & Stays' },
  { id: 'amusement_park', label: '🎢 Theme Parks' },
  { id: 'off_roading', label: '🏍️ Off-Roading' },
  { id: 'turf', label: '⚽ Turfs' },
  { id: 'shopping_mall', label: '🛍️ Shopping' },
  { id: 'park', label: '🌳 Parks' }
];

export default function DiscoveryView({ onAddToTrip, onBack, initialCity }: DiscoveryViewProps) {
  // STATE
  const [currentCity, setCurrentCity] = useState(initialCity || 'Bangalore');
  const [cityCoords, setCityCoords] = useState<google.maps.LatLng | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tourist_attraction');
  const [radius, setRadius] = useState(20000); // Default 20km

  // RESULTS
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  // BLOGS STATE
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(true);

  // REFS
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // 1. INITIALIZE GOOGLE MAPS & FETCH BLOGS
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      const mapDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(mapDiv);
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    fetchBlogs();

    if (initialCity) {
      setSearchTerm(initialCity);
      geocodeAndSearch(initialCity);
    }
  }, [initialCity]);

  // --- 2. FETCH BLOGS FUNCTION ---
  async function fetchBlogs() {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data) setBlogs(data);
    setBlogsLoading(false);
  }

  // --- 3. GEOCODING HELPER ---
  const geocodeAndSearch = (cityName: string) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ address: cityName }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCityCoords(location);
        performSearch(cityName, activeCategory, location);
      } else {
        performSearch(cityName, activeCategory, null);
      }
    });
  };

  // --- 4. SEARCH LOGIC ---
  const performSearch = (city: string, category: string, location: google.maps.LatLng | null) => {
    if (!placesServiceRef.current) return;
    setLoading(true);

    let query = '';

    if (location) {
      // --- SMART RADIUS MODE ---
      switch (category) {
        case 'trekking': query = `hiking trails hills viewpoints nature`; break;
        case 'local_market': query = `flower market vegetable market bazaar santhe`; break;
        case 'off_roading': query = `off road trails dirt tracks`; break;
        case 'iconic': query = `legendary oldest famous restaurants`; break;
        case 'late_night': query = `late night food open 24 hours`; break;
        case 'trending': query = `popular tourist attractions`; break;
        default: query = category.replace('_', ' '); break;
      }
    } else {
      // --- FALLBACK TEXT MODE ---
      switch (category) {
        case 'trekking': query = `hiking trails hills peaks near ${city}`; break;
        case 'local_market': query = `market santhe bazaar in ${city}`; break;
        case 'off_roading': query = `off road trails near ${city}`; break;
        default: query = `${category.replace('_', ' ')} in ${city}`; break;
      }
    }

    const request: google.maps.places.TextSearchRequest = {
      query: query,
      ...(location && { location: location, radius: radius }),
    };

    placesServiceRef.current.textSearch(request, (places, status) => {
      setLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && places) {

        // --- FILTERING LOGIC (FIXED TYPESCRIPT ERROR) ---
        const filtered = places.filter(place => {
          const types = place.types || [];

          // FIX: Handle undefined name safely
          const name = (place.name || '').toLowerCase();

          // 1. Remove Agencies & Booking Offices
          if (types.includes('travel_agency')) return false;
          if (name.includes('travels') || name.includes('holidays') || name.includes('tours &')) return false;

          // 2. Trekking Specific Cleanups
          if (category === 'trekking') {
            if (types.includes('store') || types.includes('shopping_mall')) return false;
          }

          return true;
        });

        setResults(filtered as Place[]);
      } else {
        setResults([]);
      }
    });
  };

  // Handle Input Changes
  const handleCityInput = (e: any) => setSearchTerm(e.target.value);
  const handleRadiusChange = (e: any) => {
    const val = Number(e.target.value) * 1000;
    setRadius(val);
    if (cityCoords) performSearch(currentCity, activeCategory, cityCoords);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      setCurrentCity(searchTerm);
      geocodeAndSearch(searchTerm);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">

      {/* --- HEADER --- */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20 flex-shrink-0">
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div>
            <h2 className="text-xl font-black text-gray-900">Discover {currentCity}</h2>
            <p className="text-xs text-gray-500">Explore {activeCategory.replace('_', ' ')} spots</p>
          </div>
          <button onClick={onBack} className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200">
            ← Back
          </button>
        </div>

        {/* CONTROLS */}
        <div className="px-6 py-4 grid gap-3 md:grid-cols-12 items-center">
          {/* City Input */}
          <div className="md:col-span-5 relative">
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter City..."
              value={searchTerm}
              onChange={handleCityInput}
              onKeyDown={handleKeyDown}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🌍</span>
          </div>

          {/* Radius Slider */}
          <div className="md:col-span-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">Radius: {radius / 1000} km</span>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={radius / 1000}
              onChange={handleRadiusChange}
              className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-3">
            <button
              onClick={() => { setCurrentCity(searchTerm); geocodeAndSearch(searchTerm); }}
              className="w-full bg-black text-white py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
            >
              Search
            </button>
          </div>
        </div>

        {/* CATEGORIES SCROLL */}
        <div className="px-6 pb-4 flex gap-2 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); if (cityCoords) performSearch(currentCity, cat.id, cityCoords); }}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${activeCategory === cat.id ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-12">

        {/* 1. SEARCH RESULTS SECTION */}
        <section>
          {loading ? (
            <div className="text-center py-20 text-gray-400"><div className="animate-spin text-3xl mb-2">⏳</div>Searching...</div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-bold">No results found.</p>
              <p className="text-sm text-gray-400">Try increasing the radius slider or changing the city.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {results.map((place) => (
                <div key={place.place_id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col h-full">
                  <div className="h-40 bg-gray-200 relative">
                    {place.photos?.[0] ? (
                      <img src={place.photos[0].getUrl({ maxWidth: 400 })} className="w-full h-full object-cover" alt={place.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">📷</div>
                    )}
                    {place.rating && (
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-white">
                        ⭐ {place.rating} ({place.user_ratings_total})
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{place.name}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-3">{place.formatted_address}</p>
                    <button
                      onClick={() => window.open(`http://googleusercontent.com/maps.google.com/search?q=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`, '_blank')}
                      className="mt-auto w-full bg-gray-50 text-black py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-colors border border-gray-200"
                    >
                      Get Directions 📍
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2. BLOGS SECTION */}
        <section className="border-t border-gray-200 pt-10">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="font-black text-2xl text-gray-900">Travel Guides & Stories ✍️</h3>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">New</span>
          </div>

          {blogsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse"></div>)}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-dashed">No blogs posted yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <Link
                  key={blog.id}
                  href={`/blog/${blog.slug}`}
                  className="group block bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={blog.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80'}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-[10px] font-bold text-black uppercase tracking-wider">
                      Read
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{blog.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2">{blog.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}