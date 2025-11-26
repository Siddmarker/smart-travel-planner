'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    picture?: string;
    email_verified: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (userData: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app start and page refresh
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            // Check if user has existing valid session/token
            const token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                // In a real app, we would verify the token with the backend here
                // const verifiedUser = await verifyToken(token);
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                console.log('✅ User session restored:', parsedUser.email);
            } else {
                // No valid token, ensure user is null
                console.log('❌ No active session found');
                setUser(null);
                // Optionally redirect to login page if we were trying to access a protected route
                // But we'll let ProtectedRoute handle that to avoid redirect loops on public pages
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        } finally {
            setLoading(false);
        }
    };

    const login = (userData: User, token: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('✅ User logged in:', userData.email);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
        console.log('✅ User logged out');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
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
