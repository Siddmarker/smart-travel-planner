import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // 1. Await the cookies (Required for Next.js 15)
    const cookieStore = await cookies();
    
    // 2. Initialize Supabase
    // We cast cookieStore to 'any' to fix the red line error
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore as any 
    });
    
    // 3. Exchange Code for Session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 4. Redirect to home
  return NextResponse.redirect(requestUrl.origin);
}