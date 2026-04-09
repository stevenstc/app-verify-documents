import express from 'express';
import multer from 'multer';
import {
    uploadDocument,
    storeInBlockchain,
    verifyDocument,
    getUserDocuments,
    verifyUploadedFile
} from '../controllers/documentController.js';

const router = express.Router();

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB límite
    }
});

// Rutas
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/:documentId/store-blockchain', storeInBlockchain);
router.get('/verify/:hash', verifyDocument);
router.get('/user/:walletAddress', getUserDocuments);
router.post('/verify-file', upload.single('file'), verifyUploadedFile);

export default router;
