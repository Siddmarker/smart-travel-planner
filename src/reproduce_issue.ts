
import { SmartItineraryPlanner } from './lib/smart-planner';
import { UserPreferences } from './types';

// Mock fetch
global.fetch = async (url: any, options: any) => {
    console.log(`[MockFetch] Calling ${url}`);

    // Parse body to check if it's Day 2
    const body = JSON.parse(options.body);
    const prompt = body.contents[0].parts[0].text;
    const isDay2 = prompt.includes('Day 2');

    if (isDay2) {
        console.log('[MockFetch] Simulating empty response for Day 2');
        return {
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify({
                                morning: [],
                                afternoon: [],
                                evening: []
                            })
                        }]
                    }
                }]
            })
        } as any;
    }

    // Default success response
    return {
        json: async () => ({
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            morning: [{ name: "Mock Place 1", category: "Park" }],
                            afternoon: [{ name: "Mock Place 2", category: "Museum" }],
                            evening: [{ name: "Mock Place 3", category: "Dinner" }]
                        })
                    }]
                }
            }]
        })
    } as any;
};

async function runTest() {
    const userPreferences: UserPreferences = {
        interests: ['Nature', 'Culture'],
        budget: 'medium',
        trip_duration: 3,
        destination: { name: 'Paris', lat: 48.8566, lng: 2.3522 },
        start_location: { lat: 48.8566, lng: 2.3522 },
        trip_dates: { start: '2025-05-01', end: '2025-05-03' },
        categories: ['Nature', 'Culture'],
        day_start_time: new Date('2025-05-01T09:00:00'),
        return_to_start: true
    };

    const tripData = {
        destination: 'Paris',
        startDate: '2025-05-01',
        endDate: '2025-05-03',
        totalDays: 3
    };

    const planner = new SmartItineraryPlanner('mock-key', userPreferences, tripData);

    console.log('--- Planning Day 1 ---');
    const day1 = await planner.planDay(1);
    console.log('Day 1 Status:', day1.status);
    console.log('Day 1 Morning Places:', (day1.slots as any).morning.places.length);

    console.log('--- Planning Day 2 (Should use fallback) ---');
    const day2 = await planner.planDay(2);
    console.log('Day 2 Status:', day2.status);
    console.log('Day 2 Morning Places:', (day2.slots as any).morning.places.length);

    if ((day2.slots as any).morning.places.length === 0) {
        console.error('FAIL: Day 2 has no places!');
    } else {
        console.log('SUCCESS: Day 2 has places (fallback worked).');
    }
}

runTest().catch(console.error);
