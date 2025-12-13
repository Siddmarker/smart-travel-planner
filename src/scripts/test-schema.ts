
import mongoose from 'mongoose';
import Trip from '../models/Trip';
import Day from '../models/Day';
import User from '../models/User';
import dbConnect from '../lib/db';

async function testSchema() {
    console.log('Starting Schema Verification...');

    try {
        await dbConnect();
        console.log('Connected to DB');

        // 1. Create a partial User (mock)
        const mockUserId = new mongoose.Types.ObjectId();

        // 2. Create a Trip
        console.log('Creating Trip...');
        const trip = await Trip.create({
            adminId: mockUserId,
            name: 'Schema Test Trip',
            destination: {
                name: 'Paris',
                location: { lat: 48.8566, lng: 2.3522 },
                placeId: 'place_id_123'
            },
            dates: {
                start: '2025-06-01',
                end: '2025-06-03'
            },
            settings: {
                returnToStart: true,
                budget: 'moderate'
            }
        });
        console.log('Trip created with ID:', trip._id);

        // 3. Create Days
        console.log('Creating Days...');
        const day1 = await Day.create({
            tripId: trip._id,
            date: '2025-06-01',
            dayIndex: 1,
            status: 'PENDING',
            clusters: {
                morning: {
                    candidates: [{
                        id: 'p1', name: 'Cafe de Flore', lat: 48.8, lng: 2.3,
                        geminiSummary: 'Classic literary cafe',
                        vibeTags: ['Tourist Trap', 'Historic']
                    }]
                }
            }
        });

        const day2 = await Day.create({
            tripId: trip._id,
            date: '2025-06-02',
            dayIndex: 2,
            status: 'PENDING'
        });

        console.log('Day 1 created:', day1._id);
        console.log('Day 2 created:', day2._id);

        // 4. Update Trip with Days
        trip.days.push(day1._id as any, day2._id as any);
        await trip.save();
        console.log('Trip updated with days');

        // 5. Verify Retrieval
        const retrievedTrip = await Trip.findById(trip._id).populate('days');
        if (!retrievedTrip) throw new Error('Trip not found');

        console.log('Retrieved Trip Days count:', retrievedTrip.days.length);
        const firstDay = retrievedTrip.days[0] as any;

        if (firstDay.clusters.morning.candidates[0].geminiSummary === 'Classic literary cafe') {
            console.log('SUCCESS: Gemini Summary field verified!');
        } else {
            console.error('FAILURE: Gemini Summary field missing or incorrect');
        }

        // Cleanup
        await Trip.deleteOne({ _id: trip._id });
        await Day.deleteMany({ tripId: trip._id });
        console.log('Cleanup complete');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testSchema();
