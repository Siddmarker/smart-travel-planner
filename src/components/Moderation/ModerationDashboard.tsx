import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubmissionService } from '@/lib/submission-service';
import { UserSubmission } from '@/types';
import { CheckCircle, XCircle, MapPin, Star, Clock } from 'lucide-react';

export function ModerationDashboard() {
    const [pendingSubmissions, setPendingSubmissions] = useState<UserSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSubmissions = () => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            const pending = SubmissionService.getPendingSubmissions();
            setPendingSubmissions(pending);
            setIsLoading(false);
        }, 500);
    };

    useEffect(() => {
        loadSubmissions();
    }, []);

    const handleApprove = async (id: string) => {
        await SubmissionService.approveSubmission(id);
        loadSubmissions();
    };

    const handleReject = async (id: string) => {
        await SubmissionService.rejectSubmission(id, 'Does not meet quality standards');
        loadSubmissions();
    };

    const getQualityColor = (score: number) => {
        if (score >= 0.8) return 'bg-green-100 text-green-800';
        if (score >= 0.5) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
                    <p className="text-muted-foreground">Review and manage user place submissions</p>
                </div>
                <Button onClick={loadSubmissions} variant="outline">Refresh</Button>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                    {isLoading ? (
                        <div className="text-center py-8">Loading submissions...</div>
                    ) : pendingSubmissions.length === 0 ? (
                        <div className="text-center py-12 bg-muted/30 rounded-lg">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                            <h3 className="text-lg font-medium">All caught up!</h3>
                            <p className="text-muted-foreground">No pending submissions to review.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingSubmissions.map((submission) => (
                                <Card key={submission.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle>{submission.basicInfo.name}</CardTitle>
                                                    <Badge variant="secondary">{submission.basicInfo.category}</Badge>
                                                    <Badge className={getQualityColor(submission.qualityScore || 0)}>
                                                        Quality: {Math.round((submission.qualityScore || 0) * 100)}%
                                                    </Badge>
                                                </div>
                                                <CardDescription className="flex items-center gap-1 mt-1">
                                                    <MapPin className="h-3 w-3" /> {submission.location.address}
                                                </CardDescription>
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(submission.personal.submittedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-sm">{submission.basicInfo.description}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {submission.basicInfo.tags.map(tag => (
                                                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                                    ))}
                                                </div>
                                                {submission.personal.tip && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm mt-2">
                                                        <strong>💡 Tip:</strong> {submission.personal.tip}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-medium">User Rating:</span>
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-4 w-4 ${i < submission.details.userRating ? 'fill-current' : 'text-gray-300'}`} />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 justify-end mt-4">
                                                    <Button variant="destructive" size="sm" onClick={() => handleReject(submission.id)}>
                                                        <XCircle className="h-4 w-4 mr-1" /> Reject
                                                    </Button>
                                                    <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => handleApprove(submission.id)}>
                                                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <div className="text-center py-8 text-muted-foreground">
                        History view coming soon...
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
