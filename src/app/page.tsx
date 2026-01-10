'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLoadScript, GoogleMap, Marker, Polyline, DirectionsRenderer } from '@react-google-maps/api';

// COMPONENTS
import LandingPage from '@/components/LandingPage';
import Sidebar, { NavView } from '@/components/Sidebar';
import DiscoveryView from '@/components/DiscoveryView';

const LIBRARIES: ("places")[] = ["places"];

// --- INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// --- TYPES ---
interface Place {
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

// --- CONSTANTS & CONFIG ---

// 1. VIBES (With Images for Dashboard)
const TRIP_VIBES = [
  { id: 'leisure', label: '🌴 Relaxing', keywords: ['resort', 'park', 'spa', 'lake'], img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=400&q=80' },
  { id: 'foodie', label: '🍕 Foodie', keywords: ['restaurant', 'cafe', 'late_night', 'pub', 'bar'], img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80' },
  { id: 'heritage', label: '🏰 Heritage', keywords: ['temple', 'museum', 'fort', 'iconic', 'landmark'], img: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=400&q=80' },
  { id: 'adventure', label: '🏍️ Adventure', keywords: ['off_roading', 'amusement_park', 'turf', 'trek'], img: 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=400&q=80' },
  { id: 'shopping', label: '🛍️ Shopping', keywords: ['mall', 'market', 'shopping'], img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' }
];

// 2. POPULAR DESTINATIONS (For Dashboard)
const POPULAR_DESTINATIONS = [
  { name: 'Paris', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80' },
  { name: 'Tokyo', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80' },
  { name: 'Bali', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80' },
  { name: 'Dubai', img: 'https://images.unsplash.com/photo-1512453979798-5ea90b791d5e?auto=format&fit=crop&w=600&q=80' },
  { name: 'New York', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=600&q=80' }
];

const DAILY_TEMPLATE = [
  { id: 'MORNING', label: '🌞 Morning Exploration', types: ['park', 'nature', 'temple', 'religious', 'landmark', 'museum', 'fort', 'sightseeing', 'off_roading', 'falls', 'view point'] },
  { id: 'LUNCH', label: '🍛 Lunch Break', types: ['restaurant', 'cafe', 'food', 'kitchen', 'bistro', 'dining', 'eatery', 'iconic', 'mess', 'bhavan', 'canteen', 'hotel'] },
  { id: 'AFTERNOON', label: '🎨 Afternoon Vibe', types: ['museum', 'gallery', 'mall', 'shopping', 'zoo', 'aquarium', 'hall', 'monument', 'market', 'amusement_park', 'plantation'] },
  { id: 'EVENING', label: '🌆 Evening Chill', types: ['park', 'sunset', 'lake', 'club', 'pub', 'bar', 'theater', 'cinema', 'beach', 'turf', 'raja seat', 'bridge'] },
  { id: 'DINNER', label: '🍽️ Dinner Feast', types: ['restaurant', 'food', 'bar', 'grill', 'kitchen', 'dine', 'late_night', 'dhaba', 'hotel'] }
];

const MAP_STYLES = { width: '100%', height: '100%' };
const PATH_OPTIONS = { strokeColor: '#2563EB', strokeOpacity: 0.5, strokeWeight: 4 };

// Keywords for filtering
const NON_VEG_KEYWORDS = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'steak', 'seafood', 'fish', 'kebab', 'biryani']; 
const NON_FOOD_KEYWORDS = [
    'resort', 'inn', 'stay', 'cottage', 'residency', 'lodge', 'dorm', 'hostel', 'room', 'living', 'apartment', 'villa', 'bnb', 'homestay',
    'temple', 'shrine', 'worship', 'church', 'mosque', 'fort', 'park', 'garden', 'museum', 'dam', 'falls', 'view point', 
    'market', 'stand', 'store', 'shop', 'complex', 'race', 'bridge', 'river', 'lake'
];
const ACCOMMODATION_KEYWORDS = [
    'resort', 'inn', 'stay', 'cottage', 'residency', 'lodge', 'dorm', 'hostel', 'room', 'living', 'apartment', 'villa', 'bnb', 'hotel', 'palace'
];

export default function Home() {
  const [session, setSession] = useState<any>(null);
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  // Auth Session Management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // --- APP STATE ---
  const [activeView, setActiveView] = useState<NavView>('DASHBOARD');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // --- WIZARD STATE ---
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepOptions, setStepOptions] = useState<Place[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [allCityPlaces, setAllCityPlaces] = useState<Place[]>([]);
  const [dynamicSteps, setDynamicSteps] = useState<any[]>([]);
  const [startCoords, setStartCoords] = useState<{lat: number, lng: number} | null>(null);
  
  // --- TRIP DATA ---
  const [selectedCity, setSelectedCity] = useState('');
  const [startLocation, setStartLocation] = useState(''); 
  const [showStartHelp, setShowStartHelp] = useState(false); 
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [budget, setBudget] = useState('MEDIUM'); 
  const [groupType, setGroupType] = useState('FRIENDS'); 
  const [diet, setDiet] = useState('ANY'); 
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [tripPlan, setTripPlan] = useState<Place[]>([]);

  // --- SETTINGS STATE ---
  const [userSettings, setUserSettings] = useState({
    name: 'Traveler',
    email: '',
    currency: 'INR',
    language: 'English',
    notifications: true,
    theme: 'light'
  });

  // --- COLLAB STATE ---
  const [collabTab, setCollabTab] = useState<'MEMBERS' | 'CHAT' | 'SPLIT'>('MEMBERS');
  const [tripMembers, setTripMembers] = useState<string[]>(['You']);
  const [inviteLink, setInviteLink] = useState(''); // Invite Link
  
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: '1', user: 'System', text: 'Welcome to the Trip Chat!', time: '10:00 AM', isMe: false }]);
  const [newMessage, setNewMessage] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ what: '', amount: '', who: 'You' });

  // --- GENIUS BUTTON (AI) STATE ---
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiActivePlace, setAiActivePlace] = useState<Place | null>(null);
  const [aiChatHistory, setAiChatHistory] = useState<ChatMessage[]>([]);
  const [aiQuery, setAiQuery] = useState('');

  // --- MAP ROUTING STATE ---
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // HELP FORM STATE
  const [helpTab, setHelpTab] = useState<'GUIDE' | 'FEEDBACK'>('GUIDE');
  const [feedbackText, setFeedbackText] = useState('');

  // Sync Email to Settings
  useEffect(() => {
    if(session?.user?.email) {
      setUserSettings(prev => ({ ...prev, email: session.user.email }));
    }
  }, [session]);

  // Generate Invite Link on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
       const mockTripId = Math.random().toString(36).substring(2, 8).toUpperCase();
       setInviteLink(`${window.location.origin}/join/${mockTripId}`);
    }
  }, []);

