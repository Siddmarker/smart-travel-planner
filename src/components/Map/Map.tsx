'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Place } from '@/types';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
    center: [number, number] | { lat: number; lng: number; name?: string };
    zoom: number;
    places?: Place[];
    markers?: Array<{
        id: string;
        lat: number;
        lng: number;
        title: string;
    }>;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export default function Map({ center, zoom, places = [], markers = [] }: MapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                Loading map...
            </div>
        );
    }

    // Convert center to tuple format if it's an object
    const centerCoords: [number, number] = Array.isArray(center)
        ? center
        : [center.lat, center.lng];

    // Convert places to markers
    const placeMarkers = places.map(place => ({
        id: place.id,
        lat: place.lat,
        lng: place.lng,
        title: place.name
    }));

    const allMarkers = [...placeMarkers, ...markers];

    return (
        <MapContainer
            center={centerCoords}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <ChangeView center={centerCoords} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {allMarkers.map((marker) => (
                <Marker key={marker.id} position={[marker.lat, marker.lng]}>
                    <Popup>{marker.title}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

