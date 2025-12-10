import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input'; // Assuming standard UI lib structure, might need adjustment if file missing
import { Plus, Trash2, DollarSign } from 'lucide-react';

interface Expense {
    _id: string;
    description: string;
    amount: number;
    paidBy: { name: string; userId: string };
    date: string;
}

export function ExpenseManager({ tripId }: { tripId: string }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
    }, [tripId]);

    const fetchExpenses = async () => {
        try {
            const res = await fetch(`/api/trips/${tripId}/expenses`);
            const data = await res.json();
            if (data.success) setExpenses(data.expenses);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount) return;
        try {
            const res = await fetch(`/api/trips/${tripId}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: newExpense.description,
                    amount: parseFloat(newExpense.amount),
                    date: new Date()
                })
            });
            const data = await res.json();
            if (data.success) {
                setExpenses([data.expense, ...expenses]);
                setNewExpense({ description: '', amount: '' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Trip Budget</h2>
                <div className="text-xl font-bold text-green-600">
                    Total: ${total.toFixed(2)}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Add Expense</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Description"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                        <div className="relative">
                            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                type="number"
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleAddExpense}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {expenses.map((expense) => (
                    <Card key={expense._id}>
                        <CardContent className="flex justify-between items-center p-4">
                            <div>
                                <p className="font-semibold">{expense.description}</p>
                                <p className="text-sm text-muted-foreground">
                                    Paid by {expense.paidBy.name} • {new Date(expense.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">${expense.amount.toFixed(2)}</span>
                                <Button variant="ghost" size="icon" className="text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
