import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    email: {
        type: String,
        sparse: true,
        lowercase: true
    },
    freeDocumentsUsed: {
        type: Number,
        default: 0
    },
    freeDocumentsLimit: {
        type: Number,
        default: 1
    },
    subscription: {
        isActive: {
            type: Boolean,
            default: false
        },
        startDate: Date,
        endDate: Date,
        transactionHash: String,
        amountBTT: Number
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
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

// Actualizar fecha de modificación
userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
