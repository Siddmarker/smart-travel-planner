'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Trip, ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

interface ChatProps {
    trip: Trip;
}

export function Chat({ trip }: ChatProps) {
    const { updateTrip, currentUser } = useStore();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [trip.messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const message: ChatMessage = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        updateTrip(trip.id, {
            messages: [...(trip.messages || []), message]
        });

        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {trip.messages?.map((msg) => {
                    const isMe = msg.userId === currentUser?.id;
                    const user = trip.participants.find(p => p.userId === msg.userId);

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage />
                                    <AvatarFallback>{user?.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className={`p-3 rounded-lg ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                                        }`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                    <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                        {user?.name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
                {(!trip.messages || trip.messages.length === 0) && (
                    <div className="text-center text-muted-foreground text-sm py-10">
                        Start the conversation!
                    </div>
                )}
            </div>
            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
