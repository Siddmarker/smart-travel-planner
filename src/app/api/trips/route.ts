
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/models/Trip";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        console.log("Debug Trip Create Session:", JSON.stringify(session, null, 2));

        if (!session || !session.user || !session.user.id) {
            console.log("Debug Trip Create Unauthorized: Missing session or user ID");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, destination, dates, settings, pax, tripType } = await req.json();

        if (!name || !destination || !dates) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const trip = await Trip.create({
            adminId: session.user.id,
            name,
            destination,
            dates,
            settings: settings || {},
            tripState: 'DRAFT', // Correct field name per schema
            members: [{ userId: session.user.id, role: 'admin' }],
            pax: pax || 1,
            tripType: tripType || 'friends'
        });

        return NextResponse.json({ success: true, trip }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating trip:", error);
        // Return more detailed validation errors if available
        const errorMessage = error.name === 'ValidationError'
            ? Object.values(error.errors).map((e: any) => e.message).join(', ')
            : "Internal Server Error";

        return NextResponse.json({ error: "Failed to create trip", details: errorMessage }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Find trips where user is admin or member
        const trips = await Trip.find({
            $or: [
                { adminId: session.user.id },
                { 'members.userId': session.user.id }
            ]
        }).sort({ updatedAt: -1 });

        return NextResponse.json({ success: true, trips });

    } catch (error) {
        console.error("Error fetching trips:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
