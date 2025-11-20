'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Map, LayoutDashboard, Briefcase, Settings, LogOut, Plus, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateTripModal } from './CreateTripModal';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'My Trips', href: '/trips', icon: Briefcase },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Map View', href: '/map', icon: Map },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout } = useStore();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-card">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <Map className="h-6 w-6" />
                    <span>TravelMate</span>
                </Link>
            </div>

            <div className="px-4 mb-4">
                <CreateTripModal>
                    <Button className="w-full justify-start gap-2" size="lg">
                        <Plus className="h-4 w-4" />
                        New Trip
                    </Button>
                </CreateTripModal>
            </div>

            <nav className="flex-1 space-y-1 px-3">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t p-4">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                        <AvatarImage src={currentUser?.avatar} />
                        <AvatarFallback>{currentUser?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
