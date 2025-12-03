import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { saveUser, findUserByEmail } from '@/lib/auth';

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
        const googleUser = {
            id: payload.sub,
            email: payload.email!,
            name: payload.name!,
            picture: payload.picture,
            email_verified: payload.email_verified
        };

        // Check if user exists, otherwise create/update
        let storedUser = findUserByEmail(googleUser.email);

        if (!storedUser) {
            // Create new user from Google profile
            storedUser = {
                id: googleUser.id,
                name: googleUser.name,
                email: googleUser.email,
                password: '', // No password for OAuth
                avatar: googleUser.picture,
                createdAt: new Date().toISOString()
            };
            saveUser(storedUser);
        }

        // Generate a session token
        const token = `auth-${storedUser.id}-${Date.now()}`;

        return NextResponse.json({
            success: true,
            token: token,
            user: {
                id: storedUser.id,
                name: storedUser.name,
                email: storedUser.email,
                avatar: storedUser.avatar
            },
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
