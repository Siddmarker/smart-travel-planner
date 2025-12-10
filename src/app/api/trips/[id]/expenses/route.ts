import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Expense from '@/models/Expense';
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth'; // Assuming auth setup exists or needs creation

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const expenses = await Expense.find({ tripId: id }).sort({ date: -1 });
        return NextResponse.json({ success: true, expenses });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { id } = await params;

        // Mock user for now if auth not fully integrated in this snippet
        // In real app: const session = await getServerSession(authOptions);
        const user = { _id: new mongoose.Types.ObjectId(), name: 'Test User' };

        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const expense = await Expense.create({
            ...body,
            tripId: id,
            paidBy: {
                userId: user._id,
                name: user.name
            }
        });

        return NextResponse.json({ success: true, expense }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
