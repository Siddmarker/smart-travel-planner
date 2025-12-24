'use client';
import { useState } from 'react';
import TravelMap from '@/components/TravelMap';
import Sidebar, { NavView } from '@/components/Sidebar';
import TripSetup from '@/components/TripSetup';
import DashboardView from '@/components/DashboardView';

export default function Home() {
  // 1. APP STATE
  const [currentView, setCurrentView] = useState<NavView>('DASHBOARD');
  
  // 2. TRIP DATA STATE
  const [city, setCity] = useState<string>('COORG'); 
  const [filter, setFilter] = useState<string>('ALL');
  const [tripPlan, setTripPlan] = useState<any[]>([]);
  const [totalDays, setTotalDays] = useState(1);
  const [isSetupDone, setIsSetupDone] = useState(false);

  // 3. HANDLERS
  const handleSetupComplete = (details: { city: string; type: string; days: number }) => {
    setCity(details.city);
    setFilter(details.type);
    setTotalDays(details.days);
    setIsSetupDone(true);
    setCurrentView('PLAN'); // Go straight to planner
  };

  const handleCreateNewTrip = () => {
    setIsSetupDone(false); // Show form again
  };

  const addToTrip = (place: any) => {
    if (!tripPlan.find((p) => p.id === place.id)) setTripPlan([...tripPlan, place]);
  };
  const removeFromTrip = (placeId: string) => {
    setTripPlan(tripPlan.filter((p) => p.id !== placeId));
  };

  // 4. CONDITIONAL RENDERING

  // If user is in "Plan" mode but hasn't set up the trip details yet -> Show Form
  if (currentView === 'PLAN' && !isSetupDone) {
     return (
       <TripSetup 
         onComplete={handleSetupComplete} 
         onSkip={() => {
           setIsSetupDone(true);
           setCurrentView('DISCOVERY'); // Skip to discovery
         }} 
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
      <div className="flex-1 relative">
        
        {/* SHOW DASHBOARD */}
        {currentView === 'DASHBOARD' && (
          <DashboardView onCreateTrip={() => setCurrentView('PLAN')} />
        )}

        {/* SHOW SETTINGS (Placeholder) */}
        {currentView === 'SETTINGS' && (
          <div className="p-10">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-500">Account settings coming soon...</p>
          </div>
        )}

        {/* SHOW MAP (For Plan & Discovery) */}
        {(currentView === 'PLAN' || currentView === 'DISCOVERY' || currentView === 'TRIPS') && (
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