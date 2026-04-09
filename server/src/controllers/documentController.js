import Document from '../models/Document.js';
import User from '../models/User.js';
import { calculateBufferHash } from '../utils/hashUtils.js';
import blockchainService from '../services/blockchainService.js';

/**
 * Sube un documento y calcula su hash
 */
export const uploadDocument = async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }

        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address es requerida' });
        }

        // Obtener o crear usuario
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (!user) {
            user = new User({
                walletAddress: walletAddress.toLowerCase()
            });
            await user.save();
        }

        // Verificar si el usuario tiene suscripción activa
        const hasActiveSubscription = user.subscription.isActive &&
            user.subscription.endDate &&
            new Date(user.subscription.endDate) > new Date();

        // Si no tiene suscripción activa, verificar el límite de documentos gratuitos
        if (!hasActiveSubscription) {
            const userDocCount = await Document.countDocuments({
                owner: walletAddress.toLowerCase()
            });

            if (userDocCount >= user.freeDocumentsLimit) {
                return res.status(403).json({
                    error: 'Has alcanzado el límite de documentos gratuitos',
                    message: 'Suscríbete para certificar documentos ilimitados',
                    needsSubscription: true,
                    freeDocumentsUsed: userDocCount,
                    freeDocumentsLimit: user.freeDocumentsLimit
                });
            }
        }

        // Calcular hash del archivo
        const fileHash = calculateBufferHash(file.buffer);

        // Verificar si el documento ya existe
        const existingDoc = await Document.findOne({ fileHash });
        if (existingDoc) {
            return res.status(409).json({
                error: 'Este documento ya fue registrado',
                document: existingDoc
            });
        }

        // Crear registro del documento
        const document = new Document({
            owner: walletAddress.toLowerCase(),
            fileName: file.originalname,
            fileHash: fileHash,
            fileSize: file.size,
            fileType: file.mimetype,
            description: req.body.description || ''
        });

        await document.save();

        // Actualizar contador de documentos gratuitos si no tiene suscripción
        if (!hasActiveSubscription) {
            user.freeDocumentsUsed = (user.freeDocumentsUsed || 0) + 1;
            await user.save();
        }

        res.status(201).json({
            message: 'Documento procesado exitosamente',
            document: {
                id: document._id,
                fileName: document.fileName,
                fileHash: document.fileHash,
                fileSize: document.fileSize,
                fileType: document.fileType,
                createdAt: document.createdAt
            },
            userLimits: hasActiveSubscription ? {
                unlimited: true
            } : {
                freeDocumentsUsed: user.freeDocumentsUsed,
                freeDocumentsLimit: user.freeDocumentsLimit,
                remaining: user.freeDocumentsLimit - user.freeDocumentsUsed
            }
        });
    } catch (error) {
        console.error('Error subiendo documento:', error);
        res.status(500).json({ error: 'Error procesando el documento' });
    }
};

/**
 * Almacena el hash del documento en la blockchain
 */
export const storeInBlockchain = async (req, res) => {
    try {
        const { documentId } = req.params;
        const { walletAddress } = req.body;

        const document = await Document.findById(documentId);

        if (!document) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        if (document.owner !== walletAddress.toLowerCase()) {
            return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
        }

        if (document.storedInBlockchain) {
            return res.status(400).json({
                error: 'Este documento ya está almacenado en la blockchain',
                transactionHash: document.blockchainTxHash
            });
        }

        // Almacenar en blockchain
        const metadata = JSON.stringify({
            fileName: document.fileName,
            fileType: document.fileType,
            timestamp: new Date().toISOString()
        });

        const txInfo = await blockchainService.storeDocumentHash(
            document.fileHash,
            metadata
        );

        // Actualizar documento
        document.blockchainTxHash = txInfo.transactionHash;
        document.blockNumber = txInfo.blockNumber;
        document.blockchainTimestamp = new Date();
        document.storedInBlockchain = true;
        document.verified = true;

        await document.save();

        res.json({
            message: 'Documento almacenado en blockchain exitosamente',
            transactionHash: txInfo.transactionHash,
            blockNumber: txInfo.blockNumber
        });
    } catch (error) {
        console.error('Error almacenando en blockchain:', error);
        res.status(500).json({ error: 'Error almacenando en blockchain: ' + error.message });
    }
};

/**
 * Verifica un documento por su hash
 */
export const verifyDocument = async (req, res) => {
    try {
        const { hash } = req.params;

        // Buscar en base de datos
        const document = await Document.findOne({ fileHash: hash });

        if (!document) {
            return res.status(404).json({
                verified: false,
                message: 'Documento no encontrado en la base de datos'
            });
        }

        // Verificar en blockchain si está almacenado
        let blockchainInfo = null;
        if (document.storedInBlockchain) {
            try {
                blockchainInfo = await blockchainService.verifyDocument(hash);
            } catch (error) {
                console.error('Error verificando en blockchain:', error);
            }
        }

        res.json({
            verified: true,
            document: {
                fileName: document.fileName,
                fileHash: document.fileHash,
                owner: document.owner,
                createdAt: document.createdAt,
                storedInBlockchain: document.storedInBlockchain,
                blockchainTxHash: document.blockchainTxHash,
                blockNumber: document.blockNumber
            },
            blockchain: blockchainInfo
        });
    } catch (error) {
        console.error('Error verificando documento:', error);
        res.status(500).json({ error: 'Error verificando el documento' });
    }
};

/**
 * Obtiene todos los documentos de un usuario
 */
export const getUserDocuments = async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const documents = await Document.find({
            owner: walletAddress.toLowerCase()
        }).sort({ createdAt: -1 });

        res.json({
            count: documents.length,
            documents: documents.map(doc => ({
                id: doc._id,
                fileName: doc.fileName,
                fileHash: doc.fileHash,
                fileSize: doc.fileSize,
                fileType: doc.fileType,
                description: doc.description,
                verified: doc.verified,
                storedInBlockchain: doc.storedInBlockchain,
                blockchainTxHash: doc.blockchainTxHash,
                createdAt: doc.createdAt
            }))
        });
    } catch (error) {
        console.error('Error obteniendo documentos:', error);
        res.status(500).json({ error: 'Error obteniendo los documentos' });
    }
};

/**
 * Verifica un archivo subido contra el hash almacenado
 */
export const verifyUploadedFile = async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }

        // Calcular hash del archivo subido
        const fileHash = calculateBufferHash(file.buffer);

        // Buscar documento con ese hash
        const document = await Document.findOne({ fileHash });

        if (!document) {
            return res.json({
                verified: false,
                message: 'Este archivo no está registrado en el sistema'
            });
        }

        // Verificar en blockchain si está disponible
        let blockchainInfo = null;
        if (document.storedInBlockchain) {
            try {
                blockchainInfo = await blockchainService.verifyDocument(fileHash);
            } catch (error) {
                console.error('Error verificando en blockchain:', error);
            }
        }

        res.json({
            verified: true,
            message: 'Archivo verificado exitosamente',
            document: {
                fileName: document.fileName,
                fileHash: document.fileHash,
                owner: document.owner,
                createdAt: document.createdAt,
                storedInBlockchain: document.storedInBlockchain,
                blockchainTxHash: document.blockchainTxHash
            },
            blockchain: blockchainInfo
        });
    } catch (error) {
        console.error('Error verificando archivo:', error);
        res.status(500).json({ error: 'Error verificando el archivo' });
    }
};
