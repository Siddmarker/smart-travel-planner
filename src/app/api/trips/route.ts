
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/models/Trip";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, destination, dates, settings } = await req.json();

        if (!name || !destination || !dates) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const trip = await Trip.create({
            adminId: session.user.id, // Auth User ID
            name,
            destination,
            dates,
            settings: settings || {},
            status: 'DRAFT', // Default state
            members: [{ userId: session.user.id, role: 'admin' }]
        });

        return NextResponse.json({ success: true, trip }, { status: 201 });

    } catch (error) {
        console.error("Error creating trip:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
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
