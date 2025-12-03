
import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/auth';

// Mock database for demonstration if no real DB is connected
// In a real app, you would import your DB connection here

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // Basic validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = findUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Create new user
        const newUser = createUser(name, email, password);

        // Generate a simple token (in production use real JWT)
        const token = `auth-${newUser.id}-${Date.now()}`;

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar
            },
            token: token
        }, { status: 201 });

    } catch (error) {
        console.error('Signup API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
