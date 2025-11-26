'use client';

import { useAuth } from '@/contexts/AuthContext';
import { HeroSection } from '@/components/LandingPage/HeroSection';
import { FeaturesShowcase } from '@/components/LandingPage/FeaturesShowcase';
import { HowItWorksSection } from '@/components/LandingPage/HowItWorksSection';
import { PricingSection } from '@/components/LandingPage/PricingSection';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <HeroSection user={user} />
      <FeaturesShowcase />
      <HowItWorksSection />
      <PricingSection />

      {/* Footer / Final CTA */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start your adventure?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who are planning smarter, better trips with our AI-powered platform.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-700 transition-colors" onClick={() => window.location.href = '/signup'}>
              Get Started Free
            </button>
            <button className="px-8 py-3 border border-gray-600 rounded-full font-bold hover:bg-gray-800 transition-colors" onClick={() => window.location.href = '/login'}>
              Sign In
            </button>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-gray-500 text-sm">
            © {new Date().getFullYear()} TravelPlanner. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
