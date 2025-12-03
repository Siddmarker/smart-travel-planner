'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Briefcase, Settings, LogOut, Plus, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreateTripModal } from './CreateTripModal';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Trips', href: '/trips', icon: Briefcase },
    { name: 'Discover', href: '/discover', icon: Compass },
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
        <div className="flex h-screen w-64 flex-col border-r bg-white/80 backdrop-blur-xl border-gray-200 dark:bg-slate-900/80 dark:border-slate-800">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary tracking-tight">
                    <div className="relative h-10 w-32">
                        <Image
                            src="/logo.png"
                            alt="2wards Logo"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>
            </div>

            <div className="px-4 mb-6">
                <CreateTripModal>
                    <Button className="w-full justify-start gap-2 bg-gradient-to-r from-[#FF5C69] to-[#FFD166] hover:from-[#ff4b59] hover:to-[#ffc84d] text-white shadow-md hover:shadow-lg transition-all duration-300" size="lg">
                        <Plus className="h-5 w-5" />
                        <span className="font-semibold">New Trip</span>
                    </Button>
                </CreateTripModal>
            </div>

            <nav className="flex-1 space-y-2 px-3">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                                isActive
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
                            )}
                            <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-100 dark:border-slate-800 p-4 bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 mb-3">
                    <Avatar className="border-2 border-white shadow-sm">
                        <AvatarImage src={currentUser?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700">
                            {currentUser?.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{currentUser?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser?.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
