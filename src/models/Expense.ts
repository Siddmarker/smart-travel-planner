import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    tripId: mongoose.Types.ObjectId;
    description: string;
    amount: number;
    currency: string;
    category: string;
    date: Date;
    paidBy: {
        userId: mongoose.Types.ObjectId;
        name: string;
        email?: string;
    };
    splitMethod: 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';
    participants: {
        userId: mongoose.Types.ObjectId;
        name?: string;
        amountOwed: number;
        splitDetails?: any;
        status: 'pending' | 'paid';
    }[];
    calculations?: any;
    status: 'active' | 'settled' | 'cancelled';
    metadata: any;
}

const ExpenseSchema = new Schema<IExpense>({
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'INR' },
    category: { type: String, default: 'other' },
    date: { type: Date, default: Date.now, required: true },
    paidBy: {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: String,
        email: String
    },
    splitMethod: {
        type: String,
        enum: ['equal', 'percentage', 'shares', 'exact', 'itemized'],
        default: 'equal'
    },
    participants: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        name: String,
        amountOwed: { type: Number, default: 0 },
        splitDetails: Schema.Types.Mixed,
        status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
    }],
    calculations: Schema.Types.Mixed,
    status: { type: String, enum: ['active', 'settled', 'cancelled'], default: 'active' },
    metadata: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
}, {
    timestamps: true
});

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
