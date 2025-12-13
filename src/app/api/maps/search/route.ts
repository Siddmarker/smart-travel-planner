import { NextResponse } from 'next/server';
import { searchPlaces } from '@/lib/googleMapsService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type') || 'tourist_attraction';

    if (!query) {
        return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    try {
        const results = await searchPlaces(
            query,
            (lat && lng) ? { lat: parseFloat(lat as string), lng: parseFloat(lng as string) } : undefined,
            5000,
            type
        );

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
