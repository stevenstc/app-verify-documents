import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import blockchainService from './services/blockchainService.js';
import documentRoutes from './routes/documentRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'API de Verificación de Documentos con BTTChain',
        version: '1.0.0',
        endpoints: {
            documents: '/api/documents',
            users: '/api/users'
        }
    });
});

// Ruta de healthcheck
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Algo salió mal!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Inicializar servidor
const startServer = async () => {
    try {
        // Conectar a MongoDB
        await connectDB();

        // Inicializar servicio blockchain
        await blockchainService.initialize();

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en puerto ${PORT}`);
            console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Error iniciando servidor:', error);
        process.exit(1);
    }
};

startServer();
