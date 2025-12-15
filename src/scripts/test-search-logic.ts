import { constructMapsQuery } from '../lib/search-logic';

function runTest(name: string, options: any, expected: any) {
    console.log(`\n--- Test: ${name} ---`);
    if (!options.time) options.time = new Date('2025-12-15T12:00:00'); // Default Noon

    const result = constructMapsQuery(options);

    const failures = [];

    if (expected.strategy && result.strategy !== expected.strategy) {
        failures.push(`Expected strategy '${expected.strategy}', got '${result.strategy}'`);
    }

    if (expected.radius && result.radius !== expected.radius) {
        failures.push(`Expected radius ${expected.radius}, got ${result.radius}`);
    }

    if (expected.queryContains) {
        expected.queryContains.forEach((term: string) => {
            if (!result.finalQuery.toLowerCase().includes(term.toLowerCase())) {
                failures.push(`Expected query to contain '${term}', got '${result.finalQuery}'`);
            }
        });
    }

    if (expected.queryNotContains) {
        expected.queryNotContains.forEach((term: string) => {
            if (result.finalQuery.toLowerCase().includes(term.toLowerCase())) {
                failures.push(`Expected query NOT to contain '${term}', got '${result.finalQuery}'`);
            }
        });
    }

    if (failures.length === 0) {
        console.log('✅ PASS');
        console.log(`Query: "${result.finalQuery}"`);
        console.log(`Radius: ${result.radius}m | Strategy: ${result.strategy}`);
    } else {
        console.log('❌ FAIL');
        failures.forEach(f => console.error(`  - ${f}`));
    }
}

console.log('Running Search Logic Verification...');

// 1. Standard Search
runTest('Standard Search', {
    query: 'Italian',
    locationName: 'Indiranagar, Bangalore'
}, {
    strategy: 'STANDARD',
    radius: 5000
});

// 2. Strict Jain Protocol
runTest('Strict Jain Protocol', {
    query: 'North Indian',
    locationName: 'Jayanagar',
    filters: { dietary: ['Jain'] }
}, {
    strategy: 'JAIN_STRICT',
    queryContains: ['Pure Jain', 'North Indian'],
    queryNotContains: ['Restaurant'] // Should prioritize Pure Jain phrasing
});

// 3. 4 AM Biryani Logic
runTest('4 AM Biryani Logic (Time: 04:00)', {
    query: 'Biryani',
    locationName: 'Hoskote',
    time: new Date('2025-12-15T04:30:00') // 4:30 AM
}, {
    strategy: 'EARLY_MORNING',
    radius: 35000,
    queryContains: ['open now']
});

runTest('4 AM Explicit Query', {
    query: 'Early Morning Food',
    locationName: 'Indiranagar'
}, {
    strategy: 'EARLY_MORNING',
    radius: 35000
});

// 4. Local Non-Veg Unlock
runTest('Local Non-Veg Unlock', {
    category: 'Local',
    locationName: 'Bangalore',
    filters: { dietary: ['Non-Veg'] }
}, {
    strategy: 'LOCAL_NON_VEG',
    queryContains: ['Military Hotel', 'Nati Style'],
    queryNotContains: ['Non-veg restaurant']
});

// 5. Conflict Test: Jain at 4 AM
// Jain logic should theoretically take precedence for safety, or mixed?
// Our logic: Time check happens first, then Jain overwrites strategy if Jain is present?
// Let's check implementation behavior
runTest('Conflict: Jain at 4 AM', {
    query: 'Food',
    locationName: 'Bangalore',
    time: new Date('2025-12-15T04:00:00'),
    filters: { dietary: ['Jain'] }
}, {
    // Strategy might satisfy one or the other dependent on code order.
    // In my code: Time is computed first (sets strategy=EARLY_MORNING), 
    // THEN Jain check (if(isJain) strategy=JAIN_STRICT).
    // So Jain should win Strategy, ensuring "Pure Jain" query, but maybe lose Radius? 
    // Let's see what happens. Ideally Jain safety > Time convenience.
    strategy: 'JAIN_STRICT',
    queryContains: ['Pure Jain']
});
