
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from 'next-auth/react';

interface ChatPanelProps {
    tripId: string;
}

interface Message {
    _id: string;
    userId: { _id: string; name: string; avatar?: string };
    content: string;
    createdAt: string;
}

export function ChatPanel({ tripId }: ChatPanelProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?tripId=${tripId}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Simple polling for MVP
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [tripId]);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollRef.current) {
            const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tripId, content: input, type: 'text' })
            });

            if (res.ok) {
                setInput('');
                fetchMessages(); // Refresh immediately
            }
        } catch (error) {
            console.error('Failed to send', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full h-[500px]">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Group Chat</h3>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.userId?._id === session?.user?.id;
                        return (
                            <div key={msg._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={msg.userId?.avatar} />
                                    <AvatarFallback>{msg.userId?.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    <p>{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <form onSubmit={handleSend} className="p-3 border-t bg-gray-50 flex gap-2">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white"
                />
                <Button type="submit" disabled={sending || !input.trim()}>
                    Send
                </Button>
            </form>
        </div>
    );
}
