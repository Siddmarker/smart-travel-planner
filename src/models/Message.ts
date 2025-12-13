
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    tripId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    content: string;
    type: 'text' | 'image' | 'system';
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' }
}, {
    timestamps: true // Adds createdAt, updatedAt
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
