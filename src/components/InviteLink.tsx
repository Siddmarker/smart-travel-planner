'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Copy, Check } from 'lucide-react';
import { Trip } from '@/types';

interface InviteLinkProps {
    trip: Trip;
}

export function InviteLink({ trip }: InviteLinkProps) {
    const [copied, setCopied] = useState(false);
    const [open, setOpen] = useState(false);

    // Generate invite link (in production, this would be a real shareable link)
    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/trips/join/${trip.id}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite people to {trip.name}</DialogTitle>
                    <DialogDescription>
                        Share this link with others to invite them to join your trip.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-2">
                        <Input
                            readOnly
                            value={inviteLink}
                            className="font-mono text-sm"
                        />
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        className="px-3"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg mt-2">
                    <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Anyone with this link can join your trip and view all trip details.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
