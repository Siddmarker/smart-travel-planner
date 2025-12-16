'use client';
import { useEffect, useState } from 'react';

interface GoogleMapLoaderProps {
    onLoad: () => void;
    onError: (error: string) => void;
}

export default function GoogleMapLoader({ onLoad, onError }: GoogleMapLoaderProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if Google Maps is already loaded
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            onLoad();
            return;
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            onError('Google Maps API key is missing');
            return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&v=weekly`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            console.log('✅ Google Maps loaded successfully');
            setIsLoaded(true);
            onLoad();
        };

        script.onerror = () => {
            console.error('❌ Failed to load Google Maps');
            onError('Failed to load Google Maps. Please check your API key.');
        };

        document.head.appendChild(script);

        // Cleanup
        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [onLoad, onError]);

    return null;
}
