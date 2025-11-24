import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { findUserByEmail, createUser, saveUser } from '@/lib/auth';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback_secret_do_not_use_in_production');

const client = new OAuth2Client(CLIENT_ID);

export async function POST(req: NextRequest) {
    try {
        const { credential } = await req.json();

        if (!credential) {
            return NextResponse.json({ error: 'No credential provided' }, { status: 400 });
        }

        // Verify the Google token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email_verified || !payload.email) {
            return NextResponse.json({ error: 'Invalid token or email not verified' }, { status: 401 });
        }

        // Check if user exists
        let user = findUserByEmail(payload.email);

        if (!user) {
            // Create new user
            user = createUser(
                payload.name || 'Google User',
                payload.email,
                '' // No password for OAuth
            );
            // Update avatar from Google
            if (payload.picture) {
                user.avatar = payload.picture;
                saveUser(user); // Update stored user with avatar
            }
        } else {
            // Update avatar if changed
            if (payload.picture && user.avatar !== payload.picture) {
                user.avatar = payload.picture;
                saveUser(user);
            }
        }

        // Generate JWT
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            name: user.name,
            picture: user.avatar
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
            sameSite: 'lax'
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar
            }
        });

    } catch (error: any) {
        console.error('Google auth error:', error);
        return NextResponse.json({
            error: 'Authentication failed',
            details: error.message
        }, { status: 500 });
    }
}
