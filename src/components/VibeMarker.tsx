'use client';
import { OverlayView } from '@react-google-maps/api';

interface VibeMarkerProps {
    position: { lat: number; lng: number };
    place: any;
    onClick?: (place: any) => void;
}

export default function VibeMarker({ position, place, onClick }: VibeMarkerProps) {
    // Determine vibe color based on place type
    const getVibeColor = () => {
        const type = place.type?.toLowerCase() || '';
        if (type.includes('restaurant') || type.includes('food')) return 'bg-orange-500';
        if (type.includes('temple') || type.includes('heritage')) return 'bg-purple-500';
        if (type.includes('park') || type.includes('nature')) return 'bg-green-500';
        if (type.includes('shopping') || type.includes('mall')) return 'bg-pink-500';
        return 'bg-blue-500';
    };

    return (
        <OverlayView
            position={position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div
                onClick={() => onClick?.(place)}
                className={`${getVibeColor()} -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full p-2 shadow-lg transition-transform hover:scale-125`}
                title={place.name}
            >
                <div className="h-3 w-3 rounded-full bg-white"></div>
            </div>
        </OverlayView>
    );
}
