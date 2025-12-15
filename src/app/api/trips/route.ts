
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Trip from "@/models/Trip";

export async function POST(req: Request) {
    try {
        console.log("Trip Creation API called");
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
            console.error("Trip Create Unauthorized: Missing session or body userId");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.MONGODB_URI) {
            console.error("Critical: MONGODB_URI is not defined");
            return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
        }

        if (!name || !destination || !dates) {
            console.error("Validation Error: Missing required fields", { name, destination, dates });
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        try {
            await dbConnect();
        } catch (dbError: any) {
            console.error("Failed to connect to Database during Trip Creation:", dbError);
            return NextResponse.json({
                error: "Database Connection Failed",
                details: dbError.message
            }, { status: 500 });
        }

        console.log("Creating trip for user:", userId);

        const trip = await Trip.create({
            adminId: userId,
            name,
            destination,
            dates,
            settings: settings || {},
            tripState: 'DRAFT',
            members: [{ userId: userId, role: 'admin' }],
            pax: pax || 1,
            tripType: tripType || 'friends'
        });

        console.log("Trip created successfully:", trip._id);
        return NextResponse.json({ success: true, trip }, { status: 201 });

    } catch (error: any) {
        console.error("Fatal Error creating trip:", error);

        // Return clear validation message but hide system details
        const errorMessage = error.name === 'ValidationError' && error.errors
            ? Object.values(error.errors).map((e: any) => e.message).join(', ')
            : error.message || "Failed to create trip";

        return NextResponse.json({
            error: "Failed to create trip",
            details: errorMessage
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = session?.user?.id;

        // Fallback for custom/mock auth via header
        if (!userId) {
            const userIdHeader = req.headers.get('x-user-id');
            if (userIdHeader) {
                console.log("Debug Trips GET: Using header userId (Mock Auth):", userIdHeader);
                userId = userIdHeader;
            }
        }

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Find trips where user is admin or member
        const trips = await Trip.find({
            $or: [
                { adminId: userId },
                { 'members.userId': userId }
            ]
        }).sort({ updatedAt: -1 });

        return NextResponse.json({ success: true, trips });

    } catch (error) {
        console.error("Error fetching trips:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
