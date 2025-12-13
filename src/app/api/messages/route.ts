
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Trip from "@/models/Trip";
import mongoose from "mongoose";

// POST: Send a message
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { tripId, content, type } = await req.json();

        if (!tripId || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        await dbConnect();

        // Verify Membership
        const trip = await Trip.findById(tripId);
        if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        const isMember = trip.members.some(m => m.userId.toString() === session.user.id) || trip.adminId.toString() === session.user.id;
        if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const message = await Message.create({
            tripId,
            userId: session.user.id,
            content,
            type: type || 'text'
        });

        // Populate user details for immediate display return
        await message.populate('userId', 'name avatar');

        return NextResponse.json({ success: true, message });
    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Fetch messages for a trip
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const tripId = searchParams.get('tripId');
        const limitStr = searchParams.get('limit');
        const beforeStr = searchParams.get('before');

        if (!tripId) return NextResponse.json({ error: "Trip ID required" }, { status: 400 });

        await dbConnect();

        // Verify Membership
        const trip = await Trip.findById(tripId);
        if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        const isMember = trip.members.some(m => m.userId.toString() === session.user.id) || trip.adminId.toString() === session.user.id;
        if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const query: any = { tripId };
        if (beforeStr) {
            query.createdAt = { $lt: new Date(beforeStr) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Newest first
            .limit(parseInt(limitStr || '50'))
            .populate('userId', 'name avatar');

        // Reverse to return oldest-to-newest for UI rendering
        return NextResponse.json({ success: true, messages: messages.reverse() });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
