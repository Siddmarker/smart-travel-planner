'use client';
import { useState } from 'react';
import TravelMap from '@/components/TravelMap';
import Sidebar from '@/components/Sidebar';
import TripSetup from '@/components/TripSetup';

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [city, setCity] = useState<string>('COORG'); 
  const [filter, setFilter] = useState<string>('ALL');
  const [tripPlan, setTripPlan] = useState<any[]>([]);
  const [totalDays, setTotalDays] = useState(1);

  const handleSetupComplete = (details: { city: string; type: string; days: number }) => {
    setCity(details.city);
    setFilter(details.type); // This ensures 'FAMILY' is set
    setTotalDays(details.days);
    setHasStarted(true);
  };

  // NEW: Function to fully reset the app to the white form
  const resetApp = () => {
    setHasStarted(false);
    setTripPlan([]);
    setFilter('ALL');
  };

  const addToTrip = (place: any) => {
    if (!tripPlan.find((p) => p.id === place.id)) {
      setTripPlan([...tripPlan, place]);
    }
  };

  const removeFromTrip = (placeId: string) => {
    setTripPlan(tripPlan.filter((p) => p.id !== placeId));
  };

  if (!hasStarted) {
    return <TripSetup onComplete={handleSetupComplete} />;
  }

  return (
    <main className="flex h-screen w-screen overflow-hidden">
      <Sidebar 
        onCitySelect={setCity} 
        selectedCity={city}
        onFilterChange={setFilter}
        activeFilter={filter}
        tripPlan={tripPlan}
        onRemoveItem={removeFromTrip}
        onAddToTrip={addToTrip}
        isTripActive={hasStarted}
        totalDays={totalDays}
        onResetApp={resetApp} // Pass the reset function down
      />
      <div className="flex-1 relative">
        <TravelMap 
          selectedCity={city} 
          activeFilter={filter}
          onAddToTrip={addToTrip}
          tripPlan={tripPlan} 
        />
      </div>
    </main>
  );
}