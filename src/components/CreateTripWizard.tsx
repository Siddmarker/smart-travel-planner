'use client';

import React, { useState, useEffect, useRef } from 'react';

interface WizardProps {
    onClose: () => void;
    onComplete: (data: any) => void;
}

export default function CreateTripWizard({ onClose, onComplete }: WizardProps) {
    // --- WIZARD STEP STATE ---
    const [step, setStep] = useState(1);

    // --- FORM DATA STATE ---
    // We use an array for destinations to support multi-city trips
    const [destinations, setDestinations] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    const [scope, setScope] = useState({
        transport: false,
        stay: false,
        activities: true,
    });

    const [dates, setDates] = useState({
        start: '',
        end: ''
    });

    const [times, setTimes] = useState({
        arrival: '10:00',
        departure: '18:00'
    });

    const [groupType, setGroupType] = useState('FRIENDS');
    const [ageGroup, setAgeGroup] = useState<string[]>([]);

    // --- GOOGLE AUTOCOMPLETE STATE ---
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const autocompleteService = useRef<any>(null);

    // 1. Initialize Google Autocomplete Service
    useEffect(() => {
        if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
    }, []);

    // 2. Handle Typing in Destination Input
    const handleCityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Lazy load service if it wasn't ready on mount
        if (!autocompleteService.current && typeof window !== 'undefined' && window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }

        if (!val || val.length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            return;
        }

        // Fetch predictions from Google
        autocompleteService.current.getPlacePredictions(
            { input: val, types: ['(cities)'] },
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

    // 3. Add City Tag on Selection
    const selectCity = (cityName: string) => {
        if (!destinations.includes(cityName)) {
            setDestinations([...destinations, cityName]);
        }
        setInputValue(''); // Clear input for next city
        setSuggestions([]);
        setShowDropdown(false);
    };

    // 4. Remove City Tag
    const removeCity = (cityToRemove: string) => {
        setDestinations(destinations.filter(c => c !== cityToRemove));
    };

    // --- TOGGLE HANDLERS ---
    const toggleScope = (key: 'transport' | 'stay') => {
        setScope(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAge = (age: string) => {
        if (ageGroup.includes(age)) {
            setAgeGroup(prev => prev.filter(a => a !== age));
        } else {
            setAgeGroup(prev => [...prev, age]);
        }
    };

    // --- NAVIGATION HANDLER ---
    const handleNext = () => {
        if (step < 3) {
            // Validation / Auto-add for Step 1
            if (step === 1) {
                // If user typed something but didn't select it, assume that's the destination
                if (destinations.length === 0 && inputValue.trim()) {
                    setDestinations([inputValue.trim()]);
                    setInputValue('');
                } else if (destinations.length === 0 && !inputValue.trim()) {
                    // If absolutely nothing is entered, don't proceed (or show alert)
                    return;
                }
            }
            setStep(step + 1);
        } else {
            // FINAL SUBMISSION
            let finalDestinations = [...destinations];

            // Edge case: User typed a city in Step 1 but didn't hit enter, then clicked through
            if (finalDestinations.length === 0 && inputValue.trim()) {
                finalDestinations.push(inputValue.trim());
            }

            onComplete({
                destinations: finalDestinations,
                scope,
                dates,
                times,
                groupType,
                ageGroup
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">

            {/* MAIN MODAL CONTAINER */}
            <div className="bg-white w-full max-w-4xl h-[600px] rounded-3xl shadow-2xl flex relative">

                {/* --- LEFT SIDEBAR (Progress & Branding) --- */}
                <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-8 flex flex-col justify-between hidden md:flex rounded-l-3xl">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-8">Plan Your Trip</h2>
                        <div className="space-y-6">
                            <StepIndicator
                                num={1}
                                title="Destinations"
                                active={step === 1}
                                done={step > 1}
                            />
                            <StepIndicator
                                num={2}
                                title="Logistics"
                                active={step === 2}
                                done={step > 2}
                            />
                            <StepIndicator
                                num={3}
                                title="Travelers"
                                active={step === 3}
                                done={step > 3}
                            />
                        </div>
                    </div>

                    <div className="text-xs text-gray-400">
                        Step {step} of 3
                    </div>
                </div>

                {/* --- RIGHT CONTENT AREA --- */}
                <div
                    className="flex-1 p-8 md:p-12 flex flex-col relative rounded-r-3xl"
                    onClick={() => setShowDropdown(false)}
                >

                    {/* CLOSE BUTTON */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                    >
                        ✕
                    </button>

                    {/* --- STEP 1: DESTINATIONS --- */}
                    {step === 1 && (
                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Where to?</h3>
                            <p className="text-gray-500 mb-6">Type a city (e.g. Ooty, Coorg). You can add multiple for a road trip.</p>

                            {/* ACTIVE TAGS */}
                            <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                                {destinations.map(city => (
                                    <span key={city} className="bg-black text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 animate-in zoom-in duration-300">
                                        {city}
                                        <button onClick={() => removeCity(city)} className="hover:text-red-400 font-bold ml-1">✕</button>
                                    </span>
                                ))}
                            </div>

                            {/* SEARCH INPUT */}
                            <div className="relative mb-10 z-50">
                                <input
                                    className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-black outline-none py-2 placeholder-gray-300 bg-transparent"
                                    placeholder="Type & Select City..."
                                    value={inputValue}
                                    onChange={handleCityInput}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (suggestions.length > 0) setShowDropdown(true);
                                    }}
                                    autoFocus
                                />

                                {/* DROPDOWN MENU */}
                                {showDropdown && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-2xl mt-2 max-h-60 overflow-y-auto z-[100]">
                                        {suggestions.map((s) => (
                                            <div
                                                key={s.place_id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectCity(s.description);
                                                }}
                                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 text-sm font-medium text-gray-700 flex gap-2 items-center transition-colors"
                                            >
                                                <span className="opacity-50">📍</span> {s.description}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">I need help with...</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ScopeCard
                                    icon="✈️"
                                    label="Transport"
                                    selected={scope.transport}
                                    onClick={() => toggleScope('transport')}
                                />
                                <ScopeCard
                                    icon="🏨"
                                    label="Accommodation"
                                    selected={scope.stay}
                                    onClick={() => toggleScope('stay')}
                                />
                                <ScopeCard
                                    icon="🎡"
                                    label="Itinerary"
                                    selected={true}
                                    onClick={() => { }}
                                    disabled
                                />
                            </div>
                        </div>
                    )}

                    {/* --- STEP 2: LOGISTICS --- */}
                    {step === 2 && (
                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">When?</h3>
                            <p className="text-gray-500 mb-8">Dates help us check weather and events.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* ARRIVAL INPUTS */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Arrival (Start)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            className="flex-1 p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 focus:border-black focus:outline-none transition-colors"
                                            value={dates.start}
                                            onChange={e => setDates({ ...dates, start: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            className="w-32 p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 focus:border-black focus:outline-none transition-colors"
                                            value={times.arrival}
                                            onChange={e => setTimes({ ...times, arrival: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* DEPARTURE INPUTS */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Departure (End)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            className="flex-1 p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 focus:border-black focus:outline-none transition-colors"
                                            value={dates.end}
                                            onChange={e => setDates({ ...dates, end: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            className="w-32 p-3 bg-gray-50 rounded-xl font-bold border border-gray-200 focus:border-black focus:outline-none transition-colors"
                                            value={times.departure}
                                            onChange={e => setTimes({ ...times, departure: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                                <span className="text-xl">💡</span>
                                <p className="text-sm text-blue-800 font-medium">We optimize your route based on these times to save you travel hours!</p>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 3: TRAVELERS --- */}
                    {step === 3 && (
                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Who is going?</h3>
                            <p className="text-gray-500 mb-8">We tailor the vibe (Party vs Chill) based on this.</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <GroupCard
                                    icon="🧍"
                                    label="Solo"
                                    selected={groupType === 'SOLO'}
                                    onClick={() => setGroupType('SOLO')}
                                />
                                <GroupCard
                                    icon="👫"
                                    label="Couple"
                                    selected={groupType === 'COUPLE'}
                                    onClick={() => setGroupType('COUPLE')}
                                />
                                <GroupCard
                                    icon="👨‍👩‍👧‍👦"
                                    label="Family"
                                    selected={groupType === 'FAMILY'}
                                    onClick={() => setGroupType('FAMILY')}
                                />
                                <GroupCard
                                    icon="👯‍♂️"
                                    label="Friends"
                                    selected={groupType === 'FRIENDS'}
                                    onClick={() => setGroupType('FRIENDS')}
                                />
                            </div>

                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Age Group (Select all that apply)</h4>
                            <div className="flex gap-3">
                                {['18-30', '31-50', '50+', 'Kids'].map(age => (
                                    <button
                                        key={age}
                                        onClick={() => toggleAge(age)}
                                        className={`px-6 py-3 rounded-full font-bold text-sm border transition-all ${ageGroup.includes(age) ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                                    >
                                        {age}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- FOOTER NAVIGATION --- */}
                    <div className="mt-auto flex justify-between pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 font-bold text-gray-500 hover:text-black transition-colors"
                            >
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <button
                            onClick={handleNext}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                        >
                            {step === 3 ? 'Generate Itinerary ✨' : 'Next Step →'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function StepIndicator({ num, title, active, done }: any) {
    return (
        <div className={`flex items-center gap-4 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${active || done ? 'bg-black border-black text-white' : 'border-gray-300 text-gray-400'}`}>
                {done ? '✓' : num}
            </div>
            <span className="font-bold text-gray-900">{title}</span>
        </div>
    );
}

function ScopeCard({ icon, label, selected, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            <span className="text-2xl">{icon}</span>
            <span className={`font-bold text-sm ${selected ? 'text-blue-700' : 'text-gray-600'}`}>{label}</span>
            {selected && <span className="text-[10px] font-bold uppercase text-blue-500">Selected</span>}
        </button>
    );
}

function GroupCard({ icon, label, selected, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selected ? 'border-black bg-gray-900 text-white shadow-xl scale-105' : 'border-gray-100 hover:border-gray-300 text-gray-500 hover:bg-gray-50'}`}
        >
            <span className="text-4xl">{icon}</span>
            <span className="font-bold text-sm">{label}</span>
        </button>
    );
}