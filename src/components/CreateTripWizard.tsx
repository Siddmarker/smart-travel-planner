'use client';

import React, { useState } from 'react';

interface WizardProps {
    onClose: () => void;
    onComplete: (data: any) => void;
}

export default function CreateTripWizard({ onClose, onComplete }: WizardProps) {
    const [step, setStep] = useState(1);

    // --- DATA STATE ---
    const [destination, setDestination] = useState('');
    const [scope, setScope] = useState({
        transport: false,
        stay: false,
        activities: true, // Always true by default
    });

    const [dates, setDates] = useState({ start: '', end: '' });
    const [times, setTimes] = useState({ arrival: '10:00', departure: '18:00' });

    const [groupType, setGroupType] = useState('FRIENDS');
    const [ageGroup, setAgeGroup] = useState<string[]>([]);

    // --- HANDLERS ---
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

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
        else {
            // FINISH
            onComplete({ destination, scope, dates, times, groupType, ageGroup });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-4xl h-[600px] rounded-3xl shadow-2xl flex overflow-hidden">

                {/* --- LEFT SIDEBAR (Progress) --- */}
                <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-8 flex flex-col justify-between hidden md:flex">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-8">Plan Your Trip</h2>
                        <div className="space-y-6">
                            <StepIndicator num={1} title="Scope & Destination" active={step === 1} done={step > 1} />
                            <StepIndicator num={2} title="Logistics & Timings" active={step === 2} done={step > 2} />
                            <StepIndicator num={3} title="Travelers & Vibe" active={step === 3} done={step > 3} />
                        </div>
                    </div>

                    <div className="text-xs text-gray-400">
                        Step {step} of 3
                    </div>
                </div>

                {/* --- RIGHT CONTENT (Dynamic) --- */}
                <div className="flex-1 p-8 md:p-12 flex flex-col relative">

                    <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black">✕</button>

                    {/* STEP 1: SCOPE */}
                    {step === 1 && (
                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Where to?</h3>
                            <p className="text-gray-500 mb-8">Enter your destination and tell us what you need help with.</p>

                            <input
                                className="w-full text-2xl font-bold border-b-2 border-gray-200 focus:border-black outline-none py-2 mb-10 placeholder-gray-300"
                                placeholder="e.g. Bangalore, Goa, Ooty..."
                                value={destination}
                                onChange={e => setDestination(e.target.value)}
                                autoFocus
                            />

                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">I need help with...</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ScopeCard icon="✈️" label="Transport" selected={scope.transport} onClick={() => toggleScope('transport')} />
                                <ScopeCard icon="🏨" label="Accommodation" selected={scope.stay} onClick={() => toggleScope('stay')} />
                                <ScopeCard icon="🎡" label="Itinerary" selected={true} onClick={() => { }} disabled />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: LOGISTICS */}
                    {step === 2 && (
                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">When are you going?</h3>
                            <p className="text-gray-500 mb-8">Exact timings help us suggest realistic plans.</p>

                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Arrival (Start)</label>
                                    <div className="flex gap-2">
                                        <input type="date" className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
                                        <input type="time" className="w-24 p-3 bg-gray-50 rounded-xl font-bold border border-gray-200" value={times.arrival} onChange={e => setTimes({ ...times, arrival: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Departure (End)</label>
                                    <div className="flex gap-2">
                                        <input type="date" className="w-full p-3 bg-gray-50 rounded-xl font-bold border border-gray-200" value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
                                        <input type="time" className="w-24 p-3 bg-gray-50 rounded-xl font-bold border border-gray-200" value={times.departure} onChange={e => setTimes({ ...times, departure: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start">
                                <div className="text-blue-500 text-xl">💡</div>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    <strong>Tip:</strong> If you arrive at {times.arrival}, we will skip morning activities for Day 1 and start your itinerary directly from check-in or lunch.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: DEMOGRAPHICS */}
                    {step === 3 && (
                        <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
                            <h3 className="text-3xl font-black text-gray-900 mb-2">Who is traveling?</h3>
                            <p className="text-gray-500 mb-8">We tailor the vibe based on your group.</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <GroupCard icon="🧍" label="Solo" selected={groupType === 'SOLO'} onClick={() => setGroupType('SOLO')} />
                                <GroupCard icon="👫" label="Couple" selected={groupType === 'COUPLE'} onClick={() => setGroupType('COUPLE')} />
                                <GroupCard icon="👨‍👩‍👧‍👦" label="Family" selected={groupType === 'FAMILY'} onClick={() => setGroupType('FAMILY')} />
                                <GroupCard icon="👯‍♂️" label="Friends" selected={groupType === 'FRIENDS'} onClick={() => setGroupType('FRIENDS')} />
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

                    {/* NAVIGATION BUTTONS */}
                    <div className="mt-auto flex justify-between pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button onClick={() => setStep(step - 1)} className="px-6 py-3 font-bold text-gray-500 hover:text-black">Back</button>
                        ) : <div></div>}

                        <button
                            onClick={handleNext}
                            disabled={!destination && step === 1}
                            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
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
        <div className={`flex items-center gap-4 ${active ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${active || done ? 'bg-black border-black text-white' : 'border-gray-300 text-gray-400'}`}>
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