'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';

// 1. CONSTANTS
const LIBRARIES: ("places")[] = ["places"];

// 2. TYPES
interface TravelMapProps {
  selectedCity?: string;
  activeFilter?: string;
  onAddToTrip?: (place: any) => void;
  tripPlan?: any[];
}

export default function TravelMap({ selectedCity, activeFilter, onAddToTrip, tripPlan = [] }: TravelMapProps) {
  
  // 3. LOAD MAPS API
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  
  // Center Default (India)
  const defaultCenter = useMemo(() => ({ lat: 20.5937, lng: 78.9629 }), []);
  const [center, setCenter] = useState(defaultCenter);

  // 4. GEOCODING (Convert City Name -> Lat/Lng)
  useEffect(() => {
    if (!isLoaded || !selectedCity) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: selectedCity }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCenter({ lat: location.lat(), lng: location.lng() });
        if(map) map.panTo({ lat: location.lat(), lng: location.lng() });
      }
    });
  }, [selectedCity, isLoaded, map]);

  // 5. TURN-BY-TURN NAVIGATION ENGINE
  useEffect(() => {
    if (!isLoaded || !window.google || tripPlan.length < 2) {
      setDirections(null); // Clear route if not enough points
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    // A. Sort points by Schedule (Day 1 Morning -> Day 1 Night)
    const sortedPlaces = [...tripPlan].sort((a, b) => {
       // Simple string sort works for "Day 1 - Morning" vs "Day 1 - Night" usually,
       // but strictly you might want to parse the Day number.
       return a.slot.localeCompare(b.slot);
    });

    const origin = sortedPlaces[0];
    const destination = sortedPlaces[sortedPlaces.length - 1];
    const waypoints = sortedPlaces.slice(1, -1).map(p => ({
       location: { lat: p.lat, lng: p.lng },
       stopover: true
    }));

    // B. Calculate Route
    directionsService.route({
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
      } else {
        console.error("Directions request failed:", status);
      }
    });

  }, [tripPlan, isLoaded]);


  // 6. RENDER
  if (loadError) return <div className="p-10 text-center text-red-500 font-bold bg-red-50">Map Failed to Load (Check Ad Blocker)</div>;
  if (!isLoaded) return <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>;

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        zoom={12}
        center={center}
        mapContainerClassName="w-full h-full"
        onLoad={(map) => setMap(map)}
        options={{
           disableDefaultUI: true,
           zoomControl: true,
           styles: [
             {
               featureType: "poi",
               elementType: "labels",
               stylers: [{ visibility: "off" }], // Hide default Google clutter
             },
           ]
        }}
      >
        {/* A. SHOW THE ROUTE (Blue Line) */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true, // We will draw our own custom markers
              polylineOptions: {
                strokeColor: "#2563EB", // Blue path
                strokeWeight: 5,
                strokeOpacity: 0.7
              }
            }}
          />
        )}

        {/* B. SHOW THE MARKERS (Numbered 1, 2, 3...) */}
        {tripPlan.map((place, index) => (
           <Marker
             key={place.id}
             position={{ lat: place.lat, lng: place.lng }}
             label={{
               text: `${index + 1}`,
               color: "white",
               fontWeight: "bold"
             }}
             onClick={() => setSelectedPlace(place)}
           />
        ))}

        {/* C. INFO WINDOW (When clicked) */}
        {selectedPlace && (
          <InfoWindow
            position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm">{selectedPlace.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{selectedPlace.slot}</p>
              <img src={selectedPlace.image} className="w-full h-24 object-cover rounded-lg mb-2" />
              <button 
                 className="w-full bg-blue-600 text-white text-xs font-bold py-1 rounded"
                 onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`, '_blank')}
              >
                Start Navigation ➔
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* OVERLAY: TRIP STATS */}
      {tripPlan.length > 0 && (
         <div className="absolute top-4 left-4 bg-white p-4 rounded-xl shadow-xl z-10 border border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm">Trip Route</h4>
            <div className="text-xs text-gray-500">
               {tripPlan.length} stops • Estimated Drive: {directions?.routes[0]?.legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0) ? Math.round(directions!.routes[0].legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0) / 60) + ' mins' : 'Calculating...'}
            </div>
         </div>
      )}
    </div>
  );
}