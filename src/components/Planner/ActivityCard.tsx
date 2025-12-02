'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ItineraryItem, Place } from '@/types';
import { Clock, MapPin, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActivityCardProps {
    item: ItineraryItem;
    place?: Place;
    onDelete?: () => void;
}

export function ActivityCard({ item, place, onDelete }: ActivityCardProps) {
    return (
        <Card className="mb-3 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-start gap-4">
                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {place?.image ? (
                        <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
                    ) : (
                        <MapPin className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold truncate">{place?.name || 'Unknown Place'}</h4>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert('Reported as agency content')}>
                                    Report Agency Content
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                                    Remove
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                            {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {item.notes}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
