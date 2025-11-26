'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { FeedbackWidget } from '@/components/Feedback/FeedbackWidget';

const publicRoutes = ['/', '/login', '/signup', '/features', '/pricing'];

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicRoute = publicRoutes.includes(pathname);

    return (
        <>
            {isPublicRoute ? (
                // Public routes (login/signup) - no sidebar
                <div className="h-screen overflow-y-auto bg-background">
                    {children}
                </div>
            ) : (
                // Protected routes - with sidebar
                <div className="flex h-screen overflow-hidden">
                    <aside className="hidden md:block">
                        <Sidebar />
                    </aside>
                    <main className="flex-1 overflow-y-auto bg-background">
                        {children}
                    </main>
                </div>
            )}
            <FeedbackWidget />
        </>
    );
}
