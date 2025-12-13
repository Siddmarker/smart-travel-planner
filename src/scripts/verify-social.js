
const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-travel';

// Schema defs for verification (mirroring TS models)
const ExpenseSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
    payerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    amount: Number,
    note: String,
    splitWith: [mongoose.Schema.Types.ObjectId]
});

const MessageSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    content: String,
    type: String
});

const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

async function verifySocialFeatures() {
    console.log('Verifying Social Features...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const mockTripId = new mongoose.Types.ObjectId();
        const mockUserId = new mongoose.Types.ObjectId();

        // 1. Verify Expense Creation
        console.log('Testing Expense creation...');
        const expense = await Expense.create({
            tripId: mockTripId,
            payerId: mockUserId,
            amount: 50.00,
            note: 'Dinner at Taco Bell',
            splitWith: [new mongoose.Types.ObjectId()]
        });
        console.log('Expense created:', expense._id);

        // 2. Verify Message Creation
        console.log('Testing Chat Message creation...');
        const message = await Message.create({
            tripId: mockTripId,
            userId: mockUserId,
            content: 'Guys, I paid for dinner!',
            type: 'text'
        });
        console.log('Message created:', message._id);

        // 3. Verify Retrieval
        const foundExp = await Expense.findById(expense._id);
        const foundMsg = await Message.findById(message._id);

        if (foundExp.amount === 50 && foundMsg.content === 'Guys, I paid for dinner!') {
            console.log('SUCCESS: Social features data path verified.');
        } else {
            console.error('FAILURE: Data mismatch in social features.');
        }

        // Cleanup
        await Expense.deleteOne({ _id: expense._id });
        await Message.deleteOne({ _id: message._id });
        console.log('Cleanup complete');

    } catch (error) {
        console.error('Verification Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifySocialFeatures();
