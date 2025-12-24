'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const containerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const ICONS = {
  STAY: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  FOOD: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  ACTIVITY: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  DEFAULT: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
};

const SLOT_ORDER = { 'MORNING': 1, 'LUNCH': 2, 'AFTERNOON': 3, 'DINNER': 4, 'NIGHT': 5 };

export default function TravelMap({ 
  selectedCity, activeFilter, onAddToTrip, tripPlan = [] 
}: { 
  selectedCity: string, activeFilter: string, onAddToTrip: (place: any) => void, tripPlan?: any[] 
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    async function fetchPlaces() {
      // Ensure we fetch the 'images' or 'image_url' column
      const { data } = await supabase.from('places').select('*').eq('zone_id', selectedCity);
      if (data && data.length > 0) {
        setPlaces(data);
        if (map) {
          map.panTo({ lat: data[0].lat, lng: data[0].lng });
          map.setZoom(12);
        }
      }
    }
    fetchPlaces();
  }, [selectedCity, map]);

  const placesToShow = useMemo(() => {
    return places.filter((place) => {
      const matchesFilter = activeFilter === 'ALL' || place.vibes?.includes(activeFilter);
      const isInTrip = tripPlan.some(p => p.id === place.id);
      return matchesFilter || isInTrip;
    });
  }, [places, activeFilter, tripPlan]);

  const sortedTrip = useMemo(() => {
    return [...tripPlan].sort((a, b) => {
      const orderA = SLOT_ORDER[a.slot as keyof typeof SLOT_ORDER] || 99;
      const orderB = SLOT_ORDER[b.slot as keyof typeof SLOT_ORDER] || 99;
      return orderA - orderB;
    });
  }, [tripPlan]);

  const routePath = useMemo(() => {
    return sortedTrip.map(place => ({ lat: place.lat, lng: place.lng }));
  }, [sortedTrip]);

  const onLoad = useCallback((map: google.maps.Map) => setMap(map), []);
  const onUnmount = useCallback(() => setMap(null), []);

  if (!isLoaded) return <div className="p-10 text-center">Loading Maps...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={5}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{ disableDefaultUI: false, streetViewControl: false, mapTypeControl: false }}
    >
      {routePath.length > 1 && (
        <Polyline
          path={routePath}
          options={{ strokeColor: '#2563EB', strokeOpacity: 0.8, strokeWeight: 4, geodesic: true }}
        />
      )}

      {placesToShow.map((place) => {
        const tripIndex = sortedTrip.findIndex(p => p.id === place.id);
        const isInTrip = tripIndex !== -1;

        return (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            onClick={() => setSelectedPlace(place)}
            label={isInTrip ? { text: (tripIndex + 1).toString(), color: "white", fontWeight: "bold" } : undefined}
            zIndex={isInTrip ? 100 : 1}
            icon={isInTrip ? undefined : (
               place.type === 'STAY' ? ICONS.STAY :
               place.type === 'FOOD' ? ICONS.FOOD :
               place.type === 'ACTIVITY' ? ICONS.ACTIVITY :
               ICONS.DEFAULT
            )}
            opacity={tripPlan.length > 0 && !isInTrip ? 0.4 : 1} 
          />
        );
      })}

      {selectedPlace && (
        <InfoWindow
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
          onCloseClick={() => setSelectedPlace(null)}
        >
          <div className="p-0 max-w-[280px] text-black font-sans overflow-hidden rounded-lg">
             
             {/* --- NEW: IMAGE SECTION --- */}
             <div className="w-full h-32 bg-gray-200 relative">
               <img 
                 src={selectedPlace.image_url || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400&auto=format&fit=crop'} 
                 alt={selectedPlace.name}
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   // Fallback if image link is broken
                   (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400&auto=format&fit=crop';
                 }}
               />
               <span className="absolute bottom-2 right-2 bg-white/90 px-2 py-0.5 text-[10px] font-bold rounded shadow-sm">
                 {selectedPlace.type}
               </span>
             </div>

             <div className="p-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-base leading-tight">{selectedPlace.name}</h3>
                    {selectedPlace.authenticity_score > 80 && (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {selectedPlace.authenticity_score}% REAL
                      </span>
                    )}
                </div>
                <p className="text-xs text-gray-600 mb-3">{selectedPlace.description}</p>
                
                <button 
                  onClick={() => { onAddToTrip(selectedPlace); setSelectedPlace(null); }}
                  className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded shadow hover:bg-blue-700 transition-all mb-2"
                >
                  + Add to Trip
                </button>

                <div className="flex flex-wrap gap-1">
                  {selectedPlace.vibes?.slice(0, 3).map((vibe: string) => (
                    <span key={vibe} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      {vibe}
                    </span>
                  ))}
                </div>
             </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}