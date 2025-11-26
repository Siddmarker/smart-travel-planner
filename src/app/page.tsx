'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Discover Amazing Places
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10">
              Plan your perfect trip with AI-powered recommendations, budget tracking, and collaborative tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                // Show dashboard button if logged in
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                // Show auth buttons if not logged in
                <>
                  <Link href="/signup">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                      Get Started Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose 2wards?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-xl shadow-sm border">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Planning</h3>
              <p className="text-muted-foreground">Smart recommendations based on your preferences and travel style.</p>
            </div>

            <div className="bg-background p-8 rounded-xl shadow-sm border">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Global Coverage</h3>
              <p className="text-muted-foreground">Discover hidden gems and popular attractions from around the world.</p>
            </div>

            <div className="bg-background p-8 rounded-xl shadow-sm border">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Budget Tracking</h3>
              <p className="text-muted-foreground">Plan and track your expenses in any currency with real-time conversion.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