  const mapCenter = useMemo(() => {
    if (tripPlan.length > 0) return { lat: tripPlan[0].lat, lng: tripPlan[0].lng };
    return { lat: 12.9716, lng: 77.5946 };
  }, [tripPlan]);

  const handleViewChange = (view: NavView) => {
    setActiveView(view);
    if (view === 'DASHBOARD') {
        setIsWizardActive(false);
        setShowCreateModal(false);
    }
  };

  // --- GENIUS BUTTON HANDLERS ---
  const openAiAssistant = (place: Place) => {
    setAiActivePlace(place);
    setAiChatHistory([{
      id: 'system',
      user: 'Genius',
      text: `Hello! I'm your expert guide for ${place.name}. Ask me about tickets, dress code, or best times to visit!`,
      time: 'Now',
      isMe: false
    }]);
    setAiModalOpen(true);
  };

  const handleAiAsk = (query: string = aiQuery) => {
    if(!query.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), user: 'You', text: query, time: 'Now', isMe: true };
    setAiChatHistory(prev => [...prev, userMsg]);
    setAiQuery('');
    setTimeout(() => {
      const responses = [
        `Great question about ${aiActivePlace?.name}! The best time to visit is usually early morning to avoid crowds.`,
        `Wear comfortable shoes! ${aiActivePlace?.name} involves a bit of walking.`,
        `Entry is typically free, but special exhibits might cost around ₹50-100.`,
        `It's a fantastic spot for photography, especially during the golden hour!`
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiChatHistory(prev => [...prev, { id: (Date.now()+1).toString(), user: 'Genius', text: randomResponse, time: 'Now', isMe: false }]);
    }, 1500);
  };

