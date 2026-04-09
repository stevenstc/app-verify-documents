import crypto from 'crypto';
import fs from 'fs';

/**
 * Calcula el hash SHA256 de un archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} Hash SHA256 del archivo
 */
export const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);

        stream.on('data', (data) => {
            hash.update(data);
        });

        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });

        stream.on('error', (error) => {
            reject(error);
        });
    });
};

/**
 * Calcula el hash SHA256 de un buffer
 * @param {Buffer} buffer - Buffer del archivo
 * @returns {string} Hash SHA256
 */
export const calculateBufferHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Verifica si dos hashes coinciden
 * @param {string} hash1 - Primer hash
 * @param {string} hash2 - Segundo hash
 * @returns {boolean} True si coinciden
 */
export const verifyHash = (hash1, hash2) => {
    return hash1.toLowerCase() === hash2.toLowerCase();
};
