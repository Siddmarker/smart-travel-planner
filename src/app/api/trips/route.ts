
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/models/Trip";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        const body = await req.json();
        const { name, destination, dates, settings, pax, tripType, userId: bodyUserId } = body;

        let userId = session?.user?.id;

        // Fallback for custom/mock auth
        if (!userId && bodyUserId) {
            console.log("Debug Trip Create: Using body userId (Mock Auth):", bodyUserId);
            userId = bodyUserId;
        }

        if (!userId) {
            console.log("Debug Trip Create Unauthorized: Missing session or body userId");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!name || !destination || !dates) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const trip = await Trip.create({
            adminId: userId,
            name,
            destination,
            dates,
            settings: settings || {},
            tripState: 'DRAFT', // Correct field name per schema
            members: [{ userId: userId, role: 'admin' }],
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
