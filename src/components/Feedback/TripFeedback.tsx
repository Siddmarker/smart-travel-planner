'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TripFeedbackProps {
    tripId: string;
    tripName: string;
    onClose?: () => void;
}

export function TripFeedback({ tripId, tripName, onClose }: TripFeedbackProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [highlight, setHighlight] = useState('');

    useEffect(() => {
        // Check if feedback already given
        const hasGiven = localStorage.getItem(`tripFeedback_${tripId}`);
        if (!hasGiven) {
            // Simulate checking if trip is completed (in real app, check trip dates)
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [tripId]);

    const handleSubmit = () => {
        console.log('Submitting trip feedback:', { tripId, rating, highlight });
        localStorage.setItem(`tripFeedback_${tripId}`, 'true');
        setIsOpen(false);
        if (onClose) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                    >
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl font-bold">✨ How was {tripName}?</h2>
                            <p className="text-gray-600">Help us improve recommendations for your next adventure!</p>

                            <div className="flex justify-center gap-2 py-4">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'grayscale-0' : 'grayscale opacity-30'
                                            }`}
                                        onClick={() => setRating(star)}
                                    >
                                        ⭐
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="What was the highlight of your trip?"
                                rows={3}
                                value={highlight}
                                onChange={e => setHighlight(e.target.value)}
                            />

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Maybe Later
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={handleSubmit}
                                    disabled={rating === 0}
                                >
                                    Submit
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
