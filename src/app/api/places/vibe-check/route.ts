
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { NextResponse } from "next/server";
import { getPlaceVibeCheck } from "@/lib/geminiService";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            // Optional: Allow public access if needed, but safer to require login
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { placeName, locationContext } = await req.json();

        if (!placeName) {
            return NextResponse.json({ error: "Place name is required" }, { status: 400 });
        }

        const vibe = await getPlaceVibeCheck(placeName, locationContext);

        if (!vibe) {
            return NextResponse.json({ error: "Failed to generate vibe check" }, { status: 500 });
        }

        return NextResponse.json({ success: true, vibe });

    } catch (error) {
        console.error("Error in Vibe Check API:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
