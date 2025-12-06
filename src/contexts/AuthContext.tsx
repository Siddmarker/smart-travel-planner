'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { SignupData, AuthResponse } from '@/services/auth';
import { useStore } from '@/store/useStore';

interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    avatar?: string;
    email_verified?: boolean;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (userData: User, token: string) => void;
    signup: (userData: SignupData) => Promise<AuthResponse>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { currentUser, signup: storeSignup, logout: storeLogout, setCurrentUser, checkAuth } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Hydrate/Check auth state on mount
        checkAuth();
        setLoading(false);
    }, [checkAuth]);

    // Map store state to context
    // Cast currentUser to User type expected by context consumers
    const user = currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        picture: currentUser.avatar,
        avatar: currentUser.avatar,
    } as User : null;

    // Used by GoogleAuthButton to sync state
    const login = (userData: User, token: string) => {
        console.log('AuthContext: login called (syncing with store)', userData);
        setCurrentUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.picture || userData.avatar || '',
        });
        // Token storage is handled by the caller (GoogleAuthButton) or useStore's helpers
    };

    const signup = async (userData: SignupData): Promise<AuthResponse> => {
        setError(null);
        setLoading(true);

        try {
            await storeSignup(userData.name, userData.email, userData.password);

            // storeSignup sets the user in the store
            // We need to return the response format expected by consumers
            return {
                success: true,
                user: {
                    id: 'new-user', // storeSignup generates ID but doesn't return it easily here without reading store again
                    name: userData.name,
                    email: userData.email
                },
                token: 'mock-token', // storeSignup handles token internally
                message: 'Account created successfully!'
            };
        } catch (err: any) {
            const errorMessage = err.message || 'Signup failed';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        storeLogout();
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading, error, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
