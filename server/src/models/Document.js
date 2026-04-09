import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true,
        lowercase: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileHash: {
        type: String,
        required: true,
        unique: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    blockchainTxHash: {
        type: String
    },
    blockchainTimestamp: {
        type: Date
    },
    blockNumber: {
        type: Number
    },
    verified: {
        type: Boolean,
        default: false
    },
    storedInBlockchain: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Map,
        of: String
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

// Índices para búsqueda rápida
documentSchema.index({ owner: 1, createdAt: -1 });
documentSchema.index({ fileHash: 1 });

// Actualizar fecha de modificación
documentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
