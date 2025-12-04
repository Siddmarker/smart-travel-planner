import { NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/googleMapsService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type') || 'tourist_attraction';

    if (!query || !lat || !lng) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const results = await searchPlaces(
            query,
            { lat: parseFloat(lat), lng: parseFloat(lng) },
            5000,
            type
        );

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
