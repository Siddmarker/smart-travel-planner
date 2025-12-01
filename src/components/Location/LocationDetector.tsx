'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Edit2, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface LocationData {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
    source?: string;
    city?: string;
    region?: string;
    country?: string;
}

interface LocationDetectorProps {
    onLocationDetected: (location: LocationData) => void;
}

export function LocationDetector({ onLocationDetected }: LocationDetectorProps) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [permission, setPermission] = useState<PermissionState>('prompt');

    // Check browser permissions first
    useEffect(() => {
        checkLocationPermission();
        // Try to load from local storage on mount
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
            try {
                const parsed = JSON.parse(savedLocation);
                setLocation(parsed);
                onLocationDetected(parsed);
            } catch (e) {
                console.error('Failed to parse saved location', e);
            }
        }
    }, [onLocationDetected]);

    const checkLocationPermission = async () => {
        try {
            // Check if browser supports permissions API
            if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                setPermission(permissionStatus.state);

                permissionStatus.onchange = () => {
                    setPermission(permissionStatus.state);
                };
            }
        } catch (err) {
            console.warn('Permission API not supported:', err);
        }
    };

    // Enhanced location detection with multiple fallbacks
    const detectLocation = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Method 1: Use browser's geolocation API
            const position = await getCurrentPositionWithTimeout();

            const userLocation: LocationData = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
                source: 'browser_geolocation'
            };

            setLocation(userLocation);
            localStorage.setItem('userLocation', JSON.stringify(userLocation));
            onLocationDetected(userLocation);

            return userLocation;

        } catch (geolocationError) {
            console.warn('Geolocation failed:', geolocationError);

            // Method 2: Try IP-based location as fallback
            try {
                const ipLocation = await getLocationFromIP();

                if (ipLocation) {
                    const fallbackLocation: LocationData = {
                        lat: ipLocation.latitude,
                        lng: ipLocation.longitude,
                        accuracy: 50000, // IP location is less accurate
                        source: 'ip_based',
                        city: ipLocation.city,
                        region: ipLocation.region,
                        country: ipLocation.country
                    };

                    setLocation(fallbackLocation);
                    localStorage.setItem('userLocation', JSON.stringify(fallbackLocation));
                    onLocationDetected(fallbackLocation);

                    return fallbackLocation;
                }
            } catch (ipError) {
                console.warn('IP location failed:', ipError);
            }

            // Method 3: Use user's last known location
            const lastLocation = localStorage.getItem('userLocation');
            if (lastLocation) {
                try {
                    const parsedLocation = JSON.parse(lastLocation);
                    setLocation(parsedLocation);
                    onLocationDetected(parsedLocation);
                    return parsedLocation;
                } catch (e) {
                    console.error('Failed to parse last location', e);
                }
            }

            // All methods failed
            setError('Unable to detect your location. Please enter it manually.');
            showManualLocationInput();

        } finally {
            setIsLoading(false);
        }
    };

    // Improved geolocation with timeout and better error handling
    const getCurrentPositionWithTimeout = (timeout = 10000): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            let timeoutId: NodeJS.Timeout;

            const success = (position: GeolocationPosition) => {
                clearTimeout(timeoutId);
                resolve(position);
            };

            const error = (err: GeolocationPositionError) => {
                clearTimeout(timeoutId);

                const errorMessages: Record<number, string> = {
                    1: 'Location access denied. Please enable location permissions.',
                    2: 'Location unavailable. Please check your network connection.',
                    3: 'Location request timed out. Please try again.',
                };

                reject(new Error(errorMessages[err.code] || 'Unable to get location'));
            };

            const options = {
                enableHighAccuracy: true,
                timeout: timeout,
                maximumAge: 300000 // 5 minutes
            };

            timeoutId = setTimeout(() => {
                reject(new Error('Location request timed out'));
            }, timeout);

            navigator.geolocation.getCurrentPosition(success, error, options);
        });
    };

    // IP-based location fallback
    const getLocationFromIP = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            if (!response.ok) throw new Error('IP location failed');

            const data = await response.json();
            return {
                latitude: data.latitude,
                longitude: data.longitude,
                city: data.city,
                region: data.region,
                country: data.country_name,
                ip: data.ip
            };
        } catch (error) {
            console.error('IP location error:', error);
            return null;
        }
    };

    // Manual location input
    const showManualLocationInput = () => {
        const city = prompt('Please enter your city or location:');
        if (city) {
            // In a real app, we would geocode this. For now, we'll just simulate it or ask for coords?
            // Or better, redirect to a search page.
            // For this implementation, we'll just log it as we don't have a geocoder set up in this file yet.
            console.log('Manual location entered:', city);
            // Ideally call a geocoding service here
        }
    };

    return (
        <div className="bg-card border rounded-lg p-4 shadow-sm my-4">
            {isLoading ? (
                <div className="flex items-center justify-center gap-3 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-muted-foreground">Detecting your location...</p>
                </div>
            ) : location ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <MapPin className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">Location set</p>
                            <p className="text-xs text-muted-foreground">
                                {location.city ? `${location.city}, ${location.country}` :
                                    `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`}
                            </p>
                            {location.accuracy && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    Accuracy: ~{Math.round(location.accuracy)}m
                                </p>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setLocation(null)} className="text-xs">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Change
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={detectLocation} className="flex-1">
                        <Navigation className="mr-2 h-4 w-4" />
                        Detect My Location
                    </Button>
                    <Button variant="outline" onClick={showManualLocationInput} className="flex-1">
                        <Edit2 className="mr-2 h-4 w-4" />
                        Enter Manually
                    </Button>
                </div>
            )}

            {error && (
                <Alert variant="destructive" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
}
