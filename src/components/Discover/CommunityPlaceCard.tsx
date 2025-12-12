import React from 'react';
import { CommunityPlace } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, ThumbsUp, User } from 'lucide-react';

export interface CommunityPlaceCardProps {
    place: CommunityPlace;
}

export function CommunityPlaceCard({ place }: CommunityPlaceCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <div className="flex flex-col sm:flex-row">
                {/* Image Section */}
                <div className="sm:w-1/3 h-48 sm:h-auto relative bg-muted">
                    {place.image ? (
                        <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Image
                        </div>
                    )}
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                            <User className="h-3 w-3 mr-1" /> Community
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <CardContent className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-lg">{place.name}</h3>
                                <div className="flex items-center text-sm text-muted-foreground mb-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span className="truncate max-w-[200px]">{place.vicinity}</span>
                                </div>
                            </div>
                            <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded text-xs font-bold text-yellow-700 dark:text-yellow-400">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                {place.rating}
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {place.description}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                            {place.categoryTags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs font-normal">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                            Submitted by <span className="font-medium">{place.submittedBy}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                                <ThumbsUp className="h-3 w-3 mr-1" /> {place.upvotes}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
}
