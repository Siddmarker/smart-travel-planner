import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { credential } = body;

        if (!credential) {
            return NextResponse.json(
                { error: 'No credential provided' },
                { status: 400 }
            );
        }

        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('Invalid token payload');
        }

        // Extract user info from the verified payload
        const user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            email_verified: payload.email_verified
        };

        // Generate a session token (in a real app, sign a JWT here)
        const token = `auth-${user.id}-${Date.now()}`;

        return NextResponse.json({
            success: true,
            token: token,
            user: user,
            redirectTo: '/dashboard'
        });

    } catch (error: any) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            {
                error: 'Authentication failed',
                details: error.message
            },
            { status: 401 }
        );
    }
}
