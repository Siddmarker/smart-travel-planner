import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITrip, TripState } from '@/types';

export interface ITripDocument extends Document, Omit<ITrip, 'id' | 'days' | 'adminId' | 'members'> {
    adminId: string;
    days: mongoose.Types.ObjectId[];
    members: {
        userId: string;
        role: 'admin' | 'member';
        joinedAt: Date;
    }[];
}

const TripSchema = new Schema<ITripDocument>({
    adminId: {
        type: String, // Changed to String to support local auth IDs
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        name: { type: String, required: true },
        location: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        placeId: String
    },
    dates: {
        start: { type: String, required: true },
        end: { type: String, required: true }
    },
    pax: {
        type: Number,
        required: true,
        default: 1
    },
    tripType: {
        type: String,
        enum: ['friends', 'family', 'couple', 'solo', 'business', 'Solo', 'Friends', 'Family', 'Corporate'],
        required: true,
        default: 'friends'
    },
    categories: [{ type: String }],
    members: [{
        userId: { type: String }, // Changed to String
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
    }],
    tripState: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'COMPLETED'],
        default: 'DRAFT'
    },
    settings: {
        returnToStart: { type: Boolean, default: false },
        budget: { type: String, enum: ['budget', 'moderate', 'luxury'], default: 'moderate' },
        pace: { type: String, enum: ['relaxed', 'moderate', 'fast'], default: 'moderate' }
    },
    days: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Day'
    }],
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Force recompilation of model if it already exists to ensure schema updates are applied
if (mongoose.models.Trip) {
    delete mongoose.models.Trip;
}

const Trip: Model<ITripDocument> = mongoose.model<ITripDocument>('Trip', TripSchema as any);

export default Trip;
