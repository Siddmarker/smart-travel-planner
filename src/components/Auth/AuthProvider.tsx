'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/store/useStore';

const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();
    const { isAuthenticated, checkAuth, setCurrentUser } = useStore();

    useEffect(() => {
        // Check authentication status on mount
        checkAuth();
    }, [checkAuth]);

    // Sync NextAuth session with store
    useEffect(() => {
        if (session?.user && !isAuthenticated) {
            setCurrentUser({
                id: (session.user as any).id || 'google-user',
                name: session.user.name || 'User',
                email: session.user.email || '',
                avatar: session.user.image || '',
            });
        }
    }, [session, isAuthenticated, setCurrentUser]);

    useEffect(() => {
        // Redirect logic
        const isPublicRoute = publicRoutes.includes(pathname);

        if (!isAuthenticated && !isPublicRoute) {
            // Not authenticated and trying to access protected route
            router.push('/login');
        } else if (isAuthenticated && isPublicRoute) {
            // Authenticated and trying to access login/signup
            router.push('/');
        }
    }, [isAuthenticated, pathname, router]);

    return <>{children}</>;
}
