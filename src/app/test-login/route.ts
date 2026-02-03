import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    // Exchange the auth code for a user session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // SUCCESS: Redirect to the app
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Supabase Auth Error:", error.message)
    }
  }

  // FAILURE: Instead of a missing error page, go to Home with an error flag
  return NextResponse.redirect(`${origin}/?error=login_failed`)
}