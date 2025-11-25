'use client';
import SafeMap from '@/components/Map/SafeMap';
import ApiKeyCheck from '@/components/Debug/ApiKeyCheck';

export default function TestMapPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Google Maps Test</h1>
            <p className="mb-4 text-muted-foreground">
                This page tests the Google Maps integration. If the API key is valid, you should see a map below.
                If not, you will see a user-friendly error message.
            </p>

            <ApiKeyCheck />

            <SafeMap
                center={{ lat: 40.7128, lng: -74.0060 }} // New York
                zoom={12}
                className="w-full h-[500px] rounded-lg overflow-hidden border shadow-sm"
            />
        </div>
    );
}
