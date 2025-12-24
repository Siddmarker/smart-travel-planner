'use client';

import { useState, useEffect } from 'react';

// --- Types ---
interface Place {
    id: string;
    name?: string;
    description?: string;
    // ... other fields from API
}

interface PlaceOption {
    id: string;
    type: 'ANCHOR_PLUS_SAT' | 'SATELLITE' | 'FOOD';
    anchor?: { name: string; description?: string };
    satellite?: { name: string };
    place_name?: string;
    description?: string;
    votes: number;
}

interface DayData {
    day_number: number;
    slots: {
        morning: PlaceOption[];
        lunch: PlaceOption[];
        afternoon: PlaceOption[];
        evening_snacks: PlaceOption[];
        sunset: PlaceOption[];
        dinner: PlaceOption[];
    };
}

interface TripWizardProps {
    preferences: {
        trip_duration: number;
        // ... other prefs
        vibe: string;
        travel_mode: string;
        group_type: string;
        diet: string;
    };
    onComplete: (itinerary: any[]) => void;
}

// Simple Spinner
const Spinner = () => (
    <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full animate-spin"></div>
    </div>
);

// --- Sub-Component: Voting Card ---
const OptionCard = ({ option, isSelected, onClick }: { option: PlaceOption, isSelected: boolean, onClick: () => void }) => {

    // Helper to get display name/desc based on type
    let title = option.place_name || option.anchor?.name || "Unknown Place";
    let sub = option.description || option.anchor?.description || "";
    let badge = "";

    if (option.type === 'ANCHOR_PLUS_SAT' && option.satellite) {
        sub = `+ ${option.satellite.name}`;
        badge = "Combo";
    }

    return (
        <div
            onClick={onClick}
            className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected
                    ? 'border-green-500 bg-green-50 shadow-md transform scale-[1.02]'
                    : 'border-neutral-100 bg-white hover:border-neutral-300 hover:shadow-sm'
                }
            `}
        >
            {/* Selection Circle */}
            <div className={`
                absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                ${isSelected ? 'bg-green-500 border-green-500' : 'border-neutral-300'}
            `}>
                {isSelected && <span className="text-white text-xs">✓</span>}
            </div>

            {/* Badge */}
            {badge && (
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-blue-700 mb-2">
                    {badge}
                </span>
            )}

            <h4 className="font-bold text-neutral-900 pr-6">{title}</h4>
            <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{sub}</p>
        </div>
    );
};


// --- Main Component ---
export default function TripWizard({ preferences, onComplete }: TripWizardProps) {

    // State
    const [currentDay, setCurrentDay] = useState(1);
    const [confirmedItinerary, setConfirmedItinerary] = useState<any[]>([]);
    const [historyIDs, setHistoryIDs] = useState<string[]>([]);

    const [dayData, setDayData] = useState<DayData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Selections for the current day: { slotName: optionId }
    const [selections, setSelections] = useState<Record<string, string>>({});

    const totalDays = preferences.trip_duration || 3; // Default 3 if missing

    // Fetch Logic
    useEffect(() => {
        const fetchDay = async () => {
            setIsLoading(true);
            setSelections({}); // Reset selections for new day (or keep empty)

            try {
                const payload = {
                    day_number: currentDay,
                    previous_selections: historyIDs,
                    vibe: preferences.vibe,
                    group_type: preferences.group_type,
                    travel_mode: preferences.travel_mode,
                    diet: preferences.diet || 'Any'
                };

                const res = await fetch('/api/generate-trip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) throw new Error('API Failed');

                const data = await res.json();
                setDayData(data.day);

            } catch (err) {
                console.error("Failed to load day", err);
                // Handle error (retry button etc)
            } finally {
                setIsLoading(false);
            }
        };

        fetchDay();
    }, [currentDay, historyIDs, preferences]); // Re-run when these change (standard Progressive flow)


    // Handle Option Click
    const handleSelect = (slotKey: string, optionId: string) => {
        setSelections(prev => ({
            ...prev,
            [slotKey]: optionId
        }));
    };

    // Lock & Next Logic
    const handleNext = () => {
        if (!dayData) return;

        // 1. Validate: Only ensure selection for slots THAT HAVE OPTIONS
        const requiredSlots = ['morning', 'lunch', 'afternoon', 'sunset', 'dinner'];

        // Check which slots actually have data displayed
        const availableSlots = requiredSlots.filter(s => {
            const opts = (dayData.slots as any)[s];
            return opts && Array.isArray(opts) && opts.length > 0;
        });

        const missing = availableSlots.filter(s => !selections[s]);

        console.log('[TripWizard] Validation State:', {
            allSlots: requiredSlots,
            availableSlots,
            currentSelections: selections,
            missing
        });

        if (missing.length > 0) {
            alert(`Please select an option for: ${missing.map(m => m.replace('_', ' ')).join(', ')}`);
            return;
        }

        // 2. Build Final Day Object
        const finalizedSlots: any = {};
        const newIds: string[] = [];

        // Push selections for available slots
        Object.entries(selections).forEach(([slot, id]) => {
            // Find the place object in that slot's array
            const list = (dayData.slots as any)[slot] as PlaceOption[];
            if (!list) return;

            const chosen = list.find(o => o.id === id);
            if (chosen) {
                finalizedSlots[slot] = chosen;
                newIds.push(chosen.id);
                if (chosen.satellite) {
                    // Satellite logic if needed
                }
            }
        });

        const finalizedDay = {
            day_number: currentDay,
            ...finalizedSlots
        };

        // 3. Update State
        const updatedHistory = [...historyIDs, ...newIds];
        const updatedItinerary = [...confirmedItinerary, finalizedDay];

        setHistoryIDs(updatedHistory);
        setConfirmedItinerary(updatedItinerary);

        // 4. Progress or Finish
        if (currentDay < totalDays) {
            setCurrentDay(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            onComplete(updatedItinerary);
        }
    };


    // Render
    if (isLoading) return <Spinner />;
    if (!dayData) return <div className="p-8 text-center text-red-500">Failed to load recommendations.</div>;

    const SLOTS_CONFIG = [
        { key: 'morning', label: 'Morning Adventure' },
        { key: 'lunch', label: 'Lunch Break' },
        { key: 'afternoon', label: 'Afternoon Exploration' },
        { key: 'evening_snacks', label: 'Evening Snacks' },
        { key: 'sunset', label: 'Sunset & Views' }, // Renamed label
        { key: 'dinner', label: 'Dinner' }
    ];

    return (
        <div className="max-w-3xl mx-auto pb-32">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-semibold text-neutral-500 mb-2">
                    <span>Day {currentDay} of {totalDays}</span>
                    <span>{Math.round(((currentDay - 1) / totalDays) * 100)}% Complete</span>
                </div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-black transition-all duration-500 ease-out"
                        style={{ width: `${((currentDay - 1) / totalDays) * 100}%` }}
                    />
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Curate Your Day {currentDay}</h2>

            {/* Slots Grid */}
            <div className="space-y-10">
                {SLOTS_CONFIG.map(slot => {
                    const options = (dayData.slots as any)[slot.key] as PlaceOption[];
                    // Was: if (!options || options.length === 0) return null;
                    // Now: Render place cards OR "Free Roam" message

                    return (
                        <section key={slot.key} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-1 bg-black rounded-full"></div>
                                <h3 className="text-lg font-bold">{slot.label}</h3>
                            </div>

                            {(!options || options.length === 0) ? (
                                <div className="p-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-300 text-center">
                                    <p className="text-neutral-500 italic">
                                        No specific suggestions for this time - Free Roam!
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {options.map(opt => (
                                        <OptionCard
                                            key={opt.id}
                                            option={opt}
                                            isSelected={selections[slot.key] === opt.id}
                                            onClick={() => handleSelect(slot.key, opt.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center pointer-events-none">
                <button
                    onClick={handleNext}
                    className="pointer-events-auto bg-black text-white px-8 py-4 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    {currentDay === totalDays ? 'Finish & View Trip' : 'Lock Day & Next →'}
                </button>
            </div>

        </div>
    );
}
