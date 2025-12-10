import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Message from '@/models/Message';
import Chat from '@/models/Chat';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const messages = await Message.find({ tripId: id }).sort({ 'metadata.createdAt': -1 }).limit(50);
        return NextResponse.json({ success: true, messages: messages.reverse() });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { id } = await params;
        // User mock
        const user = { _id: new mongoose.Types.ObjectId(), name: 'Test User' };

        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const message = await Message.create({
            tripId: id,
            senderId: user._id,
            senderName: user.name,
            content: { text: body.text }
        });

        await Chat.findOneAndUpdate(
            { tripId: id },
            { $set: { 'metadata.lastMessageAt': new Date() }, $inc: { 'metadata.totalMessages': 1 } },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
