import { UserProfile } from '@/types';

export const mockUserProfile: UserProfile = {
    id: 'user-1',
    name: 'Alex Thompson',
    email: 'alex.thompson@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    personalInfo: {
        phone: '+1 (555) 123-4567',
        nationality: 'United States',
        languages: ['English', 'Spanish', 'French'],
        coverPhoto: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200',
        bio: 'Passionate traveler exploring the world one destination at a time. Love photography, local cuisine, and meeting new people.',
    },
    travelPreferences: {
        accommodationTypes: ['hotel', 'apartment'],
        transportModes: ['flight', 'train'],
        activityLevel: 'moderate',
        diningPreferences: ['Local Cuisine', 'Vegetarian Options', 'Street Food'],
        budgetRange: 'moderate',
    },
    currencySettings: {
        primaryCurrency: 'USD',
        displayFormat: 'symbol',
        autoConvert: true,
    },
    privacySettings: {
        profileVisibility: 'public',
        showTravelHistory: true,
        showReviews: true,
    },
    travelStats: {
        countriesVisited: 23,
        tripsCompleted: 47,
        totalDistance: 125000, // km
        favoriteDestination: 'Paris, France',
    },
};
