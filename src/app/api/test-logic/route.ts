
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/models/Trip";
import Day from "@/models/Day";
import { TripLogicService } from "@/lib/trip-logic";
import mongoose from "mongoose";

export async function GET() {
    try {
        await dbConnect();

        // 1. Create Mock Trip
        const trip = await Trip.create({
            adminId: new mongoose.Types.ObjectId(),
            name: "API Logic Test Trip",
            destination: {
                name: "New York, NY",
                location: { lat: 40.7128, lng: -74.0060 }
            },
            dates: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 86400000).toISOString() // 1 day
            },
            settings: { returnToStart: false },
            tripState: 'DRAFT',
            members: []
        });

        // 2. Run Logic
        await TripLogicService.startTrip(trip.id);

        // 3. Fetch Result
        const day = await Day.findOne({ tripId: trip._id });
        const dayObj = day?.toObject();

        // 4. Cleanup
        await Trip.deleteOne({ _id: trip._id });
        if (day) await Day.deleteOne({ _id: day._id });

        return NextResponse.json({
            success: true,
            votingPoolSnapshot: dayObj?.votingPool
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
