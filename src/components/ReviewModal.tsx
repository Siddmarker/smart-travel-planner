'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface ReviewModalProps {
    tripId: string;
    children?: React.ReactNode;
}

export function ReviewModal({ tripId, children }: ReviewModalProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const { updateTrip } = useStore();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        updateTrip(tripId, {
            review: {
                rating,
                comment,
                date: new Date().toISOString()
            }
        });

        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review your Trip</DialogTitle>
                    <DialogDescription>
                        How was your experience? Rate your trip and leave a comment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label>Rating</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-8 w-8 ${star <= rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="comment">Comments</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What was the highlight of your trip?"
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={rating === 0}>Submit Review</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
