import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true,
        index: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true,
        index: true
    },
    concept: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: [
            'subscription',
            'document_certification',
            'infrastructure',
            'marketing',
            'gas_fees',
            'refund',
            'other'
        ],
        default: 'other'
    },
    amountBTT: {
        type: Number,
        required: true,
        min: 0
    },
    transactionHash: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed'],
        default: 'confirmed'
    },
    relatedDocument: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: String,
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ walletAddress: 1, createdAt: -1 });
transactionSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });

transactionSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
