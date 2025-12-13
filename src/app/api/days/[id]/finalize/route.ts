
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { TripLogicService } from "@/lib/trip-logic";
import Day from "@/models/Day";
import Trip from "@/models/Trip";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        // Verify ownership via Trip
        // We need to find the day, getting the tripId, then checking Admin on Trip
        const day = await Day.findById(id);
        if (!day) {
            return NextResponse.json({ error: "Day not found" }, { status: 404 });
        }

        const trip = await Trip.findById(day.tripId);
        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        if (trip.adminId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Only admin can finalize day" }, { status: 403 });
        }

        const updatedDay = await TripLogicService.finalizeDay(id);

        return NextResponse.json({ success: true, day: updatedDay });

    } catch (error: any) {
        console.error("Error finalizing day:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
