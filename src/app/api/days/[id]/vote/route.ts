
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Day from "@/models/Day";
import Trip from "@/models/Trip";
import mongoose from "mongoose";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Day ID
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { period, candidateId, action } = await req.json(); // action: 'vote' | 'unvote'

        if (!['morning', 'afternoon', 'evening'].includes(period)) {
            return NextResponse.json({ error: "Invalid period" }, { status: 400 });
        }

        await dbConnect();

        // 1. Fetch Day and Verify Trip Membership
        const day = await Day.findById(id);
        if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });

        if (day.status !== 'VOTING') {
            return NextResponse.json({ error: "Voting is not active for this day" }, { status: 400 });
        }

        const trip = await Trip.findById(day.tripId);
        if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

        const isMember = trip.members.some(m => m.userId.toString() === session.user.id) || trip.adminId.toString() === session.user.id;
        if (!isMember) {
            return NextResponse.json({ error: "Not a member of this trip" }, { status: 403 });
        }

        // 2. Locate Candidate and Update Votes
        // Access votingPool
        const candidates = (day.votingPool as any)[period];
        const candidate = candidates.find((c: any) => c.id === candidateId);

        if (!candidate) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        // Initialize votes array if needed
        if (!candidate.votes) candidate.votes = [];

        const userIdStr = session.user.id.toString();
        const voteIndex = candidate.votes.findIndex((v: any) => v.userId.toString() === userIdStr);

        if (action === 'unvote') {
            if (voteIndex > -1) {
                candidate.votes.splice(voteIndex, 1);
            }
        } else {
            // Vote - new structure { userId, vote: 'up' }
            if (voteIndex === -1) {
                candidate.votes.push({ userId: new mongoose.Types.ObjectId(userIdStr), vote: 'up' });
            } else {
                // Update existing vote if needed (e.g. switch up/down)
                candidate.votes[voteIndex].vote = 'up';
            }
        }

        // Save
        await day.save();

        return NextResponse.json({ success: true, day });

    } catch (error: any) {
        console.error("Error casting vote:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
