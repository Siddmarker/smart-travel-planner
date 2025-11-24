import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback_secret_do_not_use_in_production');

export async function GET(req: NextRequest) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        return NextResponse.json({
            authenticated: true,
            user: {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                avatar: payload.picture
            }
        });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
    }
}
