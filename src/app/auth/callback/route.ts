import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // If there is a "next" parameter, redirect there after login. Default to home.
  const next = searchParams.get('next') ?? '/'

  // Log incoming request for debugging
  console.log('🔍 Auth Callback - Incoming request:', {
    hasCode: !!code,
    origin,
    next,
    timestamp: new Date().toISOString(),
  })

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful login -> Redirect to the app
      console.log('✅ Auth Callback - Success:', {
        userId: data?.user?.id,
        email: data?.user?.email,
      })
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Log detailed error information
    console.error('❌ Auth Callback - Error:', {
      error: error.message,
      status: error.status,
      code: error.code,
      timestamp: new Date().toISOString(),
    })

    // Redirect to error page with error details
    const errorUrl = new URL(`${origin}/auth/auth-code-error`)
    errorUrl.searchParams.set('error', error.name || 'AuthError')
    errorUrl.searchParams.set('error_description', error.message)
    if (error.status) {
      errorUrl.searchParams.set('error_code', error.status.toString())
    }

    return NextResponse.redirect(errorUrl.toString())
  }

  // No code provided - redirect to error page
  console.error('❌ Auth Callback - No code provided')
  const errorUrl = new URL(`${origin}/auth/auth-code-error`)
  errorUrl.searchParams.set('error', 'MissingCode')
  errorUrl.searchParams.set('error_description', 'No authentication code was provided')

  return NextResponse.redirect(errorUrl.toString())
}