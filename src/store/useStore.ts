import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserProfile, Place } from '@/types';
import { validateCredentials, createUser, setAuthToken, clearAuthToken, getUserFromToken, mockGoogleLogin, findUserByEmail } from '@/lib/auth';

interface AppState {
    currentUser: UserProfile | User | null;
    places: Place[];
    savedPlaces: Place[];
    isAuthenticated: boolean;
    setCurrentUser: (user: UserProfile | User) => void;
    updateCurrentUser: (updates: Partial<UserProfile>) => void;
    addPlace: (place: Place) => void;
    savePlace: (place: Place) => void;
    removeSavedPlace: (placeId: string) => void;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => void;
    checkAuth: () => void;
}

export const useStore = create<AppState>()(persist((set) => ({
    currentUser: null,
    isAuthenticated: false,
    savedPlaces: [],
    places: [
        {
            id: 'place-1',
            name: 'Mysore Palace',
            category: 'attraction',
            lat: 12.3052,
            lng: 76.6552,
            rating: 4.7,
            reviews: 15000,
            priceLevel: 2,
            image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220',
            description: 'Historical palace and royal residence of the Wadiyar dynasty.'
        },
        {
            id: 'place-2',
            name: 'Chamundi Hills',
            category: 'nature',
            lat: 12.2725,
            lng: 76.6730,
            rating: 4.6,
            reviews: 8000,
            priceLevel: 1,
            image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
            description: 'Sacred hill with Chamundeshwari Temple and panoramic city views.'
        },
        {
            id: 'place-3',
            name: 'Brindavan Gardens',
            category: 'nature',
            lat: 12.4244,
            lng: 76.5719,
            rating: 4.5,
            reviews: 12000,
            priceLevel: 1,
            image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
            description: 'Beautiful terrace garden with musical fountain show.'
        },
        {
            id: 'place-4',
            name: 'St. Philomena\'s Cathedral',
            category: 'culture',
            lat: 12.3151,
            lng: 76.6394,
            rating: 4.6,
            reviews: 5000,
            priceLevel: 1,
            image: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092',
            description: 'Neo-Gothic style cathedral, one of the tallest churches in Asia.'
        },
        {
            id: 'place-5',
            name: 'Mysore Zoo',
            category: 'attraction',
            lat: 12.3009,
            lng: 76.6550,
            rating: 4.4,
            reviews: 9000,
            priceLevel: 1,
            image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7',
            description: 'One of India\'s oldest and most well-maintained zoos.'
        }
    ],
    setCurrentUser: (user) => set({
        currentUser: user,
        isAuthenticated: !!user
    }),
    updateCurrentUser: (updates) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...updates } as UserProfile : null
    })),
    addPlace: (place) => set((state) => ({
        places: [...state.places, place]
    })),
    savePlace: (place) => set((state) => ({
        savedPlaces: [...state.savedPlaces, place]
    })),
    removeSavedPlace: (placeId) => set((state) => ({
        savedPlaces: state.savedPlaces.filter(p => p.id !== placeId)
    })),

    // Authentication actions

    login: async (email: string, password: string) => {
        const user = validateCredentials(email, password);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        setAuthToken(user.id);
        set({
            currentUser: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
            isAuthenticated: true,
        });
    },

    signup: async (name: string, email: string, password: string) => {
        const existing = findUserByEmail(email);
        if (existing) {
            throw new Error('Email already registered');
        }

        const user = createUser(name, email, password);
        setAuthToken(user.id);
        set({
            currentUser: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
            isAuthenticated: true,
        });
    },

    loginWithGoogle: async () => {
        const user = await mockGoogleLogin();
        setAuthToken(user.id);
        set({
            currentUser: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
            isAuthenticated: true,
        });
    },

    logout: () => {
        clearAuthToken();
        set({
            currentUser: null,
            isAuthenticated: false,
        });
    },

    checkAuth: () => {
        const user = getUserFromToken();
        if (user) {
            set({
                currentUser: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                },
                isAuthenticated: true,
            });
        } else {
            set({
                currentUser: null,
                isAuthenticated: false,
            });
        }
    },
}), {
    name: '2wards-storage',
    partialize: (state) => ({
        places: state.places,
        savedPlaces: state.savedPlaces,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated
    })
}));
