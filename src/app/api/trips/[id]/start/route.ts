
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { TripLogicService } from "@/lib/trip-logic";
import Trip from "@/models/Trip";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params; // Next.js 15 requires awaiting params

        await dbConnect();

        // Verify ownership
        const trip = await Trip.findById(id);
        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        if (trip.adminId.toString() !== session.user.id) {
            return NextResponse.json({ error: "Only admin can start the trip" }, { status: 403 });
        }

        const updatedTrip = await TripLogicService.startTrip(id);

        return NextResponse.json({ success: true, trip: updatedTrip });

    } catch (error: any) {
        console.error("Error starting trip:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
