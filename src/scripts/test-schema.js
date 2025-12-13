
const mongoose = require('mongoose');
// Default to local if env is missing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-travel';

// Temporary Schema Definitions for Verification
const CandidatePlaceSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    category: { type: String },
    geminiSummary: { type: String },
    vibeTags: [{ type: String }]
}, { _id: false });

const ClusterSchema = new mongoose.Schema({
    centroid: { lat: Number, lng: Number },
    candidates: [CandidatePlaceSchema],
    winner: CandidatePlaceSchema
}, { _id: false });

const DaySchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    dayIndex: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'VOTING', 'LOCKED', 'LIVE'], default: 'PENDING' },
    clusters: {
        morning: { type: ClusterSchema, default: {} },
        afternoon: { type: ClusterSchema, default: {} },
        evening: { type: ClusterSchema, default: {} }
    }
});

const TripSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    days: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Day' }]
});

const Day = mongoose.models.Day || mongoose.model('Day', DaySchema);
const Trip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

async function testSchema() {
    console.log('Starting JS Schema Verification...');
    console.log('URI used:', MONGODB_URI.replace(/:([^:@]+)@/, ':****@')); // Mask password if any

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Create Trip
        const trip = await Trip.create({
            adminId: new mongoose.Types.ObjectId(),
            name: 'JS Test Trip',
            days: []
        });
        console.log('Trip created:', trip._id);

        // Create Day
        const day = await Day.create({
            tripId: trip._id,
            date: '2025-06-01',
            dayIndex: 1,
            status: 'PENDING',
            clusters: {
                morning: {
                    candidates: [{
                        id: 'p1', name: 'JS Cafe', lat: 10, lng: 10,
                        geminiSummary: 'Verified via JS',
                        vibeTags: ['Working']
                    }]
                }
            }
        });
        console.log('Day created:', day._id);

        // Check
        const savedDay = await Day.findById(day._id);
        if (savedDay.clusters.morning.candidates[0].geminiSummary === 'Verified via JS') {
            console.log('SUCCESS: Schema handles nested structure correctly.');
        } else {
            console.log('FAILURE: Data mismatch.');
        }

        // Cleanup
        await Trip.deleteOne({ _id: trip._id });
        await Day.deleteOne({ _id: day._id });
        console.log('Cleanup complete');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testSchema();
