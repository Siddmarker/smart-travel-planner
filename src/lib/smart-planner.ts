import { Place, UserPreferences } from '@/types';

interface DaySlot {
    time: string;
    places: Place[];
    selected: Place | null;
}

interface DayPlan {
    dayNumber: number;
    date: string;
    status: 'pending' | 'planned' | 'completed';
    slots: {
        morning: DaySlot;
        afternoon: DaySlot;
        evening: DaySlot;
    };
    travelLog: any[];
    constraints: string[];
    metrics?: {
        totalPlaces: number;
        avgScore: number;
        categoryDiversity: number;
        estimatedCost: number;
        travelTime: number;
    };
}

interface TripData {
    destination: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    startLocation?: { lat: number; lng: number };
}

export class SmartItineraryPlanner {
    private geminiApiKey: string;
    private user: UserPreferences;
    public trip: {
        destination: string;
        startDate: string;
        endDate: string;
        totalDays: number;
        currentDay: number;
        days: DayPlan[];
        visitedPlaces: Set<string>;
        preferences: UserPreferences;
    };
    private categories: string[];

    constructor(apiKey: string, userPreferences: UserPreferences, tripData: TripData) {
        this.geminiApiKey = apiKey;
        this.user = userPreferences;
        this.categories = userPreferences.interests || [];
        this.trip = this.initializeTrip(tripData);
    }

    // 1. TRIP INITIALIZATION
    private initializeTrip(tripData: TripData) {
        const { destination, startDate, endDate, totalDays } = tripData;

        // Calculate all dates in trip
        const dates = this.generateDateRange(startDate, endDate, totalDays);

        return {
            destination,
            startDate,
            endDate,
            totalDays,
            currentDay: 1,
            days: dates.map((date, index) => ({
                dayNumber: index + 1,
                date,
                status: 'pending' as const,
                slots: {
                    morning: { time: '09:00-12:00', places: [], selected: null },
                    afternoon: { time: '14:00-17:00', places: [], selected: null },
                    evening: { time: '19:00-22:00', places: [], selected: null }
                },
                travelLog: [],
                constraints: []
            })),
            visitedPlaces: new Set<string>(),
            preferences: this.user
        };
    }

    // 2. SMART PLACE SUGGESTION ENGINE
    public async suggestPlacesForDay(dayNumber: number) {
        const day = this.trip.days[dayNumber - 1];
        const previousDay = dayNumber > 1 ? this.trip.days[dayNumber - 2] : null;

        // Generate suggestions for each slot in parallel
        const slots = Object.keys(day.slots);
        const suggestionPromises = slots.map(async (slot) => {
            const prompt = this.buildGeminiPrompt(dayNumber, slot, previousDay);
            const geminiResponse = await this.callGeminiAPI(prompt);
            return {
                slot,
                places: this.parseGeminiPlaces(geminiResponse, slot)
            };
        });

        const results = await Promise.all(suggestionPromises);

        const suggestions: { [key: string]: Place[] } = {};
        results.forEach(result => {
            suggestions[result.slot] = result.places;
        });

        return suggestions;
    }

    // 3. GEMINI PROMPT ENGINEERING
    private buildGeminiPrompt(dayNumber: number, timeSlot: string, previousDay: DayPlan | null) {
        const location = this.trip.destination;
        const categories = this.categories.join(', ');
        const visited = Array.from(this.trip.visitedPlaces).join(', ') || 'None yet';
        const previousPlaces = previousDay ?
            Object.values(previousDay.slots)
                .map(s => s.selected?.name)
                .filter(Boolean)
                .join(', ') : 'First day';

        return `
    You are an expert travel planner. Suggest exactly 3 places for a tourist in ${location}.

    CONTEXT:
    - Day ${dayNumber} of trip, ${timeSlot} slot (${dayNumber === 1 ? 'first day' : 'following day'})
    - User likes: ${categories}
    - Already visited: ${visited}
    - Yesterday visited: ${previousPlaces}
    - Time constraints: ${this.getTimeConstraints(timeSlot)}
    - Must exclude: Travel agencies, timeshare companies, booking offices

    REQUIREMENTS:
    1. Each suggestion must have:
       - Name
       - Category (from: ${categories})
       - Opening hours for ${timeSlot}
       - Why it's suitable (considering previous activities)
       - Distance/time from likely previous location
       - Cost estimate ($$/$$$/$$$$$)

    2. Prioritize:
       - Places open during ${timeSlot}
       - Logical flow from previous activities
       - Not too repetitive with visited places
       - Mix of popular and unique experiences
       - Account for travel time between locations

    3. Format each suggestion as JSON:
       {
         "name": "Place Name",
         "category": "Museum/Restaurant/Park etc",
         "description": "Brief why it's good for this time",
         "opening_hours": "9:00-18:00",
         "is_open_now": true/false,
         "travel_time_from_previous": "15 mins walk",
         "cost_range": "$$",
         "feasibility_score": 1-10,
         "unique_selling_point": "What makes it special",
         "lat": 0,
         "lng": 0
       }

    4. Return exactly 3 suggestions in this format:
       [
         { suggestion 1 },
         { suggestion 2 },
         { suggestion 3 }
       ]

    5. Consider these constraints for ${timeSlot}:
       ${this.getSlotConstraints(timeSlot)}

    Respond with ONLY the JSON array, no other text.
    `;
    }

