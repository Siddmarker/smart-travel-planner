'use client';
import { useEffect, useState } from 'react';

export default function ApiKeyCheck() {
    const [apiKey, setApiKey] = useState<string>('');
    const [environment, setEnvironment] = useState<string>('');

    useEffect(() => {
        const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

        setApiKey(mapsApiKey || 'MISSING');
        setEnvironment(process.env.NODE_ENV);

        console.log('🔍 API Key Debug:');
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Maps API Key exists:', !!mapsApiKey);
        console.log('Maps API Key length:', mapsApiKey?.length);
        console.log('Maps API Key first 10 chars:', mapsApiKey?.substring(0, 10) + '...');
        console.log('Client ID exists:', !!clientId);
        console.log('Client ID first 10 chars:', clientId?.substring(0, 10) + '...');
    }, []);

    return (
        <div style={{
            background: '#ffebee',
            padding: '15px',
            borderRadius: '8px',
            margin: '20px 0',
            border: '1px solid #f44336'
        }}>
            <h4>🔧 API Key Debug Information</h4>
            <p><strong>Environment:</strong> {environment}</p>
            <p><strong>Maps API Key:</strong> {apiKey !== 'MISSING' ? '✅ PRESENT' : '❌ MISSING'}</p>
            <p><strong>Key Preview:</strong> {apiKey !== 'MISSING' ? apiKey.substring(0, 10) + '...' : 'N/A'}</p>
            <p><strong>Key Length:</strong> {apiKey.length} characters</p>
            <button
                onClick={() => {
                    // Test the API key directly
                    const testUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=console.log`;
                    console.log('Testing URL:', testUrl);
                    window.open(testUrl, '_blank');
                }}
                style={{ marginRight: '10px', padding: '5px 10px', cursor: 'pointer' }}
            >
                Test API Key
            </button>
            <button
                onClick={() => navigator.clipboard.writeText(apiKey)}
                style={{ padding: '5px 10px', cursor: 'pointer' }}
            >
                Copy Key to Clipboard
            </button>
        </div>
    );
}
