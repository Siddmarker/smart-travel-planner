import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    tripId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    senderAvatar?: string;
    content: {
        text?: string;
        type: 'text' | 'image' | 'file' | 'location';
        metadata?: any;
    };
    readBy: { userId: mongoose.Types.ObjectId; readAt: Date }[];
    metadata: any;
}

const MessageSchema = new Schema<IMessage>({
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderAvatar: String,
    content: {
        text: String,
        type: { type: String, enum: ['text', 'image', 'file', 'location'], default: 'text' },
        metadata: Schema.Types.Mixed
    },
    readBy: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }],
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
