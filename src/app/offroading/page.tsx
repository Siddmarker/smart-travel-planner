'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import OffRoadingSearch from '@/components/OffRoading/OffRoadingSearch';

export default function OffRoadingPage() {
    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <OffRoadingSearch />
                </main>
            </div>
        </ProtectedRoute>
    );
}
