
const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple env parser
function getEnvValue(key) {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
            if (match) return match[1].trim();
        }
    } catch (e) { }
    return process.env[key];
}

const API_KEY = getEnvValue('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') || getEnvValue('GOOGLE_MAPS_API_KEY');

console.log('Testing Google Maps API (Node.js)...');
console.log('API Key Present:', !!API_KEY);

if (!API_KEY) {
    console.error('ERROR: No API Key found in .env.local');
    process.exit(1);
}

const query = 'Mysuru';
const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Response Status:', json.status);
            if (json.error_message) {
                console.error('Error Message:', json.error_message);
            }
            console.log('Result Count:', json.results ? json.results.length : 0);
            if (json.results && json.results.length > 0) {
                console.log('First Result:', json.results[0].name);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
        }
    });
}).on('error', (e) => {
    console.error('Request Error:', e);
});
