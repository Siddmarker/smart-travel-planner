import { Trip, Place, DayPlan, ItineraryItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export type TimeSlotName = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export type DayStatus = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface TimeSlot {
    name: TimeSlotName;
    activities: ItineraryItem[];
    duration: number; // in minutes
    category: string[];
    isVisible: boolean;
    priority: number;
    suggestedActivities?: Place[];
}

export interface SmartDay extends DayPlan {
    dayNumber: number;
    timeSlots: TimeSlot[];
    isVisible: boolean;
    fillPercentage: number;
    needsAttention: boolean;
    isEmpty: boolean;
    status: DayStatus;
    progress: number;
}

export class SmartItineraryBuilder {
    private itinerary: SmartDay[] = [];
    private defaultTimeSlots: TimeSlotName[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
    private minimumFillThreshold = 0.5; // 50% minimum fill per day

    constructor(private trip: Trip) {
        // Initialize with existing days if any, or empty
        this.initializeFromTrip();
    }

    private initializeFromTrip() {
        const start = new Date(this.trip.startDate);
        const end = new Date(this.trip.endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Map existing days by date string (YYYY-MM-DD) for easy lookup
        const existingDaysMap = new Map<string, DayPlan>();
        this.trip.days.forEach(day => {
            const dateKey = new Date(day.date).toISOString().split('T')[0];
            existingDaysMap.set(dateKey, day);
        });

        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + (dayNum - 1));
            const dateKey = currentDate.toISOString().split('T')[0];

            const existingDay = existingDaysMap.get(dateKey);

            if (existingDay) {
                this.itinerary.push(this.enrichDay(existingDay, dayNum));
            } else {
                this.itinerary.push(this.createEmptyDay(currentDate, dayNum));
            }
        }
    }

    private createEmptyDay(date: Date, dayNumber: number): SmartDay {
        return {
            id: uuidv4(),
            date: date.toISOString(),
            items: [],
            dayNumber,
            timeSlots: this.createTimeSlots(),
            isVisible: true,
            fillPercentage: 0,
            needsAttention: true,
            isEmpty: true,
            status: 'NOT_STARTED',
            progress: 0
        };
    }

    private enrichDay(day: DayPlan, dayNumber: number): SmartDay {
        const timeSlots = this.createTimeSlots();

        // Distribute existing items into slots
        day.items.forEach(item => {
            const slotName = this.getSlotForTime(item.startTime);
            const slot = timeSlots.find(s => s.name === slotName);
            if (slot) {
                slot.activities.push(item);
            }
        });

        const filledSlots = timeSlots.filter(s => s.activities.length > 0).length;
        const totalSlots = 4; // Morning, Afternoon, Evening, Night
        const fillPercentage = (filledSlots / totalSlots) * 100;

        let status: DayStatus = 'NOT_STARTED';
        if (filledSlots === totalSlots) status = 'COMPLETED';
        else if (filledSlots > 0) status = 'IN_PROGRESS';

        return {
            ...day,
            dayNumber,
            timeSlots,
            isVisible: true,
            fillPercentage,
            needsAttention: fillPercentage < 50,
            isEmpty: filledSlots === 0,
            status,
            progress: fillPercentage
        };
    }

    private createTimeSlots(): TimeSlot[] {
        return this.defaultTimeSlots.map(slot => ({
            name: slot,
            activities: [],
            duration: this.calculateSlotDuration(slot),
            category: this.categorizeSlot(slot),
            isVisible: true,
            priority: this.getSlotPriority(slot)
        }));
    }

    private calculateSlotDuration(slot: TimeSlotName): number {
        switch (slot) {
            case 'Morning': return 4 * 60; // 8am - 12pm
            case 'Afternoon': return 5 * 60; // 12pm - 5pm
            case 'Evening': return 4 * 60; // 5pm - 9pm
            case 'Night': return 3 * 60; // 9pm - 12am
            default: return 0;
        }
    }

    private categorizeSlot(slot: TimeSlotName): string[] {
        switch (slot) {
            case 'Morning': return ['nature', 'culture', 'coffee'];
            case 'Afternoon': return ['attraction', 'food', 'shopping'];
            case 'Evening': return ['food', 'entertainment', 'walk'];
            case 'Night': return ['bar', 'club', 'relax'];
            default: return [];
        }
    }

    private getSlotPriority(slot: TimeSlotName): number {
        return slot === 'Morning' || slot === 'Evening' ? 1 : 2;
    }

    private getSlotForTime(timeStr?: string): TimeSlotName {
        if (!timeStr) return 'Morning';
        const hour = parseInt(timeStr.split(':')[0]);
        if (hour >= 5 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night';
    }

    // Public API to get the processed itinerary
    public getItinerary(): SmartDay[] {
        return this.itinerary;
    }

    // Force show all days (Quick Fix logic)
    public forceShowAllDays(): SmartDay[] {
        this.itinerary.forEach(day => {
            day.isVisible = true;
            // Ensure slots exist
            this.defaultTimeSlots.forEach(slotName => {
                if (!day.timeSlots.find(s => s.name === slotName)) {
                    day.timeSlots.push({
                        name: slotName,
                        activities: [],
                        duration: this.calculateSlotDuration(slotName),
                        category: this.categorizeSlot(slotName),
                        isVisible: true,
                        priority: this.getSlotPriority(slotName)
                    });
                }
            });
            // Sort slots
            day.timeSlots.sort((a, b) => {
                return this.defaultTimeSlots.indexOf(a.name) - this.defaultTimeSlots.indexOf(b.name);
            });
        });
        return this.itinerary;
    }
}
