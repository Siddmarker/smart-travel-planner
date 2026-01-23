'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- PROPS INTERFACE ---
interface WizardProps {
    onClose: () => void;
    onComplete: (data: any) => void;
}

// --- LOGIC HELPERS ---
const COASTAL_CITIES = [
    'Goa', 'Gokarna', 'Pondicherry', 'Varkala',
    'Mangalore', 'Udupi', 'Alibaug', 'Andaman'
];

const HILL_STATIONS = [
    'Coorg', 'Ooty', 'Munnar', 'Manali',
    'Shimla', 'Wayanad', 'Kodaikanal', 'Darjeeling', 'Leh'
];

type TabView = 'ITINERARY' | 'TRAVELERS' | 'PREFERENCES';

export default function CreateTripWizard({ onClose, onComplete }: WizardProps) {

    // --- UI STATE ---
    const [activeTab, setActiveTab] = useState<TabView>('ITINERARY');

    // --- FORM DATA STATE ---

    // 1. Destination & Dates
    const [destinations, setDestinations] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [dates, setDates] = useState({
        start: '',
        end: ''
    });

    // 2. Travelers
    const [groupType, setGroupType] = useState('FRIENDS');
    const [ageGroup, setAgeGroup] = useState<string[]>([]);

    // 3. Preferences (Deep Personalization)
    const [budget, setBudget] = useState({
        total: '',
        nightly: ''
    });

    const [preferences, setPreferences] = useState({
        tripVibe: [] as string[],   // What you want to DO (Adventure, Relaxing)
        stayType: [] as string[],   // Where you want to STAY (Resort, Homestay)
        amenities: [] as string[],  // Must-haves (Pool, WiFi)
        view: ''                    // Special (Sea View, etc.)
    });

    const [scope, setScope] = useState({
        transport: false,
        stay: true,
        activities: true
    });

    // --- GOOGLE PLACES SERVICE STATE ---
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [sessionToken, setSessionToken] = useState<any>(null);
    const autocompleteService = useRef<any>(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    }, []);

    // --- HANDLERS: SEARCH ---

    const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Clear if empty
        if (!val || val.length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        // Initialize service if needed
        if (!autocompleteService.current && window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }

        // Fetch Predictions
        autocompleteService.current?.getPlacePredictions(
            {
                input: val,
                types: ['(cities)'],
                sessionToken: sessionToken
            },
            (predictions: any[], status: any) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions);
                    setShowDropdown(true);
                } else {
                    setSuggestions([]);
                    setShowDropdown(false);
                }
            }
        );
    };

    const selectCity = (cityName: string) => {
        setDestinations([cityName]);
        setInputValue(cityName);
        setSuggestions([]);
        setShowDropdown(false);

        // Refresh token for next session
        if (window.google) {
            setSessionToken(new window.google.maps.places.AutocompleteSessionToken());
        }
    };

    // --- HANDLERS: LOGIC ---

    const getLocationType = () => {
        const primaryDest = destinations[0] || '';
        if (COASTAL_CITIES.some(c => primaryDest.includes(c))) return 'COASTAL';
        if (HILL_STATIONS.some(c => primaryDest.includes(c))) return 'HILL';
        return 'STANDARD';
    };

    const toggleAge = (age: string) => {
        setAgeGroup(prev =>
            prev.includes(age)
                ? prev.filter(a => a !== age)
                : [...prev, age]
        );
    };

    // Universal toggle for arrays in preferences
    const togglePreference = (category: 'tripVibe' | 'stayType' | 'amenities', value: string) => {
        setPreferences(prev => {
            const list = prev[category];
            return {
                ...prev,
                [category]: list.includes(value)
                    ? list.filter(v => v !== value)
                    : [...list, value]
            };
        });
    };

    // --- HANDLERS: NAVIGATION ---

    const handleAction = () => {
        if (activeTab === 'ITINERARY') {
            // Validation: Must have a destination
            if (destinations.length === 0 && !inputValue) return;

            // Auto-select if user typed but didn't click dropdown
            if (destinations.length === 0 && inputValue) {
                setDestinations([inputValue]);
            }

            setActiveTab('TRAVELERS');
        }
        else if (activeTab === 'TRAVELERS') {
            setActiveTab('PREFERENCES');
        }
        else {
            // Final Submit
            onComplete({
                destinations,
                dates,
                groupType,
                ageGroup,
                budget,
                preferences,
                scope
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">

            {/* MAIN CARD CONTAINER */}
            <div className="bg-white w-full max-w-2xl h-[750px] md:h-auto rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col transition-all duration-500">

                {/* CLOSE BUTTON */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 hover:text-black transition-colors z-20 font-bold"
                >
                    ✕
                </button>

                {/* --- HEADER & TABS --- */}
                <div className="pt-10 px-10 pb-6 bg-white shrink-0">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-6">
                        Plan your journey
                    </h2>

                    {/* CUSTOM TAB BAR */}
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full">
                        {(['ITINERARY', 'TRAVELERS', 'PREFERENCES'] as TabView[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${activeTab === tab
                                        ? 'bg-white text-black shadow-sm scale-100'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab === 'ITINERARY' && '📍 Itinerary'}
                                {tab === 'TRAVELERS' && '👥 Travelers'}
                                {tab === 'PREFERENCES' && '⚙️ Preferences'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- SCROLLABLE CONTENT AREA --- */}
                <div className="flex-1 overflow-y-auto px-10 pb-4 custom-scrollbar">

                    {/* ==========================
                        TAB 1: ITINERARY
                       ========================== */}
                    {activeTab === 'ITINERARY' && (
                        <div className="animate-in slide-in-from-right-8 duration-300 space-y-8">

                            {/* DESTINATION INPUT */}
                            <div className="relative">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">
                                    Where to?
                                </label>

                                <div className="relative group">
                                    <input
                                        className="w-full p-5 pl-14 rounded-3xl border-2 border-gray-100 bg-gray-50 text-xl font-bold text-gray-900 focus:border-black focus:bg-white focus:outline-none transition-all placeholder:text-gray-300"
                                        placeholder="Japan, Goa, Paris..."
                                        value={inputValue}
                                        onChange={handleCityInput}
                                        autoFocus
                                    />
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl grayscale opacity-40 group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all">
                                        🗺️
                                    </span>

                                    {/* DROPDOWN MENU */}
                                    {showDropdown && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 p-2">
                                            {suggestions.map((s) => (
                                                <div
                                                    key={s.place_id}
                                                    onClick={() => selectCity(s.description)}
                                                    className="px-5 py-4 hover:bg-gray-50 cursor-pointer flex items-center gap-4 rounded-2xl transition-colors"
                                                >
                                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                                                        📍
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">
                                                            {s.structured_formatting.main_text}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {s.structured_formatting.secondary_text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DATES INPUT */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">
                                    When?
                                </label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <span className="block text-[10px] font-bold text-gray-400 mb-1 ml-2">Start Date</span>
                                        <input
                                            type="date"
                                            className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold text-gray-900 focus:border-black outline-none"
                                            value={dates.start}
                                            onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className="block text-[10px] font-bold text-gray-400 mb-1 ml-2">End Date</span>
                                        <input
                                            type="date"
                                            className="w-full p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 font-bold text-gray-900 focus:border-black outline-none"
                                            value={dates.end}
                                            onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==========================
                        TAB 2: TRAVELERS
                       ========================== */}
                    {activeTab === 'TRAVELERS' && (
                        <div className="animate-in slide-in-from-right-8 duration-300 space-y-8">

                            {/* GROUP TYPE */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">
                                    Who is going?
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setGroupType(type)}
                                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${groupType === type
                                                    ? 'border-black bg-black text-white shadow-xl'
                                                    : 'border-gray-100 hover:border-gray-300 text-gray-400'
                                                }`}
                                        >
                                            <span className="text-3xl">
                                                {type === 'SOLO' ? '🧍' : type === 'COUPLE' ? '👫' : type === 'FAMILY' ? '👨‍👩‍👧‍👦' : '👯‍♂️'}
                                            </span>
                                            <span className="text-xs font-bold tracking-widest">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* AGE GROUPS */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-3 ml-1">
                                    Age Groups
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {['18-30', '31-50', '50+', 'Kids', 'Toddlers'].map(age => (
                                        <button
                                            key={age}
                                            onClick={() => toggleAge(age)}
                                            className={`px-6 py-3 rounded-full font-bold text-sm border-2 transition-all ${ageGroup.includes(age)
                                                    ? 'bg-[#FF5C69] text-white border-[#FF5C69]'
                                                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                                }`}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==========================
                        TAB 3: PREFERENCES
                       ========================== */}
                    {activeTab === 'PREFERENCES' && (
                        <div className="animate-in slide-in-from-right-8 duration-300 space-y-10">

                            {/* SECTION A: TRAVEL VIBE */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <span>🎒</span> Trip Vibe
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {['Relaxing', 'Adventure', 'Cultural', 'Foodie', 'Party', 'Shopping'].map(vib => (
                                        <button
                                            key={vib}
                                            onClick={() => togglePreference('tripVibe', vib)}
                                            className={`px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${preferences.tripVibe.includes(vib)
                                                    ? 'bg-black border-black text-white'
                                                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                }`}
                                        >
                                            {vib}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* SECTION B: ACCOMMODATION & BUDGET */}
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                    <span>🏨</span> Accommodation
                                </h3>

                                {/* BUDGET INPUTS */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                                            Avg. Nightly Budget
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-4 text-gray-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                placeholder="3000"
                                                className="w-full pl-8 p-4 bg-gray-50 rounded-2xl font-bold border-2 border-gray-100 focus:border-black outline-none"
                                                value={budget.nightly}
                                                onChange={e => setBudget({ ...budget, nightly: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                                            Total Trip Budget
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-4 text-gray-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                placeholder="50000"
                                                className="w-full pl-8 p-4 bg-gray-50 rounded-2xl font-bold border-2 border-gray-100 focus:border-black outline-none"
                                                value={budget.total}
                                                onChange={e => setBudget({ ...budget, total: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* STAY TYPE */}
                                <div className="mb-4">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                                        Stay Type & Vibe
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Luxury', 'Boutique', 'Rustic', 'Homestay', 'Resort', 'Cozy'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => togglePreference('stayType', type)}
                                                className={`px-4 py-2 rounded-xl font-bold text-xs border-2 transition-all ${preferences.stayType.includes(type)
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* AMENITIES */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">
                                        Must-Have Amenities
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Pool', 'WiFi', 'Spa', 'Gym', 'Breakfast', 'Parking'].map(am => (
                                            <button
                                                key={am}
                                                onClick={() => togglePreference('amenities', am)}
                                                className={`px-4 py-2 rounded-xl font-bold text-xs border-2 transition-all ${preferences.amenities.includes(am)
                                                        ? 'bg-green-600 border-green-600 text-white'
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {am}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* DYNAMIC VIEW SECTION (Conditional) */}
                            {getLocationType() !== 'STANDARD' && (
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-3 tracking-wider">
                                        {getLocationType() === 'COASTAL' ? '🌊 Ocean View?' : '⛰️ Mountain View?'}
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setPreferences({ ...preferences, view: 'VIEW' })}
                                            className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${preferences.view === 'VIEW'
                                                    ? 'border-blue-500 bg-white text-blue-600 shadow-sm'
                                                    : 'border-transparent bg-white/50 text-gray-400 hover:bg-white'
                                                }`}
                                        >
                                            Yes, please!
                                        </button>
                                        <button
                                            onClick={() => setPreferences({ ...preferences, view: 'STANDARD' })}
                                            className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${preferences.view === 'STANDARD'
                                                    ? 'border-black bg-white text-black shadow-sm'
                                                    : 'border-transparent bg-white/50 text-gray-400 hover:bg-white'
                                                }`}
                                        >
                                            No preference
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- FOOTER ACTION --- */}
                <div className="p-8 border-t border-gray-50 bg-white shrink-0">
                    <button
                        onClick={handleAction}
                        className="w-full bg-[#FF5C69] text-white text-lg font-bold py-4 rounded-full shadow-xl shadow-red-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {activeTab === 'PREFERENCES' ? 'Generate Itinerary ✨' : 'Continue →'}
                    </button>
                </div>

            </div>
        </div>
    );
}