'use client';
import { useState, useEffect } from 'react';

export type NavView = 'DASHBOARD' | 'DISCOVERY' | 'TRIPS' | 'SETTINGS' | 'PLAN' | 'COLLAB';

interface SidebarProps {
  currentView: NavView;
  onChangeView: (view: NavView) => void;
  isOpen: boolean;             // NEW: Controls mobile visibility
  onClose: () => void;         // NEW: Closes mobile menu
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
  isOpen,       // Receive state
  onClose,      // Receive handler
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
  
  // Close sidebar automatically when switching views on mobile
  const handleMobileNav = (view: NavView) => {
    onChangeView(view);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* MOBILE OVERLAY (Darkens background when menu is open) */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* SIDEBAR CONTAINER */}
      <aside className={`
        fixed lg:static top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 flex flex-col shadow-2xl lg:shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* LOGO HEADER */}
        <div className="p-6 flex justify-between items-center">
          <div onClick={() => handleMobileNav('DASHBOARD')} className="flex items-center gap-3 cursor-pointer hover:opacity-80">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="2w" className="w-5 h-5 object-contain"/> 
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg text-gray-900 tracking-tight">2wards</span>
              <span className="text-[9px] font-bold text-blue-500 tracking-[0.2em] uppercase">AI Planner</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-900">
            ✕
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <NavItem icon="🏠" label="Dashboard" isActive={currentView === 'DASHBOARD'} onClick={() => handleMobileNav('DASHBOARD')} />
          {tripPlan.length > 0 && (
             <NavItem icon="✈️" label={selectedCity || "Current Trip"} isActive={currentView === 'PLAN' || currentView === 'COLLAB'} onClick={() => handleMobileNav('PLAN')} />
          )}
          <NavItem icon="🔭" label="Discover" isActive={currentView === 'DISCOVERY'} onClick={() => handleMobileNav('DISCOVERY')} />
          {/* <NavItem icon="📂" label="My Trips" isActive={currentView === 'TRIPS'} onClick={() => handleMobileNav('TRIPS')} /> */}
          <NavItem icon="⚙️" label="Settings" isActive={currentView === 'SETTINGS'} onClick={() => handleMobileNav('SETTINGS')} />
        </nav>

        {/* TRIP SUMMARY WIDGET */}
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
            </div>
            <button onClick={onResetApp} className="w-full py-2 bg-white border border-gray-200 text-red-500 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors">🗑️ Reset Trip</button>
          </div>
        )}
      </aside>
    </>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? 'bg-black text-white shadow-lg shadow-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );
}