  // --- MAP ROUTING HANDLER ---
  const calculateRoute = async () => {
    if (tripPlan.length < 2) { alert("Add at least 2 places to see a route."); return; }
    setIsRouting(true);
    const directionsService = new google.maps.DirectionsService();
    const origin = { lat: tripPlan[0].lat, lng: tripPlan[0].lng };
    const destination = { lat: tripPlan[tripPlan.length - 1].lat, lng: tripPlan[tripPlan.length - 1].lng };
    const waypoints = tripPlan.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true }));
    directionsService.route({ origin: origin, destination: destination, waypoints: waypoints, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
      if (status === 'OK' && result) { setDirectionsResponse(result); } else { alert("Could not calculate route. Try fewer stops."); }
      setIsRouting(false);
    });
  };

  // --- COLLAB LOGIC ---
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard! 📋");
  };

  const handleSendMessage = () => { if(!newMessage.trim()) return; setMessages(prev => [...prev, { id: Date.now().toString(), user: 'You', text: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isMe: true }]); setNewMessage(''); };
  const handleAddExpense = () => { if(!newExpense.what || !newExpense.amount) return; setExpenses([...expenses, { id: Date.now().toString(), who: newExpense.who, what: newExpense.what, amount: Number(newExpense.amount) }]); setShowExpenseForm(false); setNewExpense({ what: '', amount: '', who: 'You' }); };
  const submitFeedback = () => { if (!feedbackText.trim()) return; alert("Thanks for your feedback! We'll look into it."); setFeedbackText(''); setShowHelpModal(false); };
  
  const totalCost = expenses.reduce((a,b) => a + b.amount, 0);
  const costPerPerson = tripMembers.length > 0 ? totalCost / tripMembers.length : 0;
  const myTotalPaid = expenses.filter(e => e.who === 'You').reduce((a,b) => a + b.amount, 0);
  const myBalance = myTotalPaid - costPerPerson;

  // --- EXISTING HELPERS ---
  const handleCitySearch = async (query: string) => { setSelectedCity(query); if(query.length < 2) { setCitySuggestions([]); setShowSuggestions(false); return; } try { const { data } = await supabase.from('places').select('city, zone_id').or(`city.ilike.%${query}%,zone_id.ilike.%${query}%`).limit(15); if(data && data.length > 0) { const unique = Array.from(new Set(data.flatMap(p => [p.city, p.zone_id]))); setCitySuggestions(unique as string[]); setShowSuggestions(unique.length > 0); } else setShowSuggestions(false); } catch(err) { console.warn(err); } };
  const selectSuggestion = (name: string) => { setSelectedCity(name); setShowSuggestions(false); };
  const handleUseLiveLocation = () => { if(!navigator.geolocation) { alert("Geolocation not supported."); return; } setSelectedCity("Locating..."); navigator.geolocation.getCurrentPosition((pos) => { const geocoder = new google.maps.Geocoder(); geocoder.geocode({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }, (res, status) => { if(status === "OK" && res?.[0]) { const city = res[0].address_components.find(c => c.types.includes('locality'))?.long_name; if(city) { setSelectedCity(city); handleCitySearch(city); } } else { alert("Could not detect city."); setSelectedCity(""); } }); }, () => { alert("Permission denied."); setSelectedCity(""); }); };
  const toggleVibe = (vibeId: string) => { if (selectedVibes.includes(vibeId)) setSelectedVibes(selectedVibes.filter(id => id !== vibeId)); else setSelectedVibes([...selectedVibes, vibeId]); };
  const getGeocode = (address: string): Promise<{lat: number, lng: number} | null> => { return new Promise((resolve) => { const geocoder = new google.maps.Geocoder(); geocoder.geocode({ address }, (results, status) => { if (status === 'OK' && results?.[0]) { const loc = results[0].geometry.location; resolve({ lat: loc.lat(), lng: loc.lng() }); } else resolve(null); }); }); };

  // --- WIZARD LOGIC ---
  const startWizard = async () => {
    let totalDays = 1; if (dates.start && dates.end) { const start = new Date(dates.start); const end = new Date(dates.end); totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1); }
    const fullItinerarySteps: any[] = []; for (let i = 1; i <= totalDays; i++) { DAILY_TEMPLATE.forEach(step => { fullItinerarySteps.push({ ...step, day: i, label: `Day ${i}: ${step.label}` }); }); }
    setDynamicSteps(fullItinerarySteps);
    let initialCoords = null; if (startLocation) { initialCoords = await getGeocode(startLocation); setStartCoords(initialCoords); }
    setIsWizardActive(true); setShowCreateModal(false); setIsLoadingOptions(true); setTripPlan([]); setCurrentStepIndex(0);
    try { const { data: rawPlaces } = await supabase.from('places').select('*').or(`city.ilike.%${selectedCity}%,zone_id.ilike.%${selectedCity}%`); if (!rawPlaces || rawPlaces.length === 0) { alert("No data found. Try 'Bangalore'."); setIsWizardActive(false); return; } setAllCityPlaces(rawPlaces); generateOptionsForStep(0, rawPlaces, [], fullItinerarySteps, initialCoords); } catch (err) { console.error(err); setIsWizardActive(false); }
  };

  const generateOptionsForStep = (
      stepIdx: number, 
      allPlaces: Place[], 
      currentTrip: Place[], 
      stepsList = dynamicSteps, 
      initialCoords: {lat: number, lng: number} | null = startCoords
  ) => {
    setIsLoadingOptions(true);
    const stepConfig = stepsList[stepIdx];
    
    let referencePoint = null;
    if (currentTrip.length > 0) {
        const last = currentTrip[currentTrip.length - 1];
        referencePoint = { lat: last.lat, lng: last.lng };
    } else if (initialCoords && stepIdx === 0) {
        referencePoint = initialCoords;
    }

    // Helper: Check if place is strictly non-food
    const isNonFoodPlace = (p: Place) => {
        const t = (p.type + " " + p.name + " " + p.description).toLowerCase();
        return NON_FOOD_KEYWORDS.some(kw => t.includes(kw));
    };

    const isAccommodation = (p: Place) => {
        const t = (p.type + " " + p.name + " " + p.description).toLowerCase();
        return ACCOMMODATION_KEYWORDS.some(kw => t.includes(kw));
    };

    // 1. Primary Filter
    let candidates = allPlaces.filter(p => {
        const searchStr = `${p.type} ${p.description} ${p.name} ${p.vibes?.join(' ')}`.toLowerCase();
        let matchesType = stepConfig.types.some((t: string) => searchStr.includes(t));
        
        // Vibe Check
        if (selectedVibes.length > 0) {
            const vibeKeywords = selectedVibes.flatMap(vid => TRIP_VIBES.find(v => v.id === vid)?.keywords || []);
            if (vibeKeywords.some(k => searchStr.includes(k))) matchesType = true;
        }
        const alreadyPicked = currentTrip.some(picked => picked.id === p.id);
        return matchesType && !alreadyPicked;
    });

    // 2. Strict Meal Logic (No temples/resorts for lunch)
    const isMeal = stepConfig.id.includes('DINNER') || stepConfig.id.includes('LUNCH');
    if (isMeal) {
        const foodCandidates = candidates.filter(p => !isNonFoodPlace(p));
        if (foodCandidates.length > 0) candidates = foodCandidates;
    } else {
        const activityCandidates = candidates.filter(p => !isAccommodation(p));
        if (activityCandidates.length > 0) candidates = activityCandidates;
    }

    // 3. Diet Filter
    if (diet !== 'ANY') {
        candidates = candidates.filter(p => {
            const text = (p.name + " " + p.description).toLowerCase();
            const isNonVeg = NON_VEG_KEYWORDS.some(kw => text.includes(kw));
            if (diet === 'VEG' || diet === 'VEGAN' || diet === 'JAIN') return !isNonVeg || text.includes('pure veg');
            return true;
        });
    }
    
    // 4. Budget Filter
    candidates = candidates.filter(p => {
        const price = p.price_tier || (p.price_level === 0 ? 'Budget' : p.price_level === 4 ? 'Luxury' : 'Standard');
        if (budget === 'LOW') return price === 'Budget' || (p.price_level !== undefined && p.price_level <= 1);
        if (budget === 'HIGH') return price === 'Luxury' || price === 'Premium' || (p.price_level !== undefined && p.price_level >= 3);
        return true; 
    });

    // 5. Fallback Logic (If not enough candidates)
    if (candidates.length < 4) {
        const remainingNeeded = 4 - candidates.length;
        let fallbackCandidates = allPlaces.filter(p => !currentTrip.some(picked => picked.id === p.id) && !candidates.some(c => c.id === p.id));

        if (isMeal) {
             // Look for specific food words
             const betterFoodFallback = fallbackCandidates.filter(p => 
                (p.name + p.type).toLowerCase().match(/restaurant|mess|bhavan|kitchen|canteen|cafe|dining/) && 
                !isNonFoodPlace(p)
             );
             if (betterFoodFallback.length > 0) fallbackCandidates = betterFoodFallback;
             else fallbackCandidates = fallbackCandidates.filter(p => !isNonFoodPlace(p));
        } else {
             // Just exclude lodging for activities
             fallbackCandidates = fallbackCandidates.filter(p => !isAccommodation(p));
        }

        // Sort fallbacks by proximity if possible
        if (referencePoint) {
             fallbackCandidates.sort((a, b) => {
                 const distA = Math.sqrt(Math.pow(a.lat - referencePoint!.lat, 2) + Math.pow(a.lng - referencePoint!.lng, 2));
                 const distB = Math.sqrt(Math.pow(b.lat - referencePoint!.lat, 2) + Math.pow(b.lng - referencePoint!.lng, 2));
                 return distA - distB;
             });
        }
        candidates = [...candidates, ...fallbackCandidates.slice(0, remainingNeeded)];
    }

    // 6. Scoring & Sorting
    candidates = candidates.map(p => {
        let score = calculateRelevanceScore(p, groupType);
        let distanceText = "";

        if (referencePoint) {
             const distDeg = Math.sqrt(Math.pow(p.lat - referencePoint.lat, 2) + Math.pow(p.lng - referencePoint.lng, 2));
             const distKm = distDeg * 111;
             distanceText = `${distKm.toFixed(1)} km away`;
             if (distKm < 3) score += 30; 
             else if (distKm < 8) score += 15; 
             else if (distKm > 20) score -= 20; 
        }

        const text = (p.name + " " + p.description + " " + (p.vibes?.join(' ') || '')).toLowerCase();
        selectedVibes.forEach(vid => {
            const keywords = TRIP_VIBES.find(v => v.id === vid)?.keywords || [];
            if (keywords.some(k => text.includes(k))) score += 25; 
        });

        return { ...p, aiScore: score, distanceFromLast: distanceText };
    });

    candidates.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    setStepOptions(candidates.slice(0, 4)); 
    setIsLoadingOptions(false);
  };

  const handleOptionSelect = (place: Place) => {
    const newTrip = [...tripPlan, place];
    setTripPlan(newTrip);
    const nextStep = currentStepIndex + 1;
    if (nextStep < dynamicSteps.length) {
        setCurrentStepIndex(nextStep);
        generateOptionsForStep(nextStep, allCityPlaces, newTrip, dynamicSteps, startCoords);
    } else {
        setIsWizardActive(false);
        setActiveView('PLAN');
    }
  };

  const calculateRelevanceScore = (place: Place, group: string) => {
    let score = 50;
    const safety = place.safety_score || 5;
    const trend = place.trend_score || 5;
    if (group === 'FRIENDS') { score += trend * 5; }
    if (group === 'FAMILY') { score += safety * 5; }
    if (diet !== 'ANY' && place.description?.toLowerCase().includes(diet.toLowerCase())) score += 30;
    return score;
  };

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.reload(); };
  const removeFromTrip = (id: string) => setTripPlan(tripPlan.filter(p => p.id !== id));
  const calculateDays = () => {
    if(!dates.start || !dates.end) return 1;
    return Math.max(1, Math.ceil((new Date(dates.end).getTime() - new Date(dates.start).getTime()) / (1000 * 3600 * 24)) + 1); 
  };

  if (!session) return <LandingPage />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <Sidebar 
        currentView={activeView}
        onChangeView={handleViewChange}
        selectedCity={selectedCity}
        tripPlan={tripPlan}
        isTripActive={!!selectedCity}
        totalDays={calculateDays()}
        budget={budget}
        travelers={tripMembers.length}
        diet={diet} groupType={groupType}
        onRemoveItem={removeFromTrip}
        onAddToTrip={() => {}} 
        onResetApp={() => { if(confirm("Reset?")) window.location.reload(); }}
      />

      <main className="flex-1 relative h-full flex flex-col bg-gray-50">
        
        {/* --- GLOBAL HEADER (ALWAYS VISIBLE, Z-INDEX 50) --- */}
        <header className="absolute top-0 right-0 p-6 z-50 flex items-center gap-4">
           {/* Invite Button (Only if trip active & not dashboard) */}
           {tripPlan.length > 0 && activeView !== 'DASHBOARD' && (
              <button onClick={() => setActiveView('COLLAB' as any)} className="bg-white text-blue-600 px-4 py-2 rounded-full shadow-sm border border-blue-100 font-bold text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors">👥 Invite & Split</button>
           )}

           <div className="flex items-center gap-4">
              {/* Controls */}
              <div className="flex items-center bg-white/90 backdrop-blur rounded-full border border-gray-200 shadow-sm p-1">
                 <button className="px-3 py-1.5 hover:bg-gray-100 rounded-full text-sm font-bold text-gray-700 transition-colors">₹</button>
                 <div className="w-px h-4 bg-gray-300"></div>
                 <button className="px-3 py-1.5 hover:bg-gray-100 rounded-full text-xs font-bold text-gray-700 transition-colors">US</button>
                 <div className="w-px h-4 bg-gray-300"></div>
                 <button className="px-3 py-1.5 hover:bg-gray-100 rounded-full text-sm font-bold text-gray-700 transition-colors">°C</button>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                 <button 
                   onClick={() => setShowProfileMenu(!showProfileMenu)}
                   className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 hover:shadow-md transition-all relative shadow-sm"
                 >
                   {session.user.email?.[0].toUpperCase()}
                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                 </button>

                 {/* DROPDOWN */}
                 {showProfileMenu && (
                    <div className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-2 animate-fade-in-up origin-top-right z-50">
                       <div className="px-4 py-3 border-b border-gray-50 mb-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{session.user.email}</p>
                       </div>
                       <button onClick={()=>{setShowCreateModal(true); setShowProfileMenu(false);}} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-700">
                          <span>➕</span> New Trip
                       </button>
                       <button onClick={()=>{setActiveView('SETTINGS'); setShowProfileMenu(false);}} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-700">
                          <span>⚙️</span> Settings
                       </button>
                       <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-700">
                          <span>👑</span> Manage Subscription
                       </button>
                       <div className="h-px bg-gray-100 my-1"></div>
                       <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-500">
                          <span>ℹ️</span> About
                       </button>
                       <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-bold text-gray-500">
                          <span>💬</span> Contact
                       </button>
                       <div className="h-px bg-gray-100 my-1"></div>
                       <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-500">
                          <span>🚪</span> Sign Out
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </header>

        {/* --- DASHBOARD VIEW (With Images & Spacing Fix) --- */}
        {activeView === 'DASHBOARD' && !isWizardActive && (
          <div className="h-full overflow-y-auto">
             
             {/* HERO CARD (Added margin-top to clear header) */}
             <div className="bg-black p-12 mx-6 mt-24 mb-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[320px]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 blur-3xl rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative z-10 text-white max-w-2xl">
                   <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 text-blue-200 border border-white/5">AI Travel Assistant</span>
                   <h1 className="text-5xl font-black mb-4 tracking-tight text-white leading-tight">Good Morning,<br/>{userSettings.name || 'Traveler'}.</h1>
                   <p className="text-gray-300 max-w-md mb-8 text-sm leading-relaxed">Where does your next adventure take you? Let's plan something extraordinary today.</p>
                   
                   <button 
                     onClick={() => setShowCreateModal(true)}
                     className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-sm hover:scale-105 transition-transform inline-flex items-center gap-2 shadow-xl shadow-white/5"
                   >
                     <span>✨</span> Plan a New Trip
                   </button>
                </div>
             </div>

             {/* BROWSE BY VIBE (New Section) */}
             <div className="px-6 mb-10">
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Browse by Vibe</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                   {TRIP_VIBES.map((v) => (
                      <div key={v.id} className="relative h-24 rounded-2xl overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-all">
                         <img src={v.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                         <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
                         <span className="absolute bottom-3 left-3 text-white font-bold text-xs">{v.label}</span>
                      </div>
                   ))}
                </div>
             </div>

             {/* TRENDING DESTINATIONS (With Images) */}
             <div className="px-6 pb-20">
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Popular Destinations 🔥</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                   {POPULAR_DESTINATIONS.map((city, i) => (
                      <div key={i} className="min-w-[220px] h-40 bg-gray-100 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-xl transition-all">
                         <img src={city.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                         <div className="absolute bottom-4 left-4 z-10 text-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 mb-1 block">Explore</span>
                            <h4 className="font-black text-xl leading-none">{city.name}</h4>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* --- SETTINGS VIEW --- */}
        {activeView === 'SETTINGS' && (
           <div className="h-full bg-gray-50 p-8 overflow-y-auto pt-24">
              <div className="max-w-2xl mx-auto space-y-6">
                 <h2 className="text-3xl font-black text-gray-900">Settings</h2>
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Profile</h3>
                    <div className="flex items-center gap-6 mb-6">
                       <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-400">{userSettings.name[0]}</div>
                       <button className="text-blue-600 text-xs font-bold hover:underline">Change Avatar</button>
                    </div>
                    <div className="grid gap-4">
                       <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Name</label><input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold" value={userSettings.name} onChange={(e) => setUserSettings({...userSettings, name: e.target.value})}/></div>
                       <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label><input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold text-gray-400 cursor-not-allowed" value={userSettings.email} disabled /></div>
                    </div>
                 </div>
                 <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Preferences</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Currency</label><select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold" value={userSettings.currency} onChange={(e) => setUserSettings({...userSettings, currency: e.target.value})}><option value="INR">🇮🇳 INR (₹)</option><option value="USD">🇺🇸 USD ($)</option><option value="EUR">🇪🇺 EUR (€)</option></select></div>
                       <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Language</label><select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold" value={userSettings.language} onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}><option value="English">English</option><option value="Hindi">Hindi</option></select></div>
                    </div>
                 </div>
                 <div className="text-center pt-8"><button onClick={handleLogout} className="text-red-500 font-bold text-sm hover:bg-red-50 px-6 py-3 rounded-xl transition-colors">Log Out</button></div>
              </div>
           </div>
        )}

        {/* --- COLLAB VIEW --- */}
        {activeView === 'COLLAB' && <div className="h-full bg-gray-50 p-8 flex flex-col items-center pt-24"><div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[80vh]"><div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center"><div><h2 className="text-2xl font-black text-gray-900">Trip Hub</h2><p className="text-sm text-gray-500">Managing trip for <b>{tripMembers.length} people</b></p></div><div className="flex bg-gray-100 p-1 rounded-xl">{(['MEMBERS', 'CHAT', 'SPLIT'] as const).map(tab => <button key={tab} onClick={() => setCollabTab(tab)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${collabTab === tab ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>{tab === 'MEMBERS' && '👥 People'}{tab === 'CHAT' && '💬 Chat'}{tab === 'SPLIT' && '💸 Expenses'}</button>)}</div></div><div className="flex-1 overflow-y-auto p-6 bg-gray-50">{collabTab === 'MEMBERS' && <div className="space-y-6"><div className="bg-blue-50 p-5 rounded-2xl border border-blue-100"><h4 className="font-bold text-blue-900 text-sm mb-3">Invite Friends to Plan</h4><div className="flex gap-2"><div className="flex-1 bg-white border border-blue-200 rounded-xl px-4 py-3 text-xs font-mono text-gray-600 truncate flex items-center">{inviteLink}</div><button onClick={handleCopyLink} className="bg-blue-600 text-white px-6 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Copy Link 🔗</button></div><p className="text-[10px] text-blue-400 mt-2">Share this link to let friends view and edit this trip.</p></div><div><h4 className="font-bold text-gray-900 text-sm mb-3">Who's here ({tripMembers.length})</h4><div className="grid grid-cols-2 gap-3">{tripMembers.map((m,i)=>(<div key={i} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-3"><div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xs">{m[0]}</div><span className="font-bold text-sm text-gray-700">{m}</span></div>))}</div></div></div>}{collabTab === 'CHAT' && <div className="flex flex-col h-full"><div className="flex-1 space-y-3 mb-4 overflow-y-auto pr-2">{messages.map(m=><div key={m.id} className={`flex ${m.isMe?'justify-end':'justify-start'}`}><div className={`max-w-[75%] p-3 rounded-2xl text-xs ${m.isMe?'bg-blue-600 text-white rounded-br-none':'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>{!m.isMe&&<p className="text-[9px] font-bold opacity-60 mb-1">{m.user}</p>}{m.text}<p className={`text-[8px] mt-1 text-right ${m.isMe?'text-blue-200':'text-gray-400'}`}>{m.time}</p></div></div>)}</div><div className="bg-white p-2 rounded-xl border border-gray-200 flex gap-2"><input className="flex-1 bg-transparent p-2 text-xs focus:outline-none" placeholder="Type message..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMessage()} /><button onClick={handleSendMessage} className="bg-black text-white px-4 rounded-lg font-bold text-xs">Send</button></div></div>}{collabTab === 'SPLIT' && <div className="h-full flex flex-col"><div className="bg-green-50 border border-green-100 p-6 rounded-2xl mb-6 text-center shadow-sm"><p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Total Trip Cost</p><h3 className="text-4xl font-black text-gray-900">₹{totalCost.toLocaleString()}</h3><p className="text-xs text-green-800 mt-1 font-bold">₹{costPerPerson.toFixed(0)} / person</p><div className="flex justify-center gap-4 mt-4"><div className="bg-white px-3 py-1 rounded-lg border border-green-100 text-xs font-bold text-green-700">You Paid: ₹{myTotalPaid}</div><div className={`bg-white px-3 py-1 rounded-lg border text-xs font-bold ${myBalance>=0?'border-green-100 text-green-700':'border-red-100 text-red-700'}`}>{myBalance>=0?`Get Back: ₹${myBalance.toFixed(0)}`:`You Owe: ₹${Math.abs(myBalance).toFixed(0)}`}</div></div></div><div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">{expenses.map(e=><div key={e.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${e.who==='You'?'bg-blue-100 text-blue-600':'bg-orange-100 text-orange-600'}`}>{e.who[0]}</div><div><p className="font-bold text-xs text-gray-900">{e.what}</p><p className="text-[9px] text-gray-400">Paid by {e.who}</p></div></div><span className="font-mono font-bold text-xs text-gray-900">₹{e.amount}</span></div>)}</div>{showExpenseForm?<div className="bg-gray-100 p-4 rounded-xl animate-fade-in"><input className="w-full p-2 rounded-lg border border-gray-200 text-xs font-bold mb-2" placeholder="What for?" value={newExpense.what} onChange={e=>setNewExpense({...newExpense, what: e.target.value})}/><div className="flex gap-2 mb-2"><input className="flex-1 p-2 rounded-lg border border-gray-200 text-xs font-bold" type="number" placeholder="Amount" value={newExpense.amount} onChange={e=>setNewExpense({...newExpense, amount: e.target.value})}/><select className="flex-1 p-2 rounded-lg border border-gray-200 text-xs font-bold" value={newExpense.who} onChange={e=>setNewExpense({...newExpense, who: e.target.value})}>{tripMembers.map(m=><option key={m} value={m}>{m}</option>)}</select></div><div className="flex gap-2"><button onClick={handleAddExpense} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-xs">Save</button><button onClick={()=>setShowExpenseForm(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-bold text-xs">Cancel</button></div></div>:<button onClick={()=>setShowExpenseForm(true)} className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs shadow-lg hover:scale-[1.02] transition-transform">+ Add Expense</button>}</div>}</div></div></div>}

        {/* --- MODALS (Create, Help, Wizard) --- */}
        {activeView === 'DASHBOARD' && showCreateModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-y-auto max-h-[90vh]">
                 <h3 className="font-bold text-xl text-gray-900 mb-6">Create Your Vibe</h3>
                 <div className="mb-4 relative"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Destination</label><div className="flex gap-2"><input className="flex-1 p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold" placeholder="Search City..." value={selectedCity} onChange={(e) => handleCitySearch(e.target.value)} /><button onClick={handleUseLiveLocation} className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100" title="Use My Location">📍</button></div>{showSuggestions && <div className="absolute top-full w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 mt-1 max-h-40 overflow-y-auto">{citySuggestions.map((s,i)=><div key={i} onClick={()=>selectSuggestion(s)} className="p-3 hover:bg-blue-50 cursor-pointer text-sm font-bold border-b border-gray-50">📍 {s}</div>)}</div>}</div>
                 <div className="mb-4"><div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Location</label><button onClick={() => setShowStartHelp(!showStartHelp)} className="text-[10px] text-blue-500 font-bold hover:underline">Why ask? ❓</button></div><input className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-xs" placeholder="e.g. Airport, Hotel..." value={startLocation} onChange={(e) => setStartLocation(e.target.value)} />{showStartHelp && (<div className="mt-2 bg-blue-50 text-blue-800 text-[10px] p-2 rounded-lg border border-blue-100">💡 Optimizes route from your arrival point.</div>)}</div>
                 <div className="flex gap-3 mb-4"><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Start</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, start: e.target.value})} /></div><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">End</label><input type="date" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold" onChange={e => setDates({...dates, end: e.target.value})} /></div></div>
                 <div className="flex gap-3 mb-4"><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Diet</label><select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" value={diet} onChange={e => setDiet(e.target.value)}><option value="ANY">🍽️ Any</option><option value="VEG">🥦 Vegetarian</option><option value="VEGAN">🥗 Vegan</option><option value="JAIN">🌿 Jain</option><option value="HALAL">🍖 Halal</option><option value="EGG">🍳 Eggetarian</option></select></div><div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Budget</label><select className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-bold text-sm" value={budget} onChange={e => setBudget(e.target.value)}><option value="LOW">💸 Budget</option><option value="MEDIUM">⚖️ Standard</option><option value="HIGH">💎 Luxury</option></select></div></div>
                 <div className="mb-4"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Trip Vibe</label><div className="flex flex-wrap gap-2">{TRIP_VIBES.map((v) => (<button key={v.id} onClick={() => toggleVibe(v.id)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${selectedVibes.includes(v.id) ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>{v.label}</button>))}</div></div>
                 <div className="mb-6"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Who is traveling?</label><div className="grid grid-cols-2 gap-2">{[{ id: 'SOLO', label: '🧍 Solo' }, { id: 'FRIENDS', label: '👯 Friends' }, { id: 'FAMILY', label: '👨‍👩‍👧‍👦 Family' }, { id: 'CORPORATE', label: '💼 Corporate' }].map((t) => <button key={t.id} onClick={() => setGroupType(t.id)} className={`p-3 rounded-xl border text-left transition-all ${groupType === t.id ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}><div className="font-bold text-xs">{t.label}</div></button>)}</div></div>
                 <button onClick={startWizard} disabled={!selectedCity} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50">Start Customizing ➔</button>
                 <button onClick={() => setShowCreateModal(false)} className="w-full mt-2 text-gray-400 text-xs font-bold py-2">Cancel</button>
              </div>
           </div>
        )}

        {isWizardActive && (
            <div className="absolute inset-0 z-30 bg-gray-50 flex flex-col items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-6xl">
                    <div className="mb-6"><div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-2"><span>Planning Day {dynamicSteps[currentStepIndex]?.day}</span><span>Step {currentStepIndex + 1}/{dynamicSteps.length}</span></div><div className="h-2 bg-gray-200 rounded-full"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((currentStepIndex+1)/dynamicSteps.length)*100}%` }}></div></div></div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{dynamicSteps[currentStepIndex]?.label}</h2>
                    {isLoadingOptions ? <div className="h-64 flex items-center justify-center font-bold text-gray-400 animate-pulse">Filtering best spots...</div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stepOptions.map((place) => (
                                <div key={place.id} className="relative group">
                                    <button onClick={() => handleOptionSelect(place)} className="w-full bg-white rounded-3xl shadow-xl overflow-hidden hover:scale-105 transition-all text-left h-72 flex flex-col relative border border-transparent hover:border-blue-500">
                                        <div className="h-32 bg-gray-200 w-full relative">
                                           {place.image ? <img src={place.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-blue-50 to-purple-50">📍</div>}
                                           <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold">⭐ {place.aiScore?.toFixed(0)}%</div>
                                           {place.distanceFromLast && <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">👣 {place.distanceFromLast}</div>}
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col"><h3 className="font-bold text-md text-gray-900 mb-1 leading-tight">{place.name}</h3><p className="text-xs text-gray-500 line-clamp-2">{place.description || place.type}</p></div>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); openAiAssistant(place); }} className="absolute top-2 left-2 w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-10" title="Ask AI Genius">✨</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- GENIUS BUTTON MODAL --- */}
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

        {/* --- MAP PLAN (With ROUTING) --- */}
        {activeView === 'PLAN' && isLoaded && (
           <div className="h-full w-full relative">
              <GoogleMap mapContainerStyle={MAP_STYLES} center={mapCenter} zoom={12} options={{ disableDefaultUI: false, zoomControl: true }}>
                 {directionsResponse ? (
                    <DirectionsRenderer directions={directionsResponse} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#2563EB', strokeOpacity: 0.8, strokeWeight: 5 } }} />
                 ) : (
                    <Polyline path={tripPlan.map(p => ({ lat: p.lat, lng: p.lng }))} options={PATH_OPTIONS} />
                 )}
                 {tripPlan.map((place, index) => (
                    <Marker key={place.id} position={{ lat: place.lat, lng: place.lng }} label={{ text: `${index + 1}`, color: "white", fontWeight: "bold" }} title={place.name} />
                 ))}
              </GoogleMap>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-2xl p-2 flex gap-2 animate-fade-in-up">
                 <button onClick={calculateRoute} disabled={isRouting} className="bg-black text-white px-6 py-3 rounded-full font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                    {isRouting ? 'Calculating...' : '🛣️ Show Driving Route'}
                 </button>
                 <button onClick={() => setDirectionsResponse(null)} className="bg-white text-gray-500 border border-gray-200 px-4 py-3 rounded-full font-bold text-xs hover:bg-gray-50">Reset</button>
              </div>
           </div>
        )}

        {activeView === 'DISCOVERY' && <DiscoveryView onAddToTrip={() => {}} onBack={() => setActiveView('PLAN')} initialCity={selectedCity} />}
        
        {/* --- GLOBAL HELP WIDGET --- */}
        <div className="fixed bottom-6 right-6 z-50">
           <button onClick={() => setShowHelpModal(true)} className="w-12 h-12 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform text-xl font-bold">?</button>
           {showHelpModal && (
             <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in-up origin-bottom-right">
                <div className="bg-black p-4 flex justify-between items-center text-white"><h3 className="font-bold text-sm">Help & Support</h3><button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-white">✕</button></div>
                <div className="flex border-b border-gray-100"><button onClick={() => setHelpTab('GUIDE')} className={`flex-1 py-3 text-xs font-bold ${helpTab==='GUIDE'?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>Quick Guide</button><button onClick={() => setHelpTab('FEEDBACK')} className={`flex-1 py-3 text-xs font-bold ${helpTab==='FEEDBACK'?'text-blue-600 border-b-2 border-blue-600':'text-gray-400'}`}>Report / Idea</button></div>
                <div className="p-4 h-64 overflow-y-auto bg-gray-50">
                   {helpTab === 'GUIDE' ? (
                      <div className="space-y-4">{[{ icon: '🔎', title: 'Start a Trip', desc: 'Click "Plan New Trip" on the dashboard. Enter your city and preferences.' }, { icon: '🗺️', title: 'Customize', desc: 'Select places day-by-day. Use the "Start Location" to optimize the route.' }, { icon: '🤝', title: 'Invite Friends', desc: 'Once planned, go to the "Collab" tab to invite friends and split costs.' }, { icon: '📍', title: 'Discover', desc: 'Use the "Discover" tab to find hidden gems near you anytime.' }].map((item, i) => (<div key={i} className="flex gap-3"><div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-sm border border-gray-100">{item.icon}</div><div><h4 className="font-bold text-xs text-gray-900">{item.title}</h4><p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p></div></div>))}</div>
                   ) : (
                      <div className="flex flex-col h-full"><textarea className="flex-1 p-3 rounded-xl border border-gray-200 text-xs font-medium resize-none focus:outline-none focus:border-blue-500 mb-3" placeholder="Found a bug? Have an idea? Tell us..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} /><button onClick={submitFeedback} className="w-full bg-black text-white py-2 rounded-lg font-bold text-xs">Submit Feedback</button></div>
                   )}
                </div>
             </div>
           )}
        </div>

      </main>
    </div>
  );
}