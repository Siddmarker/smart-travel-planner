'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Trash2 } from 'lucide-react';
import { Trip } from '@/types';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TripCardProps {
    trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
    const { deleteTrip } = useStore();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = () => {
        deleteTrip(trip.id);
        setShowDeleteDialog(false);
    };

    return (
        <>
            <div className="place-card group relative">
                <div className="card-image">
                    {/* Placeholder for trip image with dynamic gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="card-badge flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {trip.destination.name}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 left-2 h-8 w-8 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 rounded-full shadow-sm"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowDeleteDialog(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <CardContent className="pt-5 pb-2 px-5">
                    <CardTitle className="text-xl font-bold mb-3 text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{trip.name}</CardTitle>
                    <div className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <span className="font-medium">
                                {new Date(trip.startDate).toLocaleDateString()} -{' '}
                                {new Date(trip.endDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                                <Users className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{trip.participants.length} travelers</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="px-5 pb-5 pt-2">
                    <Link href={`/trips/${trip.id}`} className="w-full">
                        <Button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-xl py-5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                            View Trip Details
                        </Button>
                    </Link>
                </CardFooter>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{trip.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
