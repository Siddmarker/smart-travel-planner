import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import LandingPage from '@/components/LandingPage'
import MainApp from '@/components/MainApp'

export default async function Home() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 1. If NO Session -> Show Landing Page
  if (!session) {
    return <LandingPage />
  }

  // 2. If Session EXISTS -> Show Main App (Pass the user data)
  return <MainApp user={session.user} />
}