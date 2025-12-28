'use client';
import { useState, useEffect } from 'react';

// 1. TYPES
export type NavView = 'DASHBOARD' | 'PLAN' | 'DISCOVERY' | 'TRIPS' | 'SETTINGS';

interface SidebarProps {
  currentView: NavView;
  onChangeView: (view: NavView) => void;
  
  // Trip Data
  selectedCity: string;
  tripPlan: any[];
  isTripActive: boolean;
  totalDays: number;
  
  // Smart Data
  diet: string;
  travelers: number;
  groupType: string;
  budget: string; // 'LOW' | 'MEDIUM' | 'HIGH'

  // Actions
  onRemoveItem: (id: string) => void;
  onAddToTrip: (place: any) => void;
  onResetApp: () => void;
}

export default function Sidebar({
  currentView,
  onChangeView,
  selectedCity,
  tripPlan,
  isTripActive,
  totalDays,
  diet,
  travelers,
  groupType,
  budget,
  onRemoveItem,
  onResetApp
}: SidebarProps) {

  // 2. THE SALESMAN ENGINE (Cost Calculator)
  const calculateTotalCost = () => {
    // Base costs per person per day
    const basePerDay = 2000; 
    const activityAvg = 500;
    
    // Budget Multiplier
    let multiplier = 1;
    if (budget === 'LOW') multiplier = 0.6;
    if (budget === 'HIGH') multiplier = 2.5;

    // Calculate
    const accommodation = (basePerDay * totalDays * travelers) * multiplier;
    const activities = (tripPlan.length * activityAvg * travelers) * multiplier;
    const platformFee = 150;

    return Math.round(accommodation + activities + platformFee);
  };

  const totalCost = calculateTotalCost();

  return (
    <div className="h-full w-80 bg-white border-r border-gray-100 flex flex-col shadow-xl z-20">
      
      {/* A. HEADER & LOGO */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-50">
        <img 
          src="/logo.png" 
          alt="2wards Logo" 
          className="w-10 h-10 object-contain" 
        />
        <div>
          <h1 className="font-black text-xl tracking-tight text-gray-900">2wards</h1>
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">AI Planner</p>
        </div>
      </div>

      {/* B. NAVIGATION MENU */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        
        {/* DASHBOARD */}
        <button 
          onClick={() => onChangeView('DASHBOARD')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
            ${currentView === 'DASHBOARD' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span>🏠</span> Dashboard
        </button>

        {/* CURRENT TRIP (Only show if active) */}
        {isTripActive && (
          <div className="mt-6 mb-2">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase mb-2">Current Trip</p>
            <button 
              onClick={() => onChangeView('PLAN')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                ${currentView === 'PLAN' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span>✈️</span> {selectedCity}
            </button>
          </div>
        )}

        {/* DISCOVERY */}
        <button 
          onClick={() => onChangeView('DISCOVERY')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
            ${currentView === 'DISCOVERY' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span>🔭</span> Discover
        </button>

        {/* SAVED TRIPS */}
        <button 
          onClick={() => onChangeView('TRIPS')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
            ${currentView === 'TRIPS' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span>📂</span> My Trips
        </button>

        {/* SETTINGS */}
        <button 
          onClick={() => onChangeView('SETTINGS')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
            ${currentView === 'SETTINGS' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <span>⚙️</span> Settings
        </button>
      </nav>

      {/* C. TRIP SUMMARY WIDGET (Only in Plan Mode) */}
      {currentView === 'PLAN' && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Trip Summary</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{tripPlan.length} Stops</span>
            </h3>
            
            {/* ITINERARY LIST (Mini) */}
            <div className="max-h-32 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar">
              {tripPlan.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-2">No places added yet.</p>
              ) : (
                tripPlan.map((place) => (
                  <div key={place.id} className="flex items-center justify-between group">
                    <p className="text-xs text-gray-600 truncate max-w-[140px]">{place.name}</p>
                    <button 
                      onClick={() => onRemoveItem(place.id)}
                      className="text-gray-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* COST ESTIMATOR */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs text-gray-500">Est. Cost ({travelers} ppl)</span>
                <span className="font-black text-lg text-gray-900">₹{totalCost.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-gray-400 text-right">
                {budget === 'LOW' ? 'Budget Friendly' : budget === 'HIGH' ? 'Luxury Trip' : 'Standard Rate'}
              </p>
            </div>

            <button className="w-full mt-4 bg-black text-white py-3 rounded-xl text-xs font-bold hover:scale-105 transition-transform">
              Book Now ➔
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}