'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

const publicRoutes = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, checkAuth } = useStore();

    useEffect(() => {
        // Check authentication status on mount
        checkAuth();
    }, [checkAuth]);

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
