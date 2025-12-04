import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlace {
    googlePlaceId: string;
    name: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    rating: number;
    reviewCount: number;
    photoUrl?: string;
    openingHours?: string[];
    timeSlot: 'morning' | 'afternoon' | 'evening';
    dayNumber: number;
    addedBy?: string;
    addedAt: Date;
    votes?: {
        up: string[];
        down: string[];
    };
}

export interface IDayPlan {
    dayNumber: number;
    planningMode: 'ai' | 'manual';
    morning: IPlace[];
    afternoon: IPlace[];
    evening: IPlace[];
    finalMorning?: IPlace;
    finalAfternoon?: IPlace;
    finalEvening?: IPlace;
    status: 'empty' | 'partial' | 'complete';
}

export interface IParticipant {
    userId: string;
    name: string;
    role: 'admin' | 'member';
    joinedAt: Date;
}

export interface ITrip extends Document {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    location: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    preferences: {
        returnToStart: boolean;
        startTime: string;
        endTime: string;
        foodVariety?: 'high' | 'medium' | 'low';
        dietary?: string[];
        cuisines?: string[];
    };
    includeDining: boolean;
    adminId: string;
    joinCode: string;
    participants: IParticipant[];
    days: IDayPlan[];
    planningMode: 'ai' | 'manual' | 'hybrid';
    votingStatus: 'not_started' | 'open' | 'closed' | 'finalized';
    createdAt: Date;
    updatedAt: Date;
}

const PlaceSchema = new Schema<IPlace>({
    googlePlaceId: String,
    name: String,
    address: String,
    coordinates: {
        lat: Number,
        lng: Number
    },
    rating: Number,
    reviewCount: Number,
    photoUrl: String,
    openingHours: [String],
    timeSlot: {
        type: String,
        enum: ['morning', 'afternoon', 'evening']
    },
    dayNumber: Number,
    addedBy: {
        type: String,
        ref: 'User'
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    votes: {
        up: [{ type: String, ref: 'User' }],
        down: [{ type: String, ref: 'User' }]
    }
});

const DayPlanSchema = new Schema<IDayPlan>({
    dayNumber: Number,
    planningMode: {
        type: String,
        enum: ['ai', 'manual'],
        default: 'manual'
    },
    morning: [PlaceSchema],
    afternoon: [PlaceSchema],
    evening: [PlaceSchema],
    finalMorning: PlaceSchema,
    finalAfternoon: PlaceSchema,
    finalEvening: PlaceSchema,
    status: {
        type: String,
        enum: ['empty', 'partial', 'complete'],
        default: 'empty'
    }
});

const TripSchema = new Schema<ITrip>({
    name: { type: String, required: true },
    description: String,
    startDate: Date,
    endDate: Date,
    totalDays: Number,
    location: String,
    coordinates: {
        lat: Number,
        lng: Number
    },
    preferences: {
        returnToStart: { type: Boolean, default: false },
        startTime: String,
        endTime: String,
        foodVariety: {
            type: String,
            enum: ['high', 'medium', 'low']
        },
        dietary: [String],
        cuisines: [String]
    },
    includeDining: {
        type: Boolean,
        default: false
    },
    adminId: {
        type: String,
        required: true
    },
    joinCode: {
        type: String,
        unique: true,
        // required: true - handled in pre-save
    },
    participants: [{
        userId: {
            type: String,
            required: true
        },
        name: String,
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    days: [DayPlanSchema],
    planningMode: {
        type: String,
        enum: ['ai', 'manual', 'hybrid'],
        default: 'manual'
    },
    votingStatus: {
        type: String,
        enum: ['not_started', 'open', 'closed', 'finalized'],
        default: 'not_started'
    }
}, {
    timestamps: true
});

// Generate join code before saving
TripSchema.pre('save', function (this: ITrip, next: any) {
    if (!this.joinCode) {
        this.joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    next();
});

// Check if model exists before compiling to avoid OverwriteModelError in HMR
const Trip: Model<ITrip> = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);

export default Trip;
