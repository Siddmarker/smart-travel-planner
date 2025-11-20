'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Poll, Trip } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PollsProps {
    trip: Trip;
}

export function Polls({ trip }: PollsProps) {
    const { updateTrip, currentUser } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newOptions, setNewOptions] = useState(['', '']);

    const handleCreatePoll = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || newOptions.some(o => !o.trim())) return;

        const newPoll: Poll = {
            id: crypto.randomUUID(),
            question: newQuestion,
            options: newOptions.map(text => ({
                id: crypto.randomUUID(),
                text,
                votes: []
            })),
            createdBy: currentUser?.id || 'unknown',
            createdAt: new Date().toISOString()
        };

        updateTrip(trip.id, {
            polls: [...(trip.polls || []), newPoll]
        });

        setIsCreating(false);
        setNewQuestion('');
        setNewOptions(['', '']);
    };

    const handleVote = (pollId: string, optionId: string) => {
        if (!currentUser) return;

        const updatedPolls = trip.polls?.map(poll => {
            if (poll.id !== pollId) return poll;

            return {
                ...poll,
                options: poll.options.map(option => {
                    const hasVoted = option.votes.includes(currentUser.id);
                    if (option.id === optionId) {
                        // Toggle vote
                        return {
                            ...option,
                            votes: hasVoted
                                ? option.votes.filter(id => id !== currentUser.id)
                                : [...option.votes, currentUser.id]
                        };
                    }
                    // Remove vote from other options if single choice (optional logic, keeping multi-choice for now)
                    return option;
                })
            };
        });

        updateTrip(trip.id, { polls: updatedPolls });
    };

    const handleDeletePoll = (pollId: string) => {
        const updatedPolls = trip.polls?.filter(p => p.id !== pollId);
        updateTrip(trip.id, { polls: updatedPolls });
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Group Polls</h2>
                <Button onClick={() => setIsCreating(!isCreating)} size="sm">
                    {isCreating ? 'Cancel' : 'Create Poll'}
                </Button>
            </div>

            {isCreating && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">New Poll</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreatePoll} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Question</label>
                                <Input
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    placeholder="e.g., Where should we have dinner?"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Options</label>
                                {newOptions.map((option, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={option}
                                            onChange={(e) => {
                                                const newOpts = [...newOptions];
                                                newOpts[index] = e.target.value;
                                                setNewOptions(newOpts);
                                            }}
                                            placeholder={`Option ${index + 1}`}
                                            required
                                        />
                                        {newOptions.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setNewOptions(newOptions.filter((_, i) => i !== index))}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setNewOptions([...newOptions, ''])}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Option
                                </Button>
                            </div>
                            <Button type="submit" className="w-full">Create Poll</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-4">
                {trip.polls?.map((poll) => (
                    <Card key={poll.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-medium">{poll.question}</CardTitle>
                                {poll.createdBy === currentUser?.id && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleDeletePoll(poll.id)}
                                    >
                                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Created by {trip.participants.find(p => p.id === poll.createdBy)?.name || 'Unknown'}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {poll.options.map((option) => {
                                const voteCount = option.votes.length;
                                const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes.length, 0);
                                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                                const hasVoted = option.votes.includes(currentUser?.id || '');

                                return (
                                    <div
                                        key={option.id}
                                        className={`relative p-3 rounded-lg border cursor-pointer transition-colors ${hasVoted ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleVote(poll.id, option.id)}
                                    >
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-blue-100 rounded-lg transition-all duration-500"
                                            style={{ width: `${percentage}%`, opacity: 0.3 }}
                                        />
                                        <div className="relative flex justify-between items-center z-10">
                                            <div className="flex items-center gap-2">
                                                {hasVoted && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                                                <span className="font-medium text-sm">{option.text}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-1">
                                                    {option.votes.slice(0, 3).map(userId => {
                                                        const user = trip.participants.find(p => p.id === userId);
                                                        return user ? (
                                                            <Avatar key={userId} className="h-5 w-5 border border-white">
                                                                <AvatarImage src={user.avatar} />
                                                                <AvatarFallback className="text-[8px]">{user.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                        ) : null;
                                                    })}
                                                    {option.votes.length > 3 && (
                                                        <div className="h-5 w-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[8px] text-gray-500">
                                                            +{option.votes.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground">{voteCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
                {(!trip.polls || trip.polls.length === 0) && !isCreating && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No polls yet. Create one to start deciding!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
