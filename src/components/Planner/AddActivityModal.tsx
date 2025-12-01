'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlaceSearch } from '../Map/PlaceSearch';
import { Place } from '@/types';
import { TimeSlotName } from '@/lib/smart-itinerary';

interface AddActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectPlace: (place: Place) => void;
    dayId: string;
    timeSlot: TimeSlotName;
}

export function AddActivityModal({ isOpen, onClose, onSelectPlace, dayId, timeSlot }: AddActivityModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Add Activity to {timeSlot}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden p-4 pt-0">
                    <PlaceSearch
                        onAddPlace={(place) => {
                            onSelectPlace(place);
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
