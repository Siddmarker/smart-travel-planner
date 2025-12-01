'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { authService, SignupData, AuthResponse } from '@/services/auth';
import { useStore } from '@/store/useStore';

interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
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
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { setCurrentUser: setStoreUser } = useStore();

    useEffect(() => {
        // Check if user is logged in on app start and page refresh
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            // Check if user has existing valid session/token
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('userData'); // Changed from 'user' to 'userData' to match request

            if (token && userData) {
                // In a real app, we would verify the token with the backend here
                // const verifiedUser = await verifyToken(token);
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);

                // SYNC WITH ZUSTAND STORE
                // This ensures components using useStore (like Sidebar, NewTripPage) are updated
                setStoreUser(parsedUser);

                console.log('✅ User session restored:', parsedUser.email);
            } else {
                // No valid token, ensure user is null
                console.log('❌ No active session found');
                setUser(null);
                setStoreUser(null as any); // Force clear store
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setStoreUser(null as any);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData: SignupData): Promise<AuthResponse> => {
        setError(null);
        setLoading(true);

        try {
            const result = await authService.signup(userData);

            if (result.success && result.user && result.token) {
                // ✅ CRITICAL: Store token and user data
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));

                // Update state
                setUser(result.user);

                return {
                    success: true,
                    user: result.user,
                    token: result.token,
                    message: result.message
                };
            } else {
                const errorMsg = result.error || 'Signup failed';
                setError(errorMsg);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Signup failed. Please try again.';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const login = (userData: User, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        console.log('✅ User logged in:', userData.email);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setUser(null);
        console.log('✅ User logged out');
        // Optional: Redirect to login is handled by components or manually
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
