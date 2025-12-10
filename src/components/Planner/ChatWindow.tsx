import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';

interface Message {
    _id: string;
    senderName: string;
    senderId: string;
    content: { text: string };
    createdAt: string; // or Date in DB
}

export function ChatWindow({ tripId }: { tripId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Polling for messages (simple MVP replacement for Socket.IO)
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [tripId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/trips/${tripId}/chat`);
            const data = await res.json();
            if (data.success) {
                // Check if new messages arrived to avoid unnecessary re-renders or logic
                setMessages(data.messages);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`/api/trips/${tripId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newMessage })
            });
            const data = await res.json();
            if (data.success) {
                setMessages([...messages, data.message]);
                setNewMessage('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader>
                <CardTitle>Trip Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex flex-col ${msg.senderName === 'Test User' ? 'items-end' : 'items-start'}`}
                        >
                            <span className="text-xs text-muted-foreground mb-1">
                                {msg.senderName}
                            </span>
                            <div
                                className={`rounded-lg p-3 max-w-[80%] ${msg.senderName === 'Test User'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                            >
                                {msg.content.text}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <Button type="submit" size="icon">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
