import mongoose from 'mongoose';
import { MONGODB_URI } from './env.js';

const connectDB = async () => {
    try {
        console.log("hola coso")
        console.log(MONGODB_URI)

        const conn = await mongoose.connect(MONGODB_URI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error de conexión MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
