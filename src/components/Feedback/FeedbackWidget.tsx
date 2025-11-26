'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackModal } from './FeedbackModal';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const [showPulse, setShowPulse] = useState(false);

    // Auto-show pulse after some time if user hasn't given feedback
    useEffect(() => {
        const hasGivenFeedback = localStorage.getItem('hasGivenFeedback');
        if (!hasGivenFeedback) {
            const timer = setTimeout(() => setShowPulse(true), 10000); // Show pulse after 10s
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <>
            <motion.div
                className="fixed bottom-6 right-6 z-50"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full w-14 h-14 shadow-xl bg-white hover:bg-gray-50 text-2xl relative border border-gray-200"
                    size="icon"
                >
                    💡
                    {showPulse && (
                        <span className="absolute top-0 right-0 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                    )}
                </Button>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <FeedbackModal
                        onClose={() => setIsOpen(false)}
                        user={user}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
