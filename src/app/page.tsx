'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PremiumHeroSection } from '@/components/LandingPage/PremiumHeroSection';
import { FeaturesShowcase } from '@/components/LandingPage/FeaturesShowcase';
import { HowItWorksSection } from '@/components/LandingPage/HowItWorksSection';
import { FinalCTASection } from '@/components/LandingPage/FinalCTASection';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background premium-theme">
      <PremiumHeroSection user={user} />
      <FeaturesShowcase />
      <HowItWorksSection />
      <FinalCTASection user={user} />

      {/* Footer / Final CTA */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">SmartTravel</h3>
              <p className="text-gray-400">
                Your intelligent companion for seamless travel planning and unforgettable adventures.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>About Us</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Blog</li>
                <li>Community</li>
                <li>Help Center</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SmartTravel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
