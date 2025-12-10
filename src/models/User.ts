import mongoose, { Schema, Document, Model } from 'mongoose';
import validator from 'validator';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    avatar: {
        public_id: string;
        url: string;
    };
    phone?: string;
    preferences: {
        language: string;
        currency: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
    };
    trips: {
        tripId: mongoose.Types.ObjectId;
        role: 'admin' | 'co-admin' | 'member';
        joinedAt: Date;
    }[];
    isActive: boolean;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword: (password: string) => Promise<boolean>;
    generateAuthToken: () => string;
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: false, // Optional for OAuth users
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            default: 'default_avatar'
        },
        url: {
            type: String,
            default: 'https://res.cloudinary.com/demo/image/upload/v1624391949/default_avatar.png'
        }
    },
    phone: {
        type: String,
        validate: {
            validator: function (v: string) {
                return /^[0-9]{10}$/.test(v);
            },
            message: 'Please enter a valid 10-digit phone number'
        }
    },
    preferences: {
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'hi', 'es', 'fr', 'de']
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD', 'EUR', 'GBP']
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false }
        }
    },
    trips: [{
        tripId: {
            type: Schema.Types.ObjectId,
            ref: 'Trip'
        },
        role: {
            type: String,
            enum: ['admin', 'co-admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Helper validation to prevent OverwriteModelError
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
