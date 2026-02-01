import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // If there is a "next" parameter, redirect there after login. Default to home.
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    // Create a temporary Supabase client to exchange the code for a session
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )
    
    // Exchange the auth code for a user session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful login -> Redirect to the app
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Login failed -> Redirect to an error page or home
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}