'use client';
import { useEffect, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { createClient } from '@supabase/supabase-js';
import 'mapbox-gl/dist/mapbox-gl.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TravelMap() {
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    async function fetchPlaces() {
      // Now fetching the new 'authenticity_score' too!
      const { data } = await supabase
        .from('places')
        .select('*')
        .limit(100); // Safety limit for now
      
      if (data) setPlaces(data);
    }
    fetchPlaces();
  }, []);

  return (
    <div className="h-screen w-full relative">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 78.9629, // India Center
          latitude: 20.5937,
          zoom: 4
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {places.map((place) => (
          <Marker 
            key={place.id} 
            longitude={place.lng} 
            latitude={place.lat}
            // Logic: Purple for Stays, Orange for Food, Blue for others
            color={
              place.type === 'STAY' ? '#8e44ad' : 
              place.type === 'FOOD' ? '#FF5733' : 
              '#3388FF'
            }
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedPlace(place);
            }}
          />
        ))}

        {selectedPlace && (
          <Popup
            longitude={selectedPlace.lng}
            latitude={selectedPlace.lat}
            onClose={() => setSelectedPlace(null)}
            closeButton={true}
            closeOnClick={false}
            offset={15}
            maxWidth="300px"
          >
            <div className="p-3">
              {/* HEADER: Name + Authenticity Badge */}
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-lg leading-tight">{selectedPlace.name}</h3>
                {selectedPlace.authenticity_score > 80 && (
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 shrink-0">
                    {selectedPlace.authenticity_score}% AUTHENTIC
                  </span>
                )}
              </div>

              {/* DESCRIPTION */}
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {selectedPlace.description}
              </p>

              {/* VIBE TAGS */}
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedPlace.vibes?.slice(0, 4).map((vibe: string) => (
                  <span key={vibe} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase tracking-wide">
                    {vibe}
                  </span>
                ))}
              </div>

              {/* PRICE TIER */}
              <div className="text-xs font-semibold text-gray-500 mt-2 border-t pt-2 flex justify-between">
                <span>{selectedPlace.type}</span>
                <span>{selectedPlace.price_tier || 'N/A'}</span>
              </div>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Floating Legend */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-md text-xs z-10">
        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-[#8e44ad]"></span> Stays</div>
        <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-[#FF5733]"></span> Food</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#3388FF]"></span> Activities</div>
      </div>
    </div>
  );
}