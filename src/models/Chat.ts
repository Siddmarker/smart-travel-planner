import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChat extends Document {
    tripId: mongoose.Types.ObjectId;
    settings: any;
    participants: any[];
    messages: any[]; // Usually separate collection, but keeping ref here if needed or just metadata
    metadata: any;
}

const ChatSchema = new Schema<IChat>({
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, unique: true },
    settings: {
        enabled: { type: Boolean, default: true },
        allowFileSharing: { type: Boolean, default: true },
        type: { type: String, default: 'internal' }
    },
    participants: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        lastSeen: Date,
        isOnline: Boolean
    }],
    metadata: {
        lastMessageAt: Date,
        totalMessages: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

const Chat: Model<IChat> = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
