
import mongoose from 'mongoose';
import { TripLogicService } from '../lib/trip-logic'; // Adjust path
import Trip from '../models/Trip';
import Day from '../models/Day';
import User from '../models/User';
const dotenv = require('dotenv');
// import path from 'path'; // path is likely used, keep if needed or use require
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/trip-planner";

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Create Mock Trip
        const trip = await Trip.create({
            adminId: new mongoose.Types.ObjectId(),
            name: "Test Logic Trip",
            destination: {
                name: "Paris, France",
                location: { lat: 48.8566, lng: 2.3522 }
            },
            dates: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 86400000 * 3).toISOString() // 3 days
            },
            settings: { returnToStart: false },
            tripState: 'DRAFT',
            members: []
        });
        console.log('Created Trip:', trip._id);

        // Run Logic
        console.log('Starting Trip...');
        const updatedTrip = await TripLogicService.startTrip(trip._id.toString());
        console.log('Trip State:', updatedTrip?.tripState);

        // Fetch Day 1
        const day1 = await Day.findOne({ tripId: trip._id, dayIndex: 1 });
        console.log('Day 1 Status:', day1?.status);

        if (day1 && day1.votingPool) {
            console.log('Voting Pool Generated:');
            console.log('Morning Candidates:', day1.votingPool.morning.length);
            if (day1.votingPool.morning.length > 0) {
                console.log('First Candidate:', JSON.stringify(day1.votingPool.morning[0], null, 2));
            }
            console.log('Afternoon Candidates:', day1.votingPool.afternoon.length);
            console.log('Evening Candidates:', day1.votingPool.evening.length);
        } else {
            console.log('Day 1 or Voting Pool missing');
        }

        // Clean up
        await Trip.deleteOne({ _id: trip._id });
        await Day.deleteMany({ tripId: trip._id });
        console.log('Cleaned up');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
