'use client';
import { useEffect, useRef, useState } from 'react';
import GoogleMapLoader from './GoogleMapLoader';

interface SafeMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
    className?: string;
}

export default function SafeMap({ center, zoom = 12, className }: SafeMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initializeMap = () => {
        if (!mapRef.current || !window.google) {
            setError('Map container or Google Maps not available');
            return;
        }

        try {
            const newMap = new google.maps.Map(mapRef.current, {
                center,
                zoom,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'on' }]
                    }
                ]
            });

            setMap(newMap);
            setError(null);
        } catch (err) {
            console.error('Map initialization error:', err);
            setError('Failed to initialize map');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className={className} style={{
                background: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                border: '1px solid #dee2e6'
            }}>
                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                    <div>🗺️</div>
                    <p>Map unavailable</p>
                    <small>{error}</small>
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <GoogleMapLoader
                onLoad={initializeMap}
                onError={setError}
            />

            {isLoading && (
                <div style={{
                    background: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px'
                }}>
                    <div>Loading map...</div>
                </div>
            )}

            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '400px',
                    display: isLoading ? 'none' : 'block'
                }}
            />
        </div>
    );
}
