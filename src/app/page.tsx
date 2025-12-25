'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// COMPONENTS
import TravelMap from '@/components/TravelMap';
import Sidebar, { NavView } from '@/components/Sidebar';
import TripSetup from '@/components/TripSetup';
import DashboardView from '@/components/DashboardView';
import LandingPage from '@/components/LandingPage';
import DiscoveryView from '@/components/DiscoveryView';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- MAIN APP LOGIC ---
function MainApp() {
  const searchParams = useSearchParams();
  
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // 1. Check for "Fake" login (email)
    if (searchParams.get('loggedin') === 'true') {
      setIsLoggedIn(true);
      return; 
    }

    // 2. Check for "Real" login (Google)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        // Clean URL
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [searchParams]);

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<NavView>('DASHBOARD');
  
  // Trip Details State
  const [city, setCity] = useState<string>('COORG'); 
  const [filter, setFilter] = useState<string>('ALL'); // 'SOLO', 'FAMILY', etc.
  const [totalDays, setTotalDays] = useState(1);
  const [travelers, setTravelers] = useState(1); // New
  const [diet, setDiet] = useState('VEG');       // New
  
  const [tripPlan, setTripPlan] = useState<any[]>([]);
  const [isSetupDone, setIsSetupDone] = useState(false);

  // --- HANDLERS ---
  
  // Updated to accept the new rich data from TripSetup
  const handleSetupComplete = (details: any) => {
    setCity(details.city);
    setFilter(details.type);
    setTotalDays(details.days);
    setTravelers(details.travelers); // Store for future use
    setDiet(details.diet);           // Store for future use
    
    setIsSetupDone(true);
    setCurrentView('PLAN'); 
  };

  const handleCreateNewTrip = () => { setIsSetupDone(false); };
  
  const addToTrip = (place: any) => { 
    if (!tripPlan.find((p) => p.id === place.id)) setTripPlan([...tripPlan, place]); 
  };
  
  const removeFromTrip = (placeId: string) => { 
    setTripPlan(tripPlan.filter((p) => p.id !== placeId)); 
  };

  // --- RENDER LOGIC ---

  // 1. Not Logged In
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // 2. Planning Mode but Setup Incomplete -> Show Wizard
  if (currentView === 'PLAN' && !isSetupDone) {
     return (
       <TripSetup 
         onComplete={handleSetupComplete} 
         onSkip={() => { setIsSetupDone(true); setCurrentView('DISCOVERY'); }} 
       />
     );
  }

  // HELPER: Decide if Sidebar should be visible
  const showSidebar = currentView === 'PLAN' || currentView === 'TRIPS';

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
      
      {/* SIDEBAR (Only visible in Plan/Trips) */}
      {showSidebar && (
        <Sidebar 
          currentView={currentView}
          onChangeView={setCurrentView}
          onCitySelect={setCity} 
          selectedCity={city}
          onFilterChange={setFilter}
          activeFilter={filter}
          tripPlan={tripPlan}
          onRemoveItem={removeFromTrip}
          onAddToTrip={addToTrip}
          isTripActive={currentView === 'PLAN'}
          totalDays={totalDays}
          onResetApp={handleCreateNewTrip}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative bg-gray-50 h-full overflow-hidden">
        
        {/* VIEW: DASHBOARD (Full Screen) */}
        {currentView === 'DASHBOARD' && (
          <DashboardView 
            onPlanTrip={() => setCurrentView('PLAN')} 
            onDiscovery={() => setCurrentView('DISCOVERY')} 
          />
        )}

        {/* VIEW: DISCOVERY (Full Screen) */}
        {currentView === 'DISCOVERY' && (
          <DiscoveryView 
            onAddToTrip={addToTrip} 
            onBack={() => setCurrentView('DASHBOARD')} 
          /> 
        )}

        {/* VIEW: SETTINGS */}
        {currentView === 'SETTINGS' && (
           <div className="p-10">
             <button onClick={() => setCurrentView('DASHBOARD')} className="mb-4 text-sm text-gray-500 hover:text-black">← Back</button>
             <h1 className="text-2xl font-bold">Settings</h1>
             <p className="text-gray-500 mt-4">Account settings coming soon...</p>
           </div>
        )}

        {/* VIEW: MAP (Only for Plan & Trips) */}
        {showSidebar && (
          <TravelMap 
            selectedCity={city} 
            activeFilter={filter}
            onAddToTrip={addToTrip}
            tripPlan={tripPlan} 
          />
        )}
      </div>
    </main>
  );
}

// --- EXPORT WITH SUSPENSE (Required for Deployment) ---
export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading 2wards...</div>}>
      <MainApp />
    </Suspense>
  );
}