
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface ExpensePanelProps {
    tripId: string;
}

interface Expense {
    _id: string;
    payerId: { name: string };
    amount: number;
    note: string;
    date: string;
}

export function ExpensePanel({ tripId }: ExpensePanelProps) {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`/api/expenses?tripId=${tripId}`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data.expenses);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (tripId) fetchExpenses();
    }, [tripId]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !note || loading) return;

        setLoading(true);
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tripId,
                    amount: parseFloat(amount),
                    note,
                    currency: 'USD' // Default for now
                })
            });

            if (res.ok) {
                toast({ title: "Expense added!" });
                setAmount('');
                setNote('');
                fetchExpenses();
            } else {
                toast({ title: "Failed to add", variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full h-[500px]">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Bill Splitter</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {expenses.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No expenses recorded yet.</p>
                ) : (
                    expenses.map((exp) => (
                        <div key={exp._id} className="flex justify-between items-center text-sm border-b pb-2">
                            <div>
                                <p className="font-medium">{exp.note}</p>
                                <p className="text-xs text-gray-500">Paid by {exp.payerId?.name}</p>
                            </div>
                            <span className="font-bold text-green-600">${exp.amount.toFixed(2)}</span>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleAddExpense} className="p-4 border-t bg-gray-50 space-y-2">
                <Input
                    type="number"
                    placeholder="Amount ($)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                />
                <Input
                    type="text"
                    placeholder="What for? (e.g. Dinner)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Expense'}
                </Button>
            </form>
        </div>
    );
}
