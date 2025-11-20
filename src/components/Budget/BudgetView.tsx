'use client';

import { useState } from 'react';
import { Trip } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, PieChart } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface BudgetViewProps {
    trip: Trip;
}

export function BudgetView({ trip }: BudgetViewProps) {
    const { updateTrip } = useStore();
    const [showAddExpense, setShowAddExpense] = useState(false);

    const percentage = Math.min((trip.budget.spent / trip.budget.total) * 100, 100);
    const remaining = trip.budget.total - trip.budget.spent;

    return (
        <div className="h-full flex flex-col gap-6 p-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Budget Tracker</h2>
                <Button onClick={() => setShowAddExpense(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {trip.budget.currency} {trip.budget.total.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {trip.budget.currency} {trip.budget.spent.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {trip.budget.currency} {remaining.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Budget Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No expenses recorded yet.</p>
                </div>
            </div>
        </div>
    );
}
