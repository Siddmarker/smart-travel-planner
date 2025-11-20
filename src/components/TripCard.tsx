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
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-muted relative group">
                    {/* Placeholder for trip image with dynamic gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 left-4 text-white z-10">
                        <div className="flex items-center gap-1 text-xs font-medium opacity-90 mb-1">
                            <MapPin className="h-3 w-3" />
                            {trip.destination.name}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                            e.preventDefault();
                            setShowDeleteDialog(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <CardContent className="pt-4">
                    <CardTitle className="text-xl mb-2">{trip.name}</CardTitle>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {new Date(trip.startDate).toLocaleDateString()} -{' '}
                                {new Date(trip.endDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{trip.participants.length} travelers</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Link href={`/trips/${trip.id}`} className="w-full">
                        <Button className="w-full">View Trip</Button>
                    </Link>
                </CardFooter>
            </Card>

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
