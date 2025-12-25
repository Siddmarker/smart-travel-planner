'use client';
import { useState, useEffect, Suspense } from 'react'; // <--- Added Suspense
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

// --- 1. MOVE MAIN LOGIC INTO A CHILD COMPONENT ---
function MainApp() {
  const searchParams = useSearchParams(); // This is what causes the build error if not suspended!
  
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // 1. Check for "Fake" login
    if (searchParams.get('loggedin') === 'true') {
      setIsLoggedIn(true);
      return; 
    }

    // 2. Check for "Real" login
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
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
  const [city, setCity] = useState<string>('COORG'); 
  const [filter, setFilter] = useState<string>('ALL');
  const [tripPlan, setTripPlan] = useState<any[]>([]);
  const [totalDays, setTotalDays] = useState(1);
  const [isSetupDone, setIsSetupDone] = useState(false);

  // --- HANDLERS ---
  const handleSetupComplete = (details: { city: string; type: string; days: number }) => {
    setCity(details.city);
    setFilter(details.type);
    setTotalDays(details.days);
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

  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // Sub-Scenario: Planning but setup incomplete
  if (currentView === 'PLAN' && !isSetupDone) {
     return (
       <TripSetup 
         onComplete={handleSetupComplete} 
         onSkip={() => { setIsSetupDone(true); setCurrentView('DISCOVERY'); }} 
       />
     );
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-white">
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

      <div className="flex-1 relative bg-gray-50">
        {currentView === 'DASHBOARD' && (
          <DashboardView 
            onPlanTrip={() => setCurrentView('PLAN')} 
            onDiscovery={() => setCurrentView('DISCOVERY')} 
          />
        )}

        {currentView === 'DISCOVERY' && (
          <DiscoveryView onAddToTrip={addToTrip} /> 
        )}

        {currentView === 'SETTINGS' && (
          <div className="p-10"><h1 className="text-2xl font-bold">Settings</h1></div>
        )}

        {(currentView === 'PLAN' || currentView === 'TRIPS') && (
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

// --- 2. THE EXPORTED COMPONENT IS NOW JUST A WRAPPER ---
export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading 2wards...</div>}>
      <MainApp />
    </Suspense>
  );
}