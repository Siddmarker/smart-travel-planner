
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

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

        // Simulate user creation delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock successful user creation
        // In a real app:
        // 1. Check if user exists in DB
        // 2. Hash password
        // 3. Create user record
        // 4. Generate JWT

        const mockUser = {
            id: uuidv4(),
            name,
            email,
        };

        const mockToken = `mock-jwt-token-${uuidv4()}`;

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: mockUser,
            token: mockToken
        }, { status: 201 });

    } catch (error) {
        console.error('Signup API error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
