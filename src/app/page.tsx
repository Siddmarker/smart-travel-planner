'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// COMPONENTS
import TravelMap from '@/components/TravelMap';
import Sidebar, { NavView } from '@/components/Sidebar';
import TripSetup from '@/components/TripSetup';
import DashboardView from '@/components/DashboardView';
import LandingPage from '@/components/LandingPage';
import DiscoveryView from '@/components/DiscoveryView'; // <--- NEW IMPORT

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const searchParams = useSearchParams();
  
  // --- AUTH STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // 1. Check for "Fake" login (from Email Form)
    if (searchParams.get('loggedin') === 'true') {
      setIsLoggedIn(true);
      return; 
    }

    // 2. Check for "Real" login (Google / Supabase)
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
  // This is the variable that was missing!
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

  // 1. NOT LOGGED IN -> SHOW LANDING PAGE
  if (!isLoggedIn) {
    return <LandingPage />;
  }

  // 2. LOGGED IN -> SHOW APP
  
  // Sub-Scenario: Planning but setup incomplete -> Show Wizard Form
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
      
      {/* GLOBAL SIDEBAR */}
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative bg-gray-50">
        
        {/* VIEW 1: DASHBOARD */}
        {currentView === 'DASHBOARD' && (
          <DashboardView 
            onPlanTrip={() => setCurrentView('PLAN')} 
            onDiscovery={() => setCurrentView('DISCOVERY')} 
          />
        )}

        {/* VIEW 2: NEW DISCOVERY PAGE */}
        {currentView === 'DISCOVERY' && (
          <DiscoveryView onAddToTrip={addToTrip} /> 
        )}

        {/* VIEW 3: SETTINGS */}
        {currentView === 'SETTINGS' && (
          <div className="p-10"><h1 className="text-2xl font-bold">Settings</h1></div>
        )}

        {/* VIEW 4: MAP (Only for PLAN and TRIPS) */}
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