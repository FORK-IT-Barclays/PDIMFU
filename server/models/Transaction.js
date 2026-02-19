import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    txId: { type: String, required: true, unique: true },
    loanAccountId: { type: String, required: true },
    customerName: { type: String },
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT', 'EMI', 'BOUNCE', 'REVERSAL', 'SETTLEMENT'],
        required: true,
    },
    channel: {
        type: String,
        enum: ['UPI', 'NEFT', 'RTGS', 'IMPS', 'AUTO_DEBIT', 'BRANCH', 'ATM'],
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
        type: String,
        enum: ['SUCCESS', 'PENDING', 'FAILED', 'BOUNCED'],
        default: 'SUCCESS',
    },
    merchant: { type: String },
    risk: { type: Number, min: 0, max: 1 },
    tier: { type: String },
    batchId: { type: String },
    timestamp: { type: Date, default: Date.now },
}, {
    timestamps: true,
    collection: 'transactions',
});

transactionSchema.index({ loanAccountId: 1 });
transactionSchema.index({ timestamp: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
