import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface definitions
export interface ITrip extends Document {
    name: string;
    description?: string;
    destination: {
        mainLocation: {
            address: string;
            coordinates: { lat: number; lng: number };
            placeId?: string;
            timezone?: string;
        };
        tripType: 'round' | 'one-way';
        startingPoint?: { lat: number; lng: number };
        endingPoint?: { lat: number; lng: number };
    };
    dates: {
        start: Date;
        end: Date;
        totalDays?: number;
        flexible: boolean;
    };
    participants: {
        userId: mongoose.Types.ObjectId;
        name?: string;
        email?: string;
        role: 'admin' | 'co-admin' | 'member';
        status: 'invited' | 'joined' | 'declined' | 'pending';
        joinedAt?: Date;
        invitedAt: Date;
        permissions: {
            canEditTrip: boolean;
            canInvite: boolean;
            canManageExpenses: boolean;
            canModifyItinerary: boolean;
        };
    }[];
    preferences: {
        budget: {
            range: 'low' | 'medium' | 'high' | 'luxury';
            amount?: number;
            currency: string;
            perPerson: boolean;
        };
        groupType: 'family' | 'friends' | 'solo' | 'couple' | 'business';
        categories: string[];
        ageGroup?: 'kids' | 'teen' | 'young' | 'adults' | 'senior' | 'mixed';
        advanced?: any;
    };
    itinerary: {
        source: 'ai' | 'manual' | 'hybrid' | 'template';
        generatedAt?: Date;
        days: any[]; // Using any for complexity reduction in schema definition, ideally defined interface
        optimizedRoute?: any;
    };
    voting: {
        enabled: boolean;
        type: 'simple' | 'ranked_choice' | 'weighted';
        [key: string]: any;
    };
    status: {
        current: 'planning' | 'voting' | 'booking' | 'active' | 'completed' | 'cancelled';
        progress: number;
        [key: string]: any;
    };
    settings: {
        groupChatEnabled: boolean;
        votingEnabled: boolean;
        allowReVoting: boolean;
        allowAdminTransfer: boolean;
        isPublic: boolean;
        [key: string]: any;
    };
    links: {
        joinLink: string;
        adminLink: string;
        shareableLink: string;
    };
    metadata: {
        createdBy: mongoose.Types.ObjectId;
        createdAt: Date;
        updatedAt: Date;
        [key: string]: any;
    };
}

const TripSchema = new Schema<ITrip>({
    name: {
        type: String,
        required: [true, 'Trip name is required'],
        trim: true,
        maxlength: [100, 'Trip name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    destination: {
        mainLocation: {
            address: { type: String, required: true },
            coordinates: {
                lat: { type: Number, required: true },
                lng: { type: Number, required: true }
            },
            placeId: String,
            timezone: String
        },
        tripType: {
            type: String,
            enum: ['round', 'one-way'],
            default: 'round'
        },
        startingPoint: { lat: Number, lng: Number },
        endingPoint: { lat: Number, lng: Number }
    },
    dates: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        totalDays: Number,
        flexible: { type: Boolean, default: false }
    },
    participants: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: String,
        email: String,
        role: { type: String, enum: ['admin', 'co-admin', 'member'], default: 'member' },
        status: { type: String, enum: ['invited', 'joined', 'declined', 'pending'], default: 'invited' },
        joinedAt: Date,
        invitedAt: { type: Date, default: Date.now },
        permissions: {
            canEditTrip: { type: Boolean, default: false },
            canInvite: { type: Boolean, default: false },
            canManageExpenses: { type: Boolean, default: false },
            canModifyItinerary: { type: Boolean, default: false }
        }
    }],
    preferences: {
        budget: {
            range: { type: String, enum: ['low', 'medium', 'high', 'luxury'], default: 'medium' },
            amount: Number,
            currency: { type: String, default: 'INR' },
            perPerson: { type: Boolean, default: false }
        },
        groupType: { type: String, enum: ['family', 'friends', 'solo', 'couple', 'business'], required: true },
        categories: [String],
        ageGroup: { type: String, enum: ['kids', 'teen', 'young', 'adults', 'senior', 'mixed'] },
        advanced: Schema.Types.Mixed
    },
    itinerary: {
        source: { type: String, enum: ['ai', 'manual', 'hybrid', 'template'], default: 'manual' },
        generatedAt: Date,
        days: [Schema.Types.Mixed], // Flexible schema for days as they are complex
        optimizedRoute: Schema.Types.Mixed
    },
    voting: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['simple', 'ranked_choice', 'weighted'], default: 'simple' },
        schedule: { start: Date, end: Date, duration: Number },
        rules: Schema.Types.Mixed,
        categories: [Schema.Types.Mixed],
        votes: { type: Map, of: Object },
        results: Object
    },
    status: {
        current: { type: String, enum: ['planning', 'voting', 'booking', 'active', 'completed', 'cancelled'], default: 'planning' },
        progress: { type: Number, default: 0 },
        timeline: Object,
        checklist: [Schema.Types.Mixed]
    },
    settings: {
        groupChatEnabled: { type: Boolean, default: false },
        votingEnabled: { type: Boolean, default: false },
        allowReVoting: { type: Boolean, default: true },
        allowAdminTransfer: { type: Boolean, default: true },
        isPublic: { type: Boolean, default: false },
        privacy: Object,
        notifications: Object
    },
    links: {
        joinLink: String,
        adminLink: String,
        shareableLink: String,
        votingLink: String,
        chatLink: String
    },
    metadata: {
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        version: { type: Number, default: 1 },
        lastActive: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Pre-save hooks
TripSchema.pre('save', function (this: any, next: any) {
    const doc = this as ITrip;
    if (doc.dates.start && doc.dates.end) {
        const diff = new Date(doc.dates.end).getTime() - new Date(doc.dates.start).getTime();
        doc.dates.totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    if (doc.isNew) {
        doc.links = doc.links || {};
        doc.links.joinLink = `trip-join-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    next();
});

const Trip: Model<ITrip> = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);

export default Trip;
