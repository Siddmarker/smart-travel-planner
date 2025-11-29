import { useState } from 'react';
import { Place } from '@/types';
import './OffRoading.css';

interface Trail extends Place {
    trendingScore?: number;
    terrain?: string[];
    length?: number;
    duration?: string;
    elevation?: number;
    difficulty: 'beginner' | 'intermediate' | 'expert' | 'extreme';
}

interface OffRoadingResultsProps {
    trails: Trail[];
    trendingTrails: Trail[];
    userLocation: { lat: number; lng: number };
    searchParams: {
        maxDistance: number;
        difficulty: string;
        terrain: string[];
        duration: string;
        season: string;
    };
}

export default function OffRoadingResults({ trails, trendingTrails, userLocation, searchParams }: OffRoadingResultsProps) {
    const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    return (
        <div className="offroading-results">
            {/* Results Header */}
            <div className="results-header">
                <div className="results-stats">
                    <h2>
                        Found {trails.length} Off-Road Trails
                        within {searchParams.maxDistance}km
                    </h2>
                    {trendingTrails.length > 0 && (
                        <div className="trending-badge">
                            🔥 {trendingTrails.length} Trending Trails
                        </div>
                    )}
                </div>

                <div className="view-controls">
                    <button
                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        📋 List
                    </button>
                    <button
                        className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                        onClick={() => setViewMode('map')}
                    >
                        🗺️ Map
                    </button>
                </div>
            </div>

            {/* Main Results Grid */}
            <div className="results-container">
                {viewMode === 'list' ? (
                    <div className="results-grid">
                        {/* Regular Trails */}
                        <div className="trails-section">
                            <h3>🎯 Matching Trails</h3>
                            <div className="trails-grid">
                                {trails.map(trail => (
                                    <TrailCard
                                        key={trail.id}
                                        trail={trail}
                                        isTrending={false}
                                        onSelect={setSelectedTrail}
                                        userLocation={userLocation}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Trending Trails */}
                        {trendingTrails.length > 0 && (
                            <div className="trending-section">
                                <h3>🔥 Trending on Social Media</h3>
                                <div className="trending-grid">
                                    {trendingTrails.map(trail => (
                                        <TrailCard
                                            key={trail.id}
                                            trail={trail}
                                            isTrending={true}
                                            onSelect={setSelectedTrail}
                                            userLocation={userLocation}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="map-view">
                        {/* Placeholder for Map Component */}
                        <div style={{ height: '400px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }}>
                            Map View Coming Soon
                        </div>
                    </div>
                )}

                {/* Selected Trail Details */}
                {selectedTrail && (
                    <div className="trail-details-modal">
                        {/* Placeholder for Modal */}
                        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '2rem', borderRadius: '15px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1000 }}>
                            <h3>{selectedTrail.name}</h3>
                            <button onClick={() => setSelectedTrail(null)}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Individual Trail Card Component
function TrailCard({ trail, isTrending, onSelect, userLocation }: { trail: Trail, isTrending: boolean, onSelect: (trail: Trail) => void, userLocation: { lat: number; lng: number } }) {
    const distance = calculateDistance(userLocation, { lat: trail.lat, lng: trail.lng });
    const difficultyColor: Record<string, string> = {
        beginner: '#10B981',
        intermediate: '#F59E0B',
        expert: '#EF4444',
        extreme: '#7C3AED'
    };

    return (
        <div
            className={`trail-card ${isTrending ? 'trending' : ''}`}
            onClick={() => onSelect(trail)}
        >
            {isTrending && (
                <div className="trending-badge-card">🔥 Trending</div>
            )}

            <div className="trail-image">
                {trail.photos && trail.photos.length > 0 ? (
                    <img src={trail.photos[0]} alt={trail.name} />
                ) : (
                    <div className="trail-image-placeholder">
                        🏍️
                    </div>
                )}
            </div>

            <div className="trail-content">
                <div className="trail-header">
                    <h4 className="trail-name">{trail.name}</h4>
                    <div
                        className="difficulty-badge"
                        style={{ backgroundColor: difficultyColor[trail.difficulty] || '#999' }}
                    >
                        {trail.difficulty}
                    </div>
                </div>

                <div className="trail-meta">
                    <span className="distance">📍 {distance.toFixed(1)}km away</span>
                    {trail.rating && (
                        <span className="rating">⭐ {trail.rating}</span>
                    )}
                </div>

                <div className="trail-terrain">
                    {trail.terrain?.map(terrain => (
                        <span key={terrain} className="terrain-tag">
                            {terrain}
                        </span>
                    ))}
                </div>

                <div className="trail-stats">
                    <div className="stat">
                        <span className="stat-value">{trail.length || 'N/A'}km</span>
                        <span className="stat-label">Length</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{trail.duration || 'N/A'}</span>
                        <span className="stat-label">Duration</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{trail.elevation || 'N/A'}m</span>
                        <span className="stat-label">Elevation</span>
                    </div>
                </div>

                {trail.trendingScore && (
                    <div className="trending-score">
                        Popularity: {Math.round(trail.trendingScore * 100)}%
                    </div>
                )}
            </div>
        </div>
    );
}

function calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