    // 4. CONSTRAINTS AND FILTERING
    private getSlotConstraints(timeSlot: string) {
        const constraints: { [key: string]: string[] } = {
            morning: [
                'Places that open early (by 9 AM)',
                'Good for morning energy levels',
                'Not too crowded in mornings',
                'Consider breakfast/lunch options nearby'
            ],
            afternoon: [
                'Avoid places that close early (before 5 PM)',
                'Indoor options for hot afternoons',
                'Places with shade or AC',
                'Consider siesta culture if applicable'
            ],
            evening: [
                'Places open late (after 7 PM)',
                'Good lighting for evening visits',
                'Safety considerations',
                'Dinner options nearby'
            ]
        };
        return constraints[timeSlot]?.join(', ') || '';
    }

    private getTimeConstraints(slot: string) {
        const times: { [key: string]: string } = {
            morning: '3 hours including travel',
            afternoon: '3 hours with possible lunch break',
            evening: '3 hours including dinner'
        };
        return times[slot] || 'Flexible';
    }

    // 5. GEMINI API INTEGRATION
    private async callGeminiAPI(prompt: string) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1000,
                    }
                })
            });

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Invalid response from Gemini:', data);
                return '[]';
            }
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            return '[]';
        }
    }

    // 6. RESPONSE PARSING AND VALIDATION
    private parseGeminiPlaces(geminiResponse: string, slot: string): Place[] {
        try {
            // Extract JSON from response
            const jsonMatch = geminiResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('No JSON found in response');

            const suggestions = JSON.parse(jsonMatch[0]);

            // Validate and filter suggestions
            return suggestions
                .slice(0, 3) // Ensure only 3
                .map((suggestion: any, index: number) => ({
                    ...suggestion,
                    id: `smart-suggestion-${slot}-${Date.now()}-${index}`,
                    slot: slot,
                    // Add computed fields (mocked for now as they require complex logic)
                    distanceScore: this.calculateDistanceScore(suggestion.travel_time_from_previous),
                    categoryMatch: this.calculateCategoryMatch(suggestion.category),
                    overallScore: this.calculateOverallScore(suggestion),
                    // Ensure Place interface compliance
                    rating: 4.5,
                    reviews: 100,
                    priceLevel: suggestion.cost_range?.length || 2,
                    image: '',
                    rawTypes: [suggestion.category],
                    vicinity: this.trip.destination,
                    tags: ['Smart Suggestion']
                }))
                .sort((a: any, b: any) => b.overallScore - a.overallScore);

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            return this.getFallbackSuggestions(slot);
        }
    }

    // 7. SCORING AND RANKING LOGIC
    private calculateOverallScore(suggestion: any) {
        const weights = {
            feasibility: 0.3,
            categoryMatch: 0.25,
            distance: 0.2,
            uniqueness: 0.15,
            costAppropriateness: 0.1
        };

        let score = 0;

        // Feasibility score (from Gemini)
        score += (suggestion.feasibility_score / 10) * weights.feasibility * 100;

        // Category match with user preferences
        score += this.calculateCategoryMatch(suggestion.category) * weights.categoryMatch * 100;

        // Distance score (closer is better)
        score += this.calculateDistanceScore(suggestion.travel_time_from_previous) * weights.distance * 100;

        // Uniqueness (not visited before)
        if (!this.trip.visitedPlaces.has(suggestion.name)) {
            score += weights.uniqueness * 100;
        }

        // Cost appropriateness (based on user budget)
        const costScore = this.calculateCostScore(suggestion.cost_range);
        score += costScore * weights.costAppropriateness * 100;

        return Math.min(100, Math.round(score));
    }

    private calculateDistanceScore(travelTimeString: string) {
        // Convert "15 mins walk" or "30 mins drive" to score
        const timeMatch = travelTimeString?.match(/(\d+)\s*mins?/);
        if (!timeMatch) return 0.5;

        const minutes = parseInt(timeMatch[1]);
        if (minutes <= 15) return 1.0;
        if (minutes <= 30) return 0.7;
        if (minutes <= 45) return 0.4;
        return 0.1;
    }

    private calculateCategoryMatch(suggestionCategory: string) {
        return this.categories.some(cat => suggestionCategory.toLowerCase().includes(cat.toLowerCase())) ? 1.0 : 0.3;
    }

    private calculateCostScore(costRange: string) {
        const userBudget = this.user.budget || '$$'; // $$ = moderate
        const costMap: { [key: string]: number } = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4, '$$$$$': 5 };
        const userCost = costMap[userBudget] || 2;
        const suggestionCost = costMap[costRange] || 2;

        const diff = Math.abs(userCost - suggestionCost);
        if (diff === 0) return 1.0;
        if (diff === 1) return 0.7;
        if (diff === 2) return 0.3;
        return 0;
    }

    // 8. DAY PROGRESSION LOGIC
    public async planDay(dayNumber: number) {
        if (dayNumber < 1 || dayNumber > this.trip.totalDays) {
            throw new Error('Invalid day number');
        }

        const day = this.trip.days[dayNumber - 1];

        // Get suggestions for all slots
        const suggestions = await this.suggestPlacesForDay(dayNumber);

        // Update day with suggestions
        for (const slot in suggestions) {
            (day.slots as any)[slot].places = suggestions[slot];
            // Auto-select top suggestion (or leave for user choice)
            // if (this.user.autoSelectTopSuggestion) {
            //   (day.slots as any)[slot].selected = suggestions[slot][0];
            //   this.trip.visitedPlaces.add(suggestions[slot][0].name);
            // }
        }

        day.status = 'planned';
        this.trip.currentDay = dayNumber;

        // Calculate day metrics
        day.metrics = this.calculateDayMetrics(day);

        return day;
    }

    private calculateDayMetrics(day: DayPlan) {
        const allPlaces = Object.values(day.slots)
            .flatMap(slot => slot.places);

        return {
            totalPlaces: allPlaces.length,
            avgScore: allPlaces.length ? Math.round(allPlaces.reduce((sum, p: any) => sum + (p.overallScore || 0), 0) / allPlaces.length) : 0,
            categoryDiversity: 0, // Placeholder
            estimatedCost: 0, // Placeholder
            travelTime: 0 // Placeholder
        };
    }

    // 9. FEASIBILITY CHECKS
    public checkFeasibility(dayNumber: number) {
        const day = this.trip.days[dayNumber - 1];
        const constraints: string[] = [];

        // Check time feasibility between slots
        const slots = ['morning', 'afternoon', 'evening'];
        for (let i = 0; i < slots.length - 1; i++) {
            const currentSlot = (day.slots as any)[slots[i]];
            const nextSlot = (day.slots as any)[slots[i + 1]];

            if (currentSlot.selected && nextSlot.selected) {
                // Mock travel time check
                const travelTime = 30; // Mock value

                if (travelTime > 60) { // More than 1 hour travel
                    constraints.push(`Long travel (${travelTime} mins) between ${slots[i]} and ${slots[i + 1]}`);
                }
            }
        }

        // Check opening hours
        for (const slot of slots) {
            const place = (day.slots as any)[slot].selected;
            if (place && !(place as any).is_open_now) {
                constraints.push(`${place.name} may be closed during ${slot}`);
            }
        }

        day.constraints = constraints;
        return constraints.length === 0 ? 'feasible' : 'needs_adjustment';
    }

    // 10. FALLBACK SUGGESTIONS
    private getFallbackSuggestions(slot: string): Place[] {
        // Return default suggestions if Gemini fails
        return [
            {
                id: `fallback-${slot}-1`,
                name: "Local Market Visit",
                category: "Shopping" as any,
                description: "Experience local culture and fresh produce",
                lat: 0, lng: 0,
                rating: 4.5,
                reviews: 100,
                priceLevel: 1,
                image: '',
                rawTypes: ['shopping'],
                vicinity: this.trip.destination,
                tags: ['Fallback']
            }
        ];
    }

    // 11. USER INTERACTION METHODS
    public selectPlace(dayNumber: number, slot: string, placeIndex: number) {
        const day = this.trip.days[dayNumber - 1];
        const place = (day.slots as any)[slot].places[placeIndex];

        if (place) {
            (day.slots as any)[slot].selected = place;
            this.trip.visitedPlaces.add(place.name);
            return { success: true, place };
        }

        return { success: false, error: 'Invalid selection' };
    }

    public getDaySummary(dayNumber: number) {
        const day = this.trip.days[dayNumber - 1];
        const selectedPlaces = Object.values(day.slots)
            .map(slot => slot.selected)
            .filter(Boolean);

        return {
            dayNumber,
            date: day.date,
            places: selectedPlaces,
            totalCost: 0, // Placeholder
            totalTravelTime: 0, // Placeholder
            constraints: day.constraints,
            suggestions: [] // Placeholder
        };
    }

    // 13. HELPER FUNCTIONS
    private generateDateRange(startDate: string, endDate: string, totalDays: number) {
        const dates: string[] = [];
        const current = new Date(startDate);

        for (let i = 0; i < totalDays; i++) {
            dates.push(new Date(current).toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }
}
