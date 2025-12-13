
const fetch = require('node-fetch'); // or native fetch in Node 18+
const fs = require('fs');
const path = require('path');

async function checkMaps() {
    let API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
        try {
            const envPath = path.resolve(__dirname, '../../.env.local');
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=(.*)/);
            if (match) {
                API_KEY = match[1].trim();
            }
        } catch (e) {
            console.error('Could not read .env.local');
        }
    }

    if (!API_KEY) {
        console.error('API Key missing');
        return;
    }

    const lat = 40.7128;
    const lng = -74.0060;
    const radius = 5000;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=tourist_attraction&key=${API_KEY}`;

    console.log('Fetching:', url.replace(API_KEY, 'HIDDEN'));

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', data.status);
        if (data.results) {
            console.log('Results:', data.results.length);
        } else {
            console.log('No results field');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

checkMaps();
