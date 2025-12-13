
import mongoose, { Schema, Document, Model } from 'mongoose';
import { IDay, PlaceCandidate } from '@/types';

// Flattened interface for Mongoose interactions if needed, 
// usually we can use the main IDay (DayItinerary) but Mongoose types can be strict.
// We'll define schemas to match the DayItinerary interface.

const PlaceCandidateSchema = new Schema({
    id: { type: String, required: true }, // Internal or external ID
    googlePlaceId: { type: String, required: true },
    name: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    photos: [{ type: String }],
    rating: { type: Number, default: 0 },

    // Route-Aware
    clusterSlot: { type: String, enum: ['morning', 'afternoon', 'evening'], required: true },
    parentClusterId: { type: String, default: null },

    // Gemini Intelligence
    aiVibeCheck: {
        summary: { type: String, required: true },
        tags: [{ type: String }],
        isTouristTrap: { type: Boolean, default: false }
    },

    // Voting
    votes: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        vote: { type: String, enum: ['up', 'down'] }
    }],

    // Legacy/Additional mapping
    category: String,
    priceLevel: Number,
    image: String
}, { _id: false }); // Start with false, maybe need IDs if referenced individually? Keeping simple.

const TransportSchema = new Schema({
    mode: { type: String, enum: ['driving', 'transit'] },
    duration: String,
    polyline: String
}, { _id: false });

const DaySchema = new Schema<IDay & Document>({
    tripId: {
        type: Schema.Types.ObjectId as any,
        ref: 'Trip',
        required: true
    },
    date: {
        type: String, // ISO date string
        required: true
    },
    dayIndex: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'VOTING', 'LOCKED', 'LIVE'],
        default: 'PENDING'
    },

    // Step 1: Voting Pool
    votingPool: {
        morning: [PlaceCandidateSchema],
        afternoon: [PlaceCandidateSchema],
        evening: [PlaceCandidateSchema]
    },

    // Step 2: Final Route
    finalRoute: {
        stops: [PlaceCandidateSchema],
        transport: [TransportSchema],
        returnTrip: {
            feasible: Boolean,
            duration: String,
            warning: String
        }
    }
}, {
    timestamps: true
});

// Compound index for unique day per trip
DaySchema.index({ tripId: 1, dayIndex: 1 }, { unique: true });

export interface IDayDocument extends Document, Omit<IDay, 'id' | 'tripId'> {
    tripId: mongoose.Types.ObjectId;
    status: 'PENDING' | 'VOTING' | 'LOCKED' | 'LIVE';
    votingPool: {
        morning: PlaceCandidate[];
        afternoon: PlaceCandidate[];
        evening: PlaceCandidate[];
    };
    finalRoute?: {
        stops: PlaceCandidate[];
        transport: any[];
    };
    markModified(path: string): void;
}

const Day: Model<IDayDocument> = mongoose.models.Day || mongoose.model<IDayDocument>('Day', DaySchema as any);

export default Day;
