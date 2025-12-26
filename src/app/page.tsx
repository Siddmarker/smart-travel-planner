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
import InviteModal from '@/components/InviteModal';

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
        // Clean URL hash if present
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
  const [city, setCity] = useState<string>('Bengaluru'); 
  const [filter, setFilter] = useState<string>('SOLO'); // maps to 'groupType'
  const [totalDays, setTotalDays] = useState(1);
  const [travelers, setTravelers] = useState(1); 
  const [diet, setDiet] = useState('ANY');
  const [budget, setBudget] = useState('MEDIUM'); // <--- NEW BUDGET STATE
  
  // Cloud State
  const [tripId, setTripId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const [tripPlan, setTripPlan] = useState<any[]>([]);
  const [isSetupDone, setIsSetupDone] = useState(false);

  // --- HANDLERS ---
  
  const handleSetupComplete = (details: any) => {
    // Basic Details
    setCity(details.city);
    setFilter(details.type); // 'SOLO', 'FAMILY', etc.
    setTotalDays(details.days);
    setTravelers(details.travelers); 
    setDiet(details.diet);
    setBudget(details.budget); // <--- CAPTURE BUDGET
    
    // Cloud Details
    setTripId(details.tripId);
    setIsAdmin(details.isAdmin);

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

  // Sub-Scenario: Planning but setup incomplete -> Show Wizard
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
    <main className="flex h-screen w-screen overflow-hidden bg-white relative">
      
      {/* 1. INVITE MODAL OVERLAY */}
      {showInvite && tripId && (
        <InviteModal tripId={tripId} onClose={() => setShowInvite(false)} />
      )}

      {/* 2. SIDEBAR (Only visible in Plan/Trips) */}
      {showSidebar && (
        <>
          <Sidebar 
            currentView={currentView}
            onChangeView={setCurrentView}
            
            // Data Props
            selectedCity={city}
            tripPlan={tripPlan}
            isTripActive={currentView === 'PLAN'}
            totalDays={totalDays}
            
            // Actions
            onRemoveItem={removeFromTrip}
            onAddToTrip={addToTrip}
            onResetApp={handleCreateNewTrip}

            // Smart Data
            diet={diet}
            travelers={travelers}
            groupType={filter}
            budget={budget} // <--- PASS BUDGET TO SIDEBAR
          />
          
          {/* FLOATING ADMIN BUTTON (Only if Admin & Sidebar is visible) */}
          {isAdmin && (
            <button 
               onClick={() => setShowInvite(true)}
               className="fixed bottom-6 right-6 z-40 bg-black text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 border-2 border-white/20"
            >
              <span>👤+</span> Invite Friends
            </button>
          )}
        </>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <div className="flex-1 relative bg-gray-50 h-full overflow-hidden">
        
        {/* VIEW: DASHBOARD */}
        {currentView === 'DASHBOARD' && (
          <DashboardView 
            onPlanTrip={() => setCurrentView('PLAN')} 
            onDiscovery={() => setCurrentView('DISCOVERY')} 
          />
        )}

        {/* VIEW: DISCOVERY */}
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

        {/* VIEW: MAP */}
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