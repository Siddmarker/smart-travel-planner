'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useLoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- COMPONENTS ---
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';
import DashboardView from '@/components/DashboardView';
import CreateTripWizard from '@/components/CreateTripWizard';
import ItineraryDisplay from '@/components/ItineraryDisplay';

// --- NEW UI COMPONENTS (2026 Features) ---
import DayDrawer from '@/components/DayDrawer';
import VibeMarker from '@/components/VibeMarker';
import HapticSlider from '@/components/HapticSlider';

// --- LIBRARIES ---
const LIBRARIES: ("places")[] = ["places"];

// --- CONSTANTS ---
const DAILY_TEMPLATE = [
  {
    id: 'MORNING',
    label: 'Morning Exploration',
    types: ['park', 'nature', 'temple', 'religious', 'landmark', 'museum', 'fort', 'sightseeing', 'falls', 'view point']
  },
  {
    id: 'LUNCH',
    label: 'Lunch Break',
    types: ['restaurant', 'cafe', 'food', 'kitchen', 'bistro', 'dining', 'eatery', 'iconic', 'mess', 'bhavan']
  },
  {
    id: 'AFTERNOON',
    label: 'Afternoon Vibe',
    types: ['museum', 'gallery', 'mall', 'shopping', 'zoo', 'aquarium', 'hall', 'monument', 'market']
  },
  {
    id: 'EVENING',
    label: 'Evening Chill',
    types: ['park', 'sunset', 'lake', 'club', 'pub', 'bar', 'theater', 'beach', 'turf', 'bridge']
  },
  {
    id: 'DINNER',
    label: 'Dinner Feast',
    types: ['restaurant', 'food', 'bar', 'grill', 'kitchen', 'dine', 'late_night', 'dhaba', 'hotel']
  }
];

const TRIP_VIBES = [
  { id: 'leisure', label: 'Relaxing', keywords: ['resort', 'park', 'spa', 'lake', 'nature'] },
  { id: 'foodie', label: 'Foodie', keywords: ['restaurant', 'cafe', 'late_night', 'pub', 'bar', 'kitchen'] },
  { id: 'heritage', label: 'Heritage', keywords: ['temple', 'museum', 'fort', 'iconic', 'landmark', 'palace'] },
  { id: 'adventure', label: 'Adventure', keywords: ['off_roading', 'amusement_park', 'turf', 'trek', 'falls'] },
  { id: 'shopping', label: 'Shopping', keywords: ['mall', 'market', 'shopping', 'store'] }
];

const MAP_STYLES = { width: '100%', height: '100%' };

const NON_FOOD_KEYWORDS = [
  'resort', 'inn', 'stay', 'cottage', 'residency', 'lodge', 'dorm', 'hostel', 'room',
  'living', 'apartment', 'villa', 'bnb', 'homestay', 'temple', 'shrine', 'worship',
  'church', 'mosque', 'fort', 'park', 'garden', 'museum', 'dam', 'falls', 'view point',
  'market', 'stand', 'store', 'shop', 'complex', 'race', 'bridge', 'river', 'lake'
];

const ACCOMMODATION_KEYWORDS = [
  'resort', 'inn', 'stay', 'cottage', 'residency', 'lodge', 'dorm', 'hostel', 'room',
  'living', 'apartment', 'villa', 'bnb', 'homestay', 'hotel', 'palace', 'luxury', 'boutique'
];

// --- INTERFACES ---
export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  description?: string;
  zone_id?: string;
  city?: string;
  safety_score?: number;
  trend_score?: number;
  authenticity_score?: number;
  price_tier?: string;
  price_level?: number;
  vibes?: string[];
  best_time_tags?: string[];
  capacity_tier?: string;
  amenities?: string[];
  aiScore?: number;
  image?: string;
  votes?: number;
  distanceFromLast?: string;
  rating?: number;
  time?: string;
  photos?: any[]; // Needed for VibeMarker
}

