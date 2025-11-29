import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTrendingOffRoadTrails } from '@/services/offRoadAI';
import { applyOffRoadFiltration } from '@/utils/offRoadFiltration';
import OffRoadingResults from './OffRoadingResults';
import './OffRoading.css';

// Mock function for discovering trails (replace with real API call)
async function discoverOffRoadTrails(params: any) {
    // In a real app, this would call Google Places API or similar
    // For now, we'll return empty and rely on trending trails
    return [];
}

// Mock function for geocoding (replace with real API call)
async function geocodeLocation(address: string) {
    // Mock coordinates for demo
    return { lat: 12.9716, lng: 77.5946 }; // Bangalore
}

export default function OffRoadingSearch() {
    const { user } = useAuth();
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchParams, setSearchParams] = useState({
        maxDistance: 50, // km
        difficulty: 'intermediate',
        terrain: [] as string[],
        duration: '4-6 hours',
        season: 'all-season'
    });
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [trails, setTrails] = useState<any[]>([]);
    const [trendingTrails, setTrendingTrails] = useState<any[]>([]);

    // Get user's current location
    const getUserLocation = () => {
        setIsLoadingLocation(true);

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    setIsLoadingLocation(false);
                    // Auto-search when location is obtained
                    searchTrails(location);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setIsLoadingLocation(false);
                    // Fallback to manual location input
                    // showManualLocationInput(); // Logic handled in UI
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            setIsLoadingLocation(false);
        }
    };

    // Search for trails based on parameters
    const searchTrails = async (location = userLocation) => {
        if (!location) {
            alert('Please allow location access or enter your location');
            return;
        }

        try {
            const results = await discoverOffRoadTrails({
                location,
                maxDistance: searchParams.maxDistance,
                difficulty: searchParams.difficulty,
                terrain: searchParams.terrain,
                duration: searchParams.duration
            });

            // Apply advanced filtration to remove agencies/commercial entities
            const filteredTrails = applyOffRoadFiltration(results);
            setTrails(filteredTrails);

            // Get trending trails from AI/social media
            const trending = await fetchTrendingOffRoadTrails(location);
            setTrendingTrails(trending);
        } catch (error) {
            console.error('Error searching trails:', error);
        }
    };

    return (
        <div className="offroading-search">
            {/* Header */}
            <div className="search-header">
                <div className="category-badge">
                    <span className="badge-emoji">🏍️</span>
                    <span>Off-Roading Adventures</span>
                </div>
                <h1>Find Epic Bike Trails Near You</h1>
                <p>Discover hidden off-road trails and adrenaline-pumping routes</p>
            </div>

            {/* Location & Search Card */}
            <div className="search-card">
                <div className="location-section">
                    <div className="location-header">
                        <h3>📍 Your Starting Point</h3>
                        {!userLocation && (
                            <button
                                className="location-btn primary"
                                onClick={getUserLocation}
                                disabled={isLoadingLocation}
                            >
                                {isLoadingLocation ? 'Getting Location...' : 'Use My Current Location'}
                            </button>
                        )}
                    </div>

                    {userLocation && (
                        <div className="location-confirmed">
                            <span className="location-text">
                                📍 Location set • {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                            </span>
                            <button
                                className="location-change"
                                onClick={() => setUserLocation(null)}
                            >
                                Change
                            </button>
                        </div>
                    )}

                    {/* Manual Location Input */}
                    <div className="manual-location">
                        <input
                            type="text"
                            placeholder="Or enter your city, address, or landmark..."
                            className="location-input"
                            onBlur={(e) => {
                                if (e.target.value) {
                                    geocodeLocation(e.target.value).then(setUserLocation);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Search Parameters */}
                <div className="search-params">
                    {/* Max Distance Slider */}
                    <div className="param-group">
                        <label className="param-label">
                            🚀 Max Distance: <strong>{searchParams.maxDistance} km</strong>
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="200"
                            step="5"
                            value={searchParams.maxDistance}
                            onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                maxDistance: parseInt(e.target.value)
                            }))}
                            className="distance-slider"
                        />
                        <div className="distance-markers">
                            <span>10km</span>
                            <span>50km</span>
                            <span>100km</span>
                            <span>200km</span>
                        </div>
                    </div>

                    {/* Difficulty Level */}
                    <div className="param-group">
                        <label className="param-label">💪 Difficulty Level</label>
                        <div className="difficulty-options">
                            {['beginner', 'intermediate', 'expert', 'extreme'].map(level => (
                                <button
                                    key={level}
                                    className={`difficulty-btn ${searchParams.difficulty === level ? 'active' : ''}`}
                                    onClick={() => setSearchParams(prev => ({ ...prev, difficulty: level }))}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Terrain Types */}
                    <div className="param-group">
                        <label className="param-label">🏞️ Terrain Types</label>
                        <div className="terrain-chips">
                            {['mountain', 'forest', 'desert', 'mud', 'sand', 'rocky'].map(terrain => (
                                <label key={terrain} className="terrain-chip">
                                    <input
                                        type="checkbox"
                                        checked={searchParams.terrain.includes(terrain)}
                                        onChange={(e) => {
                                            const newTerrain = e.target.checked
                                                ? [...searchParams.terrain, terrain]
                                                : searchParams.terrain.filter(t => t !== terrain);
                                            setSearchParams(prev => ({ ...prev, terrain: newTerrain }));
                                        }}
                                    />
                                    <span className="chip-label">
                                        {terrain === 'mountain' && '⛰️'}
                                        {terrain === 'forest' && '🌲'}
                                        {terrain === 'desert' && '🏜️'}
                                        {terrain === 'mud' && '🛤️'}
                                        {terrain === 'sand' && '🏖️'}
                                        {terrain === 'rocky' && '🪨'}
                                        {terrain}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="param-group">
                        <label className="param-label">⏱️ Trip Duration</label>
                        <select
                            value={searchParams.duration}
                            onChange={(e) => setSearchParams(prev => ({ ...prev, duration: e.target.value }))}
                            className="duration-select"
                        >
                            <option value="2-4 hours">2-4 hours (Half Day)</option>
                            <option value="4-6 hours">4-6 hours (Full Morning/Afternoon)</option>
                            <option value="full day">Full Day Adventure</option>
                        </select>
                    </div>
                </div>

                {/* Search Action */}
                <div className="search-actions">
                    <button
                        className="search-trails-btn"
                        onClick={() => searchTrails()}
                        disabled={!userLocation}
                    >
                        🏍️ Find Off-Road Trails
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {(trails.length > 0 || trendingTrails.length > 0) && (
                <OffRoadingResults
                    trails={trails}
                    trendingTrails={trendingTrails}
                    userLocation={userLocation || { lat: 0, lng: 0 }}
                    searchParams={searchParams}
                />
            )}
        </div>
    );
}
