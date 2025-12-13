
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Trip from "@/models/Trip";

// POST: Add new expense
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { tripId, amount, note, splitWith, currency } = await req.json();

        await dbConnect();

        // Verify Trip Membership
        const trip = await Trip.findById(tripId);
        if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        const isMember = trip.members.some(m => m.userId.toString() === session.user.id) || trip.adminId.toString() === session.user.id;
        if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const expense = await Expense.create({
            tripId,
            payerId: session.user.id,
            amount,
            note,
            splitWith: splitWith || [], // If empty, implies everyone? Or specifically selected.
            currency: currency || 'USD'
        });

        return NextResponse.json({ success: true, expense });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET: Fetch expenses for a trip
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const tripId = searchParams.get('tripId');

        if (!tripId) return NextResponse.json({ error: "Trip ID required" }, { status: 400 });

        await dbConnect();
        // Verify Trip Membership
        const trip = await Trip.findById(tripId);
        if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
        const isMember = trip.members.some(m => m.userId.toString() === session.user.id) || trip.adminId.toString() === session.user.id;
        if (!isMember) return NextResponse.json({ error: "Not a member" }, { status: 403 });

        const expenses = await Expense.find({ tripId })
            .populate('payerId', 'name avatar') // Populate payer info
            .sort({ date: -1 });

        return NextResponse.json({ success: true, expenses });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
