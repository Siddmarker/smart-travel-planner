'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FeedbackType, FeedbackSubmission, FeedbackTypeConfig } from '@/types/feedback';

interface FeedbackModalProps {
    onClose: () => void;
    user: any;
}

export function FeedbackModal({ onClose, user }: FeedbackModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [feedback, setFeedback] = useState<Partial<FeedbackSubmission>>({
        type: 'general',
        rating: 0,
        message: '',
        category: '',
        urgency: 'low',
        allowContact: false,
        pageContext: typeof window !== 'undefined' ? window.location.pathname : '',
    });

    const feedbackTypes: Record<FeedbackType, FeedbackTypeConfig> = {
        bug: {
            icon: '🐛',
            title: 'Report a Bug',
            description: 'Something not working right? Let us know!',
            categories: ['Functionality', 'Performance', 'UI/UX', 'Data Issue']
        },
        feature: {
            icon: '💡',
            title: 'Suggest a Feature',
            description: 'Have an idea to make our platform better?',
            categories: ['New Feature', 'Improvement', 'Integration', 'Other']
        },
        general: {
            icon: '💬',
            title: 'Share Feedback',
            description: 'Tell us about your experience',
            categories: ['Praise', 'Suggestion', 'Question', 'Other']
        },
        content: {
            icon: '🏛️',
            title: 'Content Feedback',
            description: 'Issue with place information or recommendations?',
            categories: ['Wrong Info', 'Missing Place', 'Better Recommendation', 'Photo Issue']
        }
    };

    const handleSubmit = async () => {
        try {
            // Mock API call
            console.log('Submitting feedback:', { ...feedback, userId: user?.id });
            await new Promise(resolve => setTimeout(resolve, 1000));

            setCurrentStep(3); // Success state
            localStorage.setItem('hasGivenFeedback', 'true');
        } catch (error) {
            console.error('Feedback submission failed:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        {currentStep === 0 ? '👋 Help us improve' :
                            feedbackTypes[feedback.type as FeedbackType]?.title}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 w-full">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                    ></div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {currentStep === 0 && (
                        <div className="grid grid-cols-1 gap-3">
                            {(Object.keys(feedbackTypes) as FeedbackType[]).map((type) => (
                                <button
                                    key={type}
                                    className="flex items-center gap-4 p-4 rounded-xl border hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                    onClick={() => {
                                        setFeedback(prev => ({ ...prev, type }));
                                        setCurrentStep(1);
                                    }}
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">
                                        {feedbackTypes[type].icon}
                                    </span>
                                    <div>
                                        <div className="font-bold text-gray-900">{feedbackTypes[type].title}</div>
                                        <div className="text-sm text-gray-500">{feedbackTypes[type].description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <div className="flex flex-wrap gap-2">
                                    {feedbackTypes[feedback.type as FeedbackType].categories.map(cat => (
                                        <button
                                            key={cat}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${feedback.category === cat
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => setFeedback(prev => ({ ...prev, category: cat }))}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Details</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                    placeholder="Tell us more..."
                                    value={feedback.message}
                                    onChange={e => setFeedback(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setCurrentStep(0)}>Back</Button>
                                <Button
                                    onClick={() => setCurrentStep(2)}
                                    disabled={!feedback.message || !feedback.category}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="text-sm text-gray-500">How would you rate your experience?</div>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            className={`text-3xl transition-transform hover:scale-110 ${(feedback.rating || 0) >= star ? 'grayscale-0' : 'grayscale opacity-30'
                                                }`}
                                            onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                                        >
                                            ⭐
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium capitalize">{feedback.type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Category:</span>
                                    <span className="font-medium">{feedback.category}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="contact"
                                    checked={feedback.allowContact}
                                    onChange={e => setFeedback(prev => ({ ...prev, allowContact: e.target.checked }))}
                                    className="rounded border-gray-300"
                                />
                                <label htmlFor="contact" className="text-sm text-gray-600">
                                    It's okay to contact me about this feedback
                                </label>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={() => setCurrentStep(1)}>Back</Button>
                                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
                                    Submit Feedback
                                </Button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-6xl animate-bounce">🎉</div>
                            <h3 className="text-xl font-bold">Thank You!</h3>
                            <p className="text-gray-500">
                                Your feedback helps us make the platform better for everyone.
                            </p>
                            <Button onClick={onClose} className="mt-4">
                                Close
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
