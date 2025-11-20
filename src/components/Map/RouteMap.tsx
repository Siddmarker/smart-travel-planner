'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Place } from '@/types';
import { RouteSegment } from '@/lib/route-optimizer/optimizer';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for start, end, and waypoints
const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const waypointIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface RouteMapProps {
    startLocation: { lat: number; lng: number };
    segments: RouteSegment[];
    animate?: boolean;
}

function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);

    return null;
}

function AnimatedPolyline({ positions, color }: { positions: [number, number][]; color: string }) {
    const [visiblePositions, setVisiblePositions] = useState<[number, number][]>([]);
    const animationRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setVisiblePositions([]);
        let index = 0;

        const animate = () => {
            if (index < positions.length) {
                setVisiblePositions(positions.slice(0, index + 1));
                index++;
                animationRef.current = setTimeout(animate, 50);
            }
        };

        animate();

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, [positions]);

    return <Polyline positions={visiblePositions} color={color} weight={4} opacity={0.7} />;
}

export function RouteMap({ startLocation, segments, animate = true }: RouteMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground">
                Loading route map...
            </div>
        );
    }

    // Build route path
    const routePath: [number, number][] = [[startLocation.lat, startLocation.lng]];
    const allPositions: [number, number][] = [[startLocation.lat, startLocation.lng]];

    segments.forEach(segment => {
        const toPos: [number, number] = [segment.to.lat, segment.to.lng];
        routePath.push(toPos);
        allPositions.push(toPos);
    });

    // Color segments by distance (green = short, yellow = medium, red = long)
    const maxDistance = Math.max(...segments.map(s => s.distance), 1);
    const getSegmentColor = (distance: number) => {
        const ratio = distance / maxDistance;
        if (ratio < 0.33) return '#22c55e'; // green
        if (ratio < 0.67) return '#eab308'; // yellow
        return '#ef4444'; // red
    };

    return (
        <MapContainer
            center={[startLocation.lat, startLocation.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
        >
            <FitBounds positions={allPositions} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Draw route segments */}
            {animate ? (
                <AnimatedPolyline positions={routePath} color="#3b82f6" />
            ) : (
                segments.map((segment, idx) => {
                    const fromPos: [number, number] = idx === 0
                        ? [startLocation.lat, startLocation.lng]
                        : [segments[idx - 1].to.lat, segments[idx - 1].to.lng];
                    const toPos: [number, number] = [segment.to.lat, segment.to.lng];

                    return (
                        <Polyline
                            key={idx}
                            positions={[fromPos, toPos]}
                            color={getSegmentColor(segment.distance)}
                            weight={4}
                            opacity={0.7}
                        />
                    );
                })
            )}

            {/* Start marker */}
            <Marker position={[startLocation.lat, startLocation.lng]} icon={startIcon}>
                <Popup>
                    <div className="font-semibold">Start Location</div>
                </Popup>
            </Marker>

            {/* Waypoint markers */}
            {segments.map((segment, idx) => {
                const isLast = idx === segments.length - 1;
                const icon = isLast ? endIcon : waypointIcon;
                const number = idx + 1;

                return (
                    <Marker
                        key={segment.to.id}
                        position={[segment.to.lat, segment.to.lng]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="min-w-[200px]">
                                <div className="font-semibold text-base mb-2">
                                    {number}. {segment.to.name}
                                </div>
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Distance:</span>
                                        <span className="font-medium">{segment.distance.toFixed(1)} km</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Travel Time:</span>
                                        <span className="font-medium">{segment.duration} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Mode:</span>
                                        <span className="font-medium capitalize">{segment.mode}</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
