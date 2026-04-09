import CryptoJS from 'crypto-js';

/**
 * Calcula el hash SHA256 de un archivo
 * @param {File} file - Archivo a hashear
 * @returns {Promise<string>} Hash SHA256 del archivo
 */
export const calculateFileHash = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const wordArray = CryptoJS.lib.WordArray.create(event.target.result);
                const hash = CryptoJS.SHA256(wordArray).toString();
                resolve(hash);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
};

/**
 * Formatea el hash para mostrar (primeros y últimos caracteres)
 * @param {string} hash - Hash completo
 * @param {number} length - Cantidad de caracteres a mostrar en cada extremo
 * @returns {string} Hash formateado
 */
export const formatHash = (hash, length = 8) => {
    if (!hash) return '';
    if (hash.length <= length * 2) return hash;
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} True si se copió exitosamente
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Error copiando al portapapeles:', err);
        return false;
    }
};