interface SelectionStep {
  day: number;
  slotLabel: string;
  candidates: Place[];
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface Expense {
  id: string;
  who: string;
  what: string;
  amount: number;
}

interface PackingItem {
  id: string;
  text: string;
  checked: boolean;
}

// --- MAIN APP COMPONENT ---
export default function MainApp({ user }: { user: any }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  // --- APP NAVIGATION STATE ---
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showWizard, setShowWizard] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- TRIP DATA STATE ---
  const [tripMeta, setTripMeta] = useState<any>({});
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // --- SELECTION / PLANNING STATE ---
  const [selectionQueue, setSelectionQueue] = useState<SelectionStep[]>([]);
  const [currentSelectionIdx, setCurrentSelectionIdx] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);

  // --- USER SETTINGS STATE ---
  const [userSettings, setUserSettings] = useState({
    name: 'Traveler',
    email: user?.email || '',
    currency: 'INR',
    language: 'English',
    notifications: true,
    theme: 'light'
  });

  // --- COLLABORATION & TOOLS STATE ---
  const [collabTab, setCollabTab] = useState<'MEMBERS' | 'CHAT' | 'SPLIT' | 'PACKING'>('MEMBERS');
  const [tripMembers, setTripMembers] = useState<string[]>(['You']);
  const [inviteLink, setInviteLink] = useState('');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'System', text: 'Welcome to the Trip Chat!', time: '10:00 AM', isMe: false }
  ]);
  const [newMessage, setNewMessage] = useState('');

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ what: '', amount: '', who: 'You' });

  // Packing List
  const [packingList, setPackingList] = useState<PackingItem[]>([
    { id: '1', text: 'Passport / ID', checked: false },
    { id: '2', text: 'Chargers & Cables', checked: false },
    { id: '3', text: 'First Aid Kit', checked: false },
  ]);
  const [newPackingItem, setNewPackingItem] = useState('');

  // --- AI ASSISTANT & MAP STATE ---
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiActivePlace, setAiActivePlace] = useState<Place | null>(null);
  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>([]);
  const [aiQuery, setAiQuery] = useState('');
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // --- HELP & FEEDBACK STATE ---
  const [helpTab, setHelpTab] = useState<'GUIDE' | 'FEEDBACK'>('GUIDE');
  const [feedbackText, setFeedbackText] = useState('');

  // --- PERSISTENCE (AUTO-SAVE) ---
  // FIX #1: Load saved data once on mount with proper error handling
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem('2wards_trip_data');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.expenses && Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
          if (parsed.packingList && Array.isArray(parsed.packingList)) setPackingList(parsed.packingList);
          if (parsed.messages && Array.isArray(parsed.messages)) setMessages(parsed.messages);
          if (parsed.members && Array.isArray(parsed.members)) setTripMembers(parsed.members);
          if (parsed.userSettings && typeof parsed.userSettings === 'object') setUserSettings(parsed.userSettings);
        }
      } catch (e) {
        console.error("Failed to load saved trip data:", e);
        // Clear corrupted data
        localStorage.removeItem('2wards_trip_data');
      }
    }
  }, []); // ✅ Empty array is correct here - only run once on mount

  // FIX #1: Debounced auto-save with error handling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          expenses,
          packingList,
          messages,
          members: tripMembers,
          userSettings
        };
        localStorage.setItem('2wards_trip_data', JSON.stringify(dataToSave));
      } catch (e) {
        console.error("Failed to save trip data:", e);
        // Handle quota exceeded or other localStorage errors
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.warn("LocalStorage quota exceeded. Consider clearing old data.");
        }
      }
    }, 500); // Debounce: only save 500ms after last change

    return () => clearTimeout(timeoutId);
  }, [expenses, packingList, messages, tripMembers, userSettings]);

  // Generate Invite Link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mockTripId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setInviteLink(`${window.location.origin}/join/${mockTripId}`);
    }
  }, []);

  // --- MAP LOGIC ---
  const mapCenter = useMemo(() => {
    if (hoveredPlaceId) {
      const place = (isSelecting ? selectionQueue[currentSelectionIdx]?.candidates : tripPlan).find(p => p.id === hoveredPlaceId);
      if (place) return { lat: place.lat, lng: place.lng };
    }
    if (isSelecting && selectionQueue[currentSelectionIdx]?.candidates.length > 0) {
      return { lat: selectionQueue[currentSelectionIdx].candidates[0].lat, lng: selectionQueue[currentSelectionIdx].candidates[0].lng };
    }
    if (tripPlan.length > 0) return { lat: tripPlan[0].lat, lng: tripPlan[0].lng };
    return { lat: 12.9716, lng: 77.5946 };
  }, [tripPlan, isSelecting, selectionQueue, currentSelectionIdx, hoveredPlaceId]);

  const handleViewChange = (view: NavView) => {
    setActiveView(view);
    if (view === 'DASHBOARD') {
      setIsWizardActive(false);
      setShowWizard(false);
      setIsSelecting(false);
    }
  };

  // ============================================================
  //  THE AI ENGINE: GENERATION LOGIC
  // ============================================================
  const handleWizardComplete = async (data: any) => {
    console.log("Wizard Data:", data);
    setTripMeta(data);
    setShowWizard(false);

    let totalDays = 1;
    if (data.dates.start && data.dates.end) {
      const start = new Date(data.dates.start);
      const end = new Date(data.dates.end);
      totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    }

    const destinations = data.destinations || [];
    if (destinations.length === 0 && data.destination) destinations.push(data.destination);

    const searchConditions = destinations.flatMap((d: string) => {
      const cleanName = d.split(',')[0].trim();
      return [
        `city.ilike.%${cleanName}%`,
        `zone_id.ilike.%${cleanName}%`,
        `name.ilike.%${cleanName}%`,
        `description.ilike.%${cleanName}%`
      ];
    });

    const searchString = searchConditions.join(',');

    const { data: dbData, error } = await supabase
      .from('places')
      .select('*')
      .or(searchString);

    if (error) console.error("Supabase Error:", error);

    const allPlaces = (dbData || []) as Place[];

    if (!allPlaces || allPlaces.length === 0) {
      alert(`No places found. Loading sample data or try a different city.`);
      return;
    }

    let maxPriceTier = 4;
    const nightlyBudget = parseInt(data.budget?.nightly || '5000');
    if (nightlyBudget < 2000) maxPriceTier = 1;
    else if (nightlyBudget < 5000) maxPriceTier = 2;
    else if (nightlyBudget < 10000) maxPriceTier = 3;
    else maxPriceTier = 4;

    let newSelectionQueue: SelectionStep[] = [];
    let suggestedPlaceIds = new Set<string>();

    // Step 1: Stay
    let bestStays = allPlaces.filter((p) => {
      const isStay = ACCOMMODATION_KEYWORDS.some(k => p.type.toLowerCase().includes(k));
      const matchesBudget = p.price_level ? p.price_level <= maxPriceTier : true;
      const matchesType = data.preferences?.stayType?.length
        ? data.preferences.stayType.some((t: string) =>
          p.type.toLowerCase().includes(t.toLowerCase()) ||
          (p.description || '').toLowerCase().includes(t.toLowerCase())
        )
        : true;
      return isStay && matchesBudget && matchesType;
    });

    if (bestStays.length === 0) {
      bestStays = allPlaces.filter((p) => {
        const isStay = ACCOMMODATION_KEYWORDS.some(k => p.type.toLowerCase().includes(k));
        const matchesBudget = p.price_level ? p.price_level <= maxPriceTier : true;
        return isStay && matchesBudget;
      });
    }

    if (bestStays.length === 0) {
      bestStays = allPlaces.filter((p) => ACCOMMODATION_KEYWORDS.some(k => p.type.toLowerCase().includes(k)));
    }

    if (bestStays.length > 0) {
      const scoredStays = bestStays.map((p) => {
        let score = p.rating || 0;
        const text = (p.name + " " + (p.description || '')).toLowerCase();
        if (data.preferences?.pool && text.includes('pool')) score += 5;
        if (data.preferences?.view === 'VIEW' && (text.includes('sea') || text.includes('view'))) score += 5;
        return { place: p, score };
      });

      scoredStays.sort((a, b) => b.score - a.score);
      const topStays = scoredStays.slice(0, 4).map(s => s.place);

      newSelectionQueue.push({
        day: 1,
        slotLabel: "Check-in: Your Stay 🏨",
        candidates: topStays
      });

      topStays.forEach(p => suggestedPlaceIds.add(p.id));
    }

    // Step 2: Itinerary
    for (let day = 1; day <= totalDays; day++) {
      DAILY_TEMPLATE.forEach((slot) => {
        let candidates = allPlaces.filter((p) => {
          if (suggestedPlaceIds.has(p.id)) return false;
          const typeStr = (p.type + " " + (p.description || '')).toLowerCase();
          return slot.types.some(t => typeStr.includes(t));
        });

        if (slot.id === 'LUNCH' || slot.id === 'DINNER') {
          candidates = candidates.filter(p => !NON_FOOD_KEYWORDS.some(k => p.type.toLowerCase().includes(k)));
        } else {
          candidates = candidates.filter(p => {
            const isNotStay = !ACCOMMODATION_KEYWORDS.some(k => p.type.toLowerCase().includes(k));
            const isWithinBudget = p.price_level ? p.price_level <= maxPriceTier : true;
            return isNotStay && isWithinBudget;
          });
        }

        let scoredCandidates = candidates.map((p) => {
          let score = 50;
          const text = (p.name + " " + (p.description || '') + " " + p.type + " " + (p.vibes || []).join(' ')).toLowerCase();

          if (data.preferences?.tripVibe) {
            data.preferences.tripVibe.forEach((v: string) => {
              if (text.includes(v.toLowerCase())) score += 25;
            });
          } else {
            TRIP_VIBES.forEach(v => { if (text.includes(v.id)) score += 10; });
          }

          if (data.groupType === 'FAMILY' && (p.safety_score || 0) > 4) score += 15;
          if (data.groupType === 'FRIENDS' && (p.trend_score || 0) > 4) score += 15;
          if (data.groupType === 'COUPLE' && text.includes('romantic')) score += 20;

          if (data.preferences?.pool && (text.includes('pool') || (p.amenities || []).includes('pool'))) score += 40;
          if (data.preferences?.view === 'VIEW' && (text.includes('view') || text.includes('sea') || text.includes('valley'))) score += 30;

          return { place: p, score };
        });

        scoredCandidates.sort((a, b) => b.score - a.score);

        if (scoredCandidates.length > 0) {
          const top4 = scoredCandidates.slice(0, 4).map(c => c.place);
          top4.forEach(p => suggestedPlaceIds.add(p.id));

          newSelectionQueue.push({
            day,
            slotLabel: slot.label,
            candidates: top4
          });
        }
      });
    }

    if (newSelectionQueue.length === 0) {
      alert("Could not generate a plan. Please try broader search terms.");
      return;
    }

    setSelectionQueue(newSelectionQueue);
    setCurrentSelectionIdx(0);
    setTripPlan([]);
    setIsSelecting(true);
    setActiveView('PLAN');
  };

  const handleSelectPlace = (place: Place) => {
    const currentStep = selectionQueue[currentSelectionIdx];
    const timeLabel = currentStep.slotLabel.includes("Stay") ? "Check-in" : `Day ${currentStep.day} - ${currentStep.slotLabel}`;

    const placeWithTime = { ...place, time: timeLabel };
    setTripPlan(prev => [...prev, placeWithTime]);
    setHoveredPlaceId(null);

    if (currentSelectionIdx < selectionQueue.length - 1) {
      setCurrentSelectionIdx(prev => prev + 1);
    } else {
      setIsSelecting(false);
    }
  };

  const handleReorder = (newOrder: Place[]) => {
    setTripPlan(newOrder);
  };

  // FIX #2: Guard Google Maps API calls with safety checks
  const calculateRoute = async () => {
    if (tripPlan.length < 2) {
      alert("Add at least 2 places to calculate a route.");
      return;
    }

    // Guard: Check if Google Maps API is loaded
    if (!isLoaded || typeof window === 'undefined' || !window.google || !window.google.maps) {
      alert("Google Maps is still loading. Please try again in a moment.");
      return;
    }

    setIsRouting(true);

    try {
      const directionsService = new google.maps.DirectionsService();
      const origin = { lat: tripPlan[0].lat, lng: tripPlan[0].lng };
      const destination = { lat: tripPlan[tripPlan.length - 1].lat, lng: tripPlan[tripPlan.length - 1].lng };
      const waypoints = tripPlan.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true }));

      directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        setIsRouting(false);

        if (status === 'OK' && result) {
          setDirectionsResponse(result);
        } else {
          // Handle API errors gracefully
          console.error("Directions request failed:", status);
          if (status === 'ZERO_RESULTS') {
            alert("No route found between these locations. Try different places.");
          } else if (status === 'OVER_QUERY_LIMIT') {
            alert("Too many requests. Please try again in a moment.");
          } else {
            alert(`Route calculation failed: ${status}`);
          }
        }
      });
    } catch (error) {
      console.error("Route calculation error:", error);
      alert("Failed to calculate route. Please check your internet connection.");
      setIsRouting(false);
    }
  };

  const handleDownloadOffline = async () => {
    // We try to grab the DayDrawer container now
    const element = document.getElementById('itinerary-container');
    if (!element) { alert("No itinerary to download!"); return; }
    const btn = document.getElementById('download-btn');
    if (btn) btn.innerText = "⏳ Generating PDF...";

    try {
      const canvas = await html2canvas(element, { scale: 2 } as any);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`2wards-Trip-${new Date().toISOString().split('T')[0]}.pdf`);
      alert("PDF Downloaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF.");
    } finally {
      if (btn) btn.innerText = "⬇️ Download Offline";
    }
  };

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    const { error } = await supabase.from('feedback').insert([{ message: feedbackText, user_email: user.email || 'anonymous' }]);
    if (error) alert(`Error saving feedback: ${error.message}`);
    else { alert("Thanks! We have received your feedback. 📨"); setFeedbackText(''); setShowHelpModal(false); }
  };

  const handleCopyLink = () => { navigator.clipboard.writeText(inviteLink); alert("Invite link copied!"); };
  const handleSendMessage = () => { if (!newMessage.trim()) return; setMessages(prev => [...prev, { id: Date.now().toString(), user: 'You', text: newMessage, time: 'Now', isMe: true }]); setNewMessage(''); };
  const handleAddExpense = () => { if (!newExpense.what) return; setExpenses([...expenses, { id: Date.now().toString(), ...newExpense, amount: Number(newExpense.amount) }]); setShowExpenseForm(false); setNewExpense({ what: '', amount: '', who: 'You' }); };
  const addPackingItem = () => { if (!newPackingItem) return; setPackingList([...packingList, { id: Date.now().toString(), text: newPackingItem, checked: false }]); setNewPackingItem(''); };
  const togglePackingItem = (id: string) => { setPackingList(packingList.map(i => i.id === id ? { ...i, checked: !i.checked } : i)); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));
  const calculateDays = () => {
    if (!tripMeta?.dates?.start || !tripMeta?.dates?.end) return 1;
    return Math.max(1, Math.ceil((new Date(tripMeta.dates.end).getTime() - new Date(tripMeta.dates.start).getTime()) / (1000 * 3600 * 24)) + 1);
  };

  const totalCost = expenses.reduce((a, b) => a + b.amount, 0);
  const costPerPerson = tripMembers.length > 0 ? totalCost / tripMembers.length : 0;
  const myTotalPaid = expenses.filter(e => e.who === 'You').reduce((a, b) => a + b.amount, 0);
  const myBalance = myTotalPaid - costPerPerson;

  const openAiAssistant = (place: Place) => {
    setAiActivePlace(place);
    setAiChatHistory([{ id: 'system', user: 'Genius', text: `Hello! I'm your expert guide for ${place.name}. Ask me about tickets, dress code, or best times to visit!`, time: 'Now', isMe: false }]);
    setAiModalOpen(true);
  };

  const handleAiAsk = (query: string = aiQuery) => {
    if (!query.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), user: 'You', text: query, time: 'Now', isMe: true };
    setAiChatHistory(prev => [...prev, userMsg]);
    setAiQuery('');
    setTimeout(() => {
      const responses = [`Great question about ${aiActivePlace?.name}! The best time to visit is usually early morning to avoid crowds.`, `Wear comfortable shoes! ${aiActivePlace?.name} involves a bit of walking.`, `Entry is typically free, but special exhibits might cost around ₹50-100.`, `It's a fantastic spot for photography, especially during the golden hour!`];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), user: 'Genius', text: randomResponse, time: 'Now', isMe: false }]);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-full max-w-[100vw] bg-gray-50 overflow-hidden font-sans relative">
      <Sidebar
        currentView={activeView}
        onChangeView={handleViewChange}
        selectedCity={tripMeta.destinations?.[0] || 'Trip'}
        tripPlan={tripPlan}
        isTripActive={!!tripMeta.destinations}
        totalDays={calculateDays()}
        budget={'MEDIUM'}
        travelers={tripMembers.length}
        diet={'ANY'}
        groupType={tripMeta.groupType || 'FRIENDS'}
        onRemoveItem={removeFromTrip}
        onAddToTrip={() => { }}
        onResetApp={() => { if (confirm("Reset?")) window.location.reload(); }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 relative h-full flex flex-col bg-gray-50">
        <header className="absolute top-0 right-0 p-4 lg:p-6 z-50 flex items-center justify-between w-full pointer-events-none">
          <div className="lg:hidden pointer-events-auto">
            <button onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-xl">☰</button>
          </div>

          <div className="flex items-center gap-2 lg:gap-4 pointer-events-auto ml-auto">
            {tripPlan.length > 0 && activeView !== 'DASHBOARD' && (
              <button onClick={() => setActiveView('COLLAB' as any)} className="bg-white text-blue-600 px-3 py-2 rounded-full shadow-sm border border-blue-100 font-bold text-[10px] lg:text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors">
                <span className="hidden sm:inline">Invite Friends</span>
                <span className="sm:hidden">Invite</span>
              </button>
            )}
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 hover:shadow-md transition-all relative shadow-sm">
                {user.email?.[0].toUpperCase()}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 z-50">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-500"><span>🚪</span> Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeView === 'DASHBOARD' && !isWizardActive && (
          <div className="h-full w-full pt-20 lg:pt-24">
            <DashboardView onPlanTrip={() => setShowWizard(true)} onDiscovery={() => setActiveView('DISCOVERY' as any)} />
          </div>
        )}

        {/* --- PLAN & MAP VIEW (UPDATED WITH NEW FEATURES) --- */}
        {activeView === 'PLAN' && isLoaded && (
          <div className="h-full w-full relative flex">
            {/* LEFT PANEL */}
            {isSelecting ? (
              // SELECTION MODE - FIX #3: Mobile responsive
              <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200 w-full md:w-[420px] lg:w-[480px] shadow-2xl z-20 overflow-hidden absolute left-0 top-0 pt-16 md:pt-20">
                {/* FIX #3: Mobile responsive header */}
                <div className="bg-white px-4 md:px-6 py-4 md:py-6 border-b border-gray-200">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Day {selectionQueue[currentSelectionIdx]?.day}</span>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 mt-1">{selectionQueue[currentSelectionIdx]?.slotLabel}</h2>
                  <p className="text-xs text-gray-500 mt-2">Choose the best option for this slot.</p>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 md:mt-4 overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${((currentSelectionIdx + 1) / selectionQueue.length) * 100}%` }}></div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectionQueue[currentSelectionIdx]?.candidates.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      onMouseEnter={() => setHoveredPlaceId(place.id)}
                      onMouseLeave={() => setHoveredPlaceId(null)}
                      className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all group hover-lift shadow-sm hover:shadow-wanderlog"
                    >
                      {/* FIX #3: Responsive image height */}
                      <div className="h-28 sm:h-32 md:h-36 bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                        <img src={place.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={place.name} />
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold">★ {place.rating || 4.5}</div>
                      </div>
                      {/* FIX #3: Responsive text sizing */}
                      <h3 className="font-bold text-base md:text-lg text-gray-900">{place.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{place.description}</p>
                      <div className="mt-3 flex gap-2">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">{place.type}</span>
                        {place.price_tier && <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold">{place.price_tier}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // FIX #3: ITINERARY MODE -> Responsive mobile-first design
              tripPlan.length > 0 && (
                <div id="itinerary-container" className="h-full flex flex-col bg-white border-r border-gray-200 w-full md:w-[420px] lg:w-[480px] shadow-2xl z-20 overflow-hidden absolute left-0 top-0 pt-16 md:pt-20">
                  {/* FEATURE 3: Haptic Slider Header - FIX #3: Mobile responsive padding */}
                  <div className="p-4 md:p-6 bg-white border-b border-gray-100">
                    <h2 className="text-xl md:text-2xl font-black mb-3 md:mb-4 text-gray-900">Your Itinerary</h2>
                    <HapticSlider
                      label="Trip Budget"
                      value={Number(tripMeta.budget?.nightly || 5000)}
                      onChange={(val: number) => console.log("New Budget", val)}
                    />
                  </div>

                  {/* FEATURE 1: Day Drawers List */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    {Array.from(new Set(tripPlan.map(p => {
                      // Grouping Logic
                      if (p.time?.includes("Check-in")) return "Day 1";
                      return p.time?.split(' - ')[0] || 'Day 1';
                    }))).sort().map((dayLabel, index) => (
                      <DayDrawer
                        key={dayLabel}
                        day={index + 1}
                        title={dayLabel === "Day 1" ? "Arrival & Settling In" : `Exploration Day ${index + 1}`}
                        isToday={index === 0}
                        activities={tripPlan.filter(p => {
                          if (dayLabel === "Day 1") return p.time?.includes("Check-in") || p.time?.startsWith("Day 1");
                          return p.time?.startsWith(dayLabel);
                        })}
                      />
                    ))}
                  </div>
                </div>
              )
            )}

            {/* RIGHT PANEL: MAP - FIX #3: Responsive margin */}
            <div className="flex-1 h-full relative ml-0 md:ml-[420px] lg:ml-[480px] transition-all duration-300">
              <GoogleMap mapContainerStyle={MAP_STYLES} center={mapCenter} zoom={12} options={{ disableDefaultUI: false, zoomControl: true }}>
                {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}

                {isSelecting ? (
                  // Selecting = Standard Markers
                  selectionQueue[currentSelectionIdx]?.candidates.map((place, i) => (
                    <Marker
                      key={place.id}
                      position={{ lat: place.lat, lng: place.lng }}
                      label={{ text: `${i + 1}`, color: "white", fontWeight: "bold" }}
                      title={place.name}
                      animation={hoveredPlaceId === place.id ? (window.google as any).maps.Animation.BOUNCE : null}
                      zIndex={hoveredPlaceId === place.id ? 999 : 1}
                    />
                  ))
                ) : (
                  // FEATURE 2: Vibe Markers
                  tripPlan.map((place, index) => (
                    <VibeMarker
                      key={place.id}
                      position={{ lat: place.lat, lng: place.lng }}
                      place={place}
                      onClick={(p: any) => console.log('Clicked vibe', p)}
                    />
                  ))
                )}
              </GoogleMap>

              {/* FIX #3: Responsive action buttons with mobile optimization */}
              {!isSelecting && (
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl p-1.5 md:p-2 flex gap-1 md:gap-2 max-w-[95vw] md:max-w-none overflow-x-auto">
                  <button onClick={calculateRoute} disabled={isRouting} className="bg-black text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-xs hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">{isRouting ? '⏳ Routing...' : '🛣️ Show Route'}</button>
                  <button id="download-btn" onClick={handleDownloadOffline} className="bg-gray-100 text-gray-700 px-3 md:px-4 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-xs hover:bg-gray-200 transition-colors whitespace-nowrap"><span className="hidden sm:inline">⬇️ Download</span><span className="sm:hidden">⬇️</span></button>
                  <button onClick={() => setDirectionsResponse(null)} className="bg-white text-gray-500 border border-gray-200 px-3 md:px-4 py-2 md:py-3 rounded-full font-bold text-[10px] md:text-xs hover:bg-gray-50 whitespace-nowrap">Reset</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'DISCOVERY' && <DiscoveryView onAddToTrip={() => { }} onBack={() => setActiveView('PLAN')} initialCity={tripMeta.destinations?.[0] || 'Bangalore'} />}

        {showWizard && <CreateTripWizard onClose={() => setShowWizard(false)} onComplete={handleWizardComplete} />}

        {showHelpModal && (
          <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-bottom-right">
            <div className="bg-black p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm">Help & Support</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="flex border-b border-gray-100">
              <button onClick={() => setHelpTab('GUIDE')} className={`flex-1 py-3 text-xs font-bold ${helpTab === 'GUIDE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Quick Guide</button>
              <button onClick={() => setHelpTab('FEEDBACK')} className={`flex-1 py-3 text-xs font-bold ${helpTab === 'FEEDBACK' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Report / Idea</button>
            </div>
            <div className="p-4 h-64 overflow-y-auto bg-gray-50">
              {helpTab === 'GUIDE' ? (
                <div className="space-y-4">
                  {[{ icon: '🔎', title: 'Start a Trip', desc: 'Click "Plan New Trip" on the dashboard. Enter your city and preferences.' }, { icon: '🗺️', title: 'Customize', desc: 'Select places day-by-day. Use the "Start Location" to optimize the route.' }, { icon: '🤝', title: 'Invite Friends', desc: 'Once planned, go to the "Collab" tab to invite friends and split costs.' }, { icon: '📍', title: 'Discover', desc: 'Use the "Discover" tab to find hidden gems near you anytime.' }].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-sm border border-gray-100">{item.icon}</div>
                      <div><h4 className="font-bold text-xs text-gray-900">{item.title}</h4><p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <textarea className="flex-1 p-3 rounded-xl border border-gray-200 text-xs font-medium resize-none focus:outline-none focus:border-blue-500 mb-3" placeholder="Found a bug? Have an idea? Tell us..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
                  <button onClick={submitFeedback} className="w-full bg-black text-white py-2 rounded-lg font-bold text-xs">Submit Feedback</button>
                </div>
              )}
            </div>
          </div>
        )}

        {aiModalOpen && aiActivePlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex justify-between items-start text-white">
                <div><div className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">AI Concierge</div><h3 className="font-black text-xl leading-tight">{aiActivePlace.name}</h3></div>
                <button onClick={() => setAiModalOpen(false)} className="text-white/80 hover:text-white bg-white/10 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
              </div>
              <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-3">
                {aiChatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${msg.isMe ? 'bg-black text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                  {['Best time to visit?', 'Dress code?', 'Entry fee?', 'Is it crowded?'].map(q => (
                    <button key={q} onClick={() => handleAiAsk(q)} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-purple-100 bg-purple-50 text-purple-700 text-[10px] font-bold hover:bg-purple-100 transition-colors">{q}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="Ask anything..." value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} />
                  <button onClick={() => handleAiAsk()} className="bg-black text-white w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform">➤</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={() => setShowHelpModal(!showHelpModal)} className="w-12 h-12 bg-black text-white rounded-full shadow-2xl flex items-center justify-center font-bold">?</button>
        </div>
      </main>
    </div>
  );
}