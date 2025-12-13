
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

async function testMaps() {
    console.log('Testing Google Maps API...');
    console.log('API Key Present:', !!API_KEY);
    if (API_KEY) {
        console.log('API Key First 4 chars:', API_KEY.substring(0, 4));
    }

    const query = 'Mysuru';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

    console.log(`Fetching: ${url.replace(API_KEY || '', 'HIDDEN_KEY')}`);

    try {
        const res = await fetch(url);
        const data = await res.json();

        console.log('Response Status:', data.status);
        if (data.error_message) {
            console.error('Error Message:', data.error_message);
        }
        console.log('Result Count:', data.results ? data.results.length : 0);

        if (data.results && data.results.length > 0) {
            console.log('First Result:', data.results[0].name, data.results[0].formatted_address);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testMaps();
