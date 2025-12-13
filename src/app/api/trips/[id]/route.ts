
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/models/Trip";
import Day from "@/models/Day"; // Ensure Day model is registered

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();

        // Find trip and check access
        const trip = await Trip.findById(id).populate('days');

        if (!trip) {
            return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        }

        const isMember = trip.members.some(m => m.userId.toString() === session.user.id) || trip.adminId.toString() === session.user.id;

        if (!isMember) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({ success: true, trip });

    } catch (error: any) {
        console.error("Error fetching trip:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
