
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    tripId: mongoose.Types.ObjectId;
    payerId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    note: string;
    splitWith: mongoose.Types.ObjectId[]; // Users who share this cost
    date: Date;
}

const ExpenseSchema = new Schema<IExpense>({
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    payerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    note: { type: String, required: true },
    splitWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    date: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Expense: Model<IExpense> = mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
