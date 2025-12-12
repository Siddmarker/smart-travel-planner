
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
console.log('Reading env from:', envPath);
try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.error('Failed to read .env.local:', e);
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

async function testConnection() {
    console.log('Attempting to connect to MongoDB...');
    let uri = process.env.MONGODB_URI;

    // Apply the same sanitization/fix logic as the main app
    try {
        const u = new URL(uri);
        const appName = u.searchParams.get('appName');
        if (appName === '' || appName === null || appName === undefined) {
            console.log('Sanitizing URI: Removing empty appName');
            u.searchParams.delete('appName');
        }

        // Enforce DB name "smart-travel" if missing
        if (u.pathname === '/' || u.pathname === '') {
            console.log('Sanitizing URI: Setting default database to "smart-travel"');
            u.pathname = '/smart-travel';
        }

        uri = u.toString();

        const masked = uri.replace(/:([^:@]+)@/, ':****@');
        console.log(`Connecting to: ${masked}`);

    } catch (e) { console.error('URI Parse error', e); }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!');

        const state = mongoose.connection.readyState;
        console.log('Connection State:', state === 1 ? 'Connected' : 'Disconnected');
        console.log('Database Name:', mongoose.connection.name);

        await mongoose.connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.codeName) console.error('Error CodeName:', error.codeName);
        process.exit(1);
    }
}

testConnection();
