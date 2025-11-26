// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number, address: string) => void;
    initialLat?: number;
    initialLng?: number;
}

export function LocationPicker({ onLocationSelect, initialLat, initialLng }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [marker, setMarker] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initMap = async () => {
            const loader = new Loader({
                apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
                version: 'weekly',
                libraries: ['places']
            });

            try {
                const { Map } = await loader.importLibrary('maps') as any;
                const { Marker } = await loader.importLibrary('marker') as any;
                const { Geocoder } = await loader.importLibrary('geocoding') as any;

                const defaultCenter = { lat: initialLat || 20.5937, lng: initialLng || 78.9629 };

                if (mapRef.current) {
                    const mapInstance = new Map(mapRef.current, {
                        center: defaultCenter,
                        zoom: initialLat ? 15 : 5,
                        mapTypeControl: false,
                        streetViewControl: false,
                    });

                    setMap(mapInstance);

                    // Add click listener
                    mapInstance.addListener('click', async (e: any) => {
                        if (e.latLng) {
                            const lat = e.latLng.lat();
                            const lng = e.latLng.lng();

                            // Update marker
                            if (marker) {
                                marker.setPosition(e.latLng);
                            } else {
                                const newMarker = new Marker({
                                    position: e.latLng,
                                    map: mapInstance,
                                    // animation: google.maps.Animation.DROP // Removed to avoid global reference
                                });
                                setMarker(newMarker);
                            }

                            // Geocode to get address
                            const geocoder = new Geocoder();
                            const response = await geocoder.geocode({ location: { lat, lng } });
                            const address = response.results[0]?.formatted_address || 'Unknown Location';

                            onLocationSelect(lat, lng, address);
                        }
                    });

                    // Initial marker if coords provided
                    if (initialLat && initialLng) {
                        const newMarker = new Marker({
                            position: { lat: initialLat, lng: initialLng },
                            map: mapInstance
                        });
                        setMarker(newMarker);
                    }
                }
            } catch (error) {
                console.error('Error loading map:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initMap();
    }, []);

    return (
        <div className="w-full h-[300px] rounded-md overflow-hidden border relative bg-muted">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                    Loading Map...
                </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 bg-background/90 p-2 rounded text-xs shadow-sm z-10">
                Click on map to pin location
            </div>
        </div>
    );
}
