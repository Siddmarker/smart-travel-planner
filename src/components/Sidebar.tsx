'use client';
import { useState } from 'react';

export type NavView = 'DASHBOARD' | 'DISCOVERY' | 'TRIPS' | 'SETTINGS' | 'PLAN' | 'COLLAB';

interface SidebarProps {
  currentView: NavView;
  onChangeView: (view: NavView) => void;
  selectedCity?: string;
  tripPlan?: any[];
  isTripActive?: boolean;
  totalDays?: number;
  budget?: string;
  travelers?: number;
  diet?: string;
  groupType?: string;
  onRemoveItem?: (id: string) => void;
  onAddToTrip?: (place: any) => void;
  onResetApp?: () => void;
}

export default function Sidebar({ 
  currentView, 
  onChangeView, 
  selectedCity, 
  tripPlan = [],
  isTripActive,
  totalDays,
  budget,
  travelers,
  diet,
  groupType,
  onRemoveItem,
  onResetApp
}: SidebarProps) {
  
  return (
    <aside className="w-64 bg-white h-full border-r border-gray-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
      {/* LOGO - CLICK TO GO HOME */}
      <div 
        onClick={() => onChangeView('DASHBOARD')} 
        className="p-6 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">2w</div>
          <div className="flex flex-col">
            <span className="font-black text-lg leading-none tracking-tight">2wards</span>
            <span className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">AI Planner</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        <NavItem 
          icon="🏠" 
          label="Dashboard" 
          isActive={currentView === 'DASHBOARD'} 
          onClick={() => onChangeView('DASHBOARD')} 
        />
        
        {/* Only show "Current Trip" link if a trip exists */}
        {tripPlan.length > 0 && (
           <NavItem 
             icon="✈️" 
             label={selectedCity || "Current Trip"} 
             isActive={currentView === 'PLAN' || currentView === 'COLLAB'} 
             onClick={() => onChangeView('PLAN')} 
           />
        )}

        <NavItem 
          icon="🔭" 
          label="Discover" 
          isActive={currentView === 'DISCOVERY'} 
          onClick={() => onChangeView('DISCOVERY')} 
        />
        <NavItem 
          icon="📂" 
          label="My Trips" 
          isActive={currentView === 'TRIPS'} 
          onClick={() => onChangeView('TRIPS')} 
        />
        <NavItem 
          icon="⚙️" 
          label="Settings" 
          isActive={currentView === 'SETTINGS'} 
          onClick={() => onChangeView('SETTINGS')} 
        />
      </nav>

      {/* TRIP SUMMARY CARD (Mini Widget) */}
      {isTripActive && tripPlan.length > 0 && (
        <div className="p-4 m-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip Stats</span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{tripPlan.length} Stops</span>
          </div>
          
          <div className="space-y-2 mb-4">
             <div className="flex justify-between text-xs text-gray-600"><span>📅 Days</span><span className="font-bold">{totalDays}</span></div>
             <div className="flex justify-between text-xs text-gray-600"><span>👥 Travelers</span><span className="font-bold">{travelers}</span></div>
             <div className="flex justify-between text-xs text-gray-600"><span>💰 Budget</span><span className="font-bold">{budget}</span></div>
             <div className="flex justify-between text-xs text-gray-600"><span>🥗 Diet</span><span className="font-bold">{diet}</span></div>
          </div>

          <button 
            onClick={onResetApp}
            className="w-full py-2 bg-white border border-gray-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors"
          >
            🗑️ Reset Trip
          </button>
        </div>
      )}
    </aside>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200
        ${isActive 
          ? 'bg-black text-white shadow-lg shadow-gray-200' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}