import { ethers } from 'ethers';

class BlockchainService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.wallet = null;
    }

    /**
     * Inicializa la conexión con BTTChain
     */
    async initialize() {
        try {
            // Conectar al RPC de BTTChain
            this.provider = new ethers.JsonRpcProvider(process.env.BTTC_RPC_URL);

            // Crear wallet desde private key
            if (process.env.BTTC_PRIVATE_KEY) {
                this.wallet = new ethers.Wallet(process.env.BTTC_PRIVATE_KEY, this.provider);
            }

            // Cargar el contrato
            if (process.env.BTTC_CONTRACT_ADDRESS) {
                const contractABI = [
                    "function storeDocumentHash(bytes32 documentHash, string memory metadata) public returns (uint256)",
                    "function verifyDocument(bytes32 documentHash) public view returns (bool, uint256, address)",
                    "function getDocumentInfo(bytes32 documentHash) public view returns (uint256, address, string memory)",
                    "event DocumentStored(bytes32 indexed documentHash, address indexed owner, uint256 timestamp)"
                ];

                this.contract = new ethers.Contract(
                    process.env.BTTC_CONTRACT_ADDRESS,
                    contractABI,
                    this.wallet || this.provider
                );
            }

            console.log('Servicio blockchain inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando servicio blockchain:', error);
        }
    }

    /**
     * Almacena un hash de documento en la blockchain
     * @param {string} documentHash - Hash SHA256 del documento
     * @param {string} metadata - Metadata adicional (JSON string)
     * @returns {Promise<object>} Información de la transacción
     */
    async storeDocumentHash(documentHash, metadata = '') {
        try {
            if (!this.contract || !this.wallet) {
                throw new Error('Contrato o wallet no inicializado');
            }

            // Convertir hash a bytes32
            const hashBytes32 = '0x' + documentHash;

            // Enviar transacción
            const tx = await this.contract.storeDocumentHash(hashBytes32, metadata);

            // Esperar confirmación
            const receipt = await tx.wait();

            return {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                status: receipt.status === 1 ? 'success' : 'failed'
            };
        } catch (error) {
            console.error('Error almacenando hash en blockchain:', error);
            throw error;
        }
    }

    /**
     * Verifica un documento en la blockchain
     * @param {string} documentHash - Hash SHA256 del documento
     * @returns {Promise<object>} Información de verificación
     */
    async verifyDocument(documentHash) {
        try {
            if (!this.contract) {
                throw new Error('Contrato no inicializado');
            }

            const hashBytes32 = '0x' + documentHash;
            const [exists, timestamp, owner] = await this.contract.verifyDocument(hashBytes32);

            return {
                exists: exists,
                timestamp: timestamp ? new Date(Number(timestamp) * 1000) : null,
                owner: owner
            };
        } catch (error) {
            console.error('Error verificando documento:', error);
            throw error;
        }
    }

    /**
     * Obtiene información detallada de un documento
     * @param {string} documentHash - Hash SHA256 del documento
     * @returns {Promise<object>} Información del documento
     */
    async getDocumentInfo(documentHash) {
        try {
            if (!this.contract) {
                throw new Error('Contrato no inicializado');
            }

            const hashBytes32 = '0x' + documentHash;
            const [timestamp, owner, metadata] = await this.contract.getDocumentInfo(hashBytes32);

            return {
                timestamp: timestamp ? new Date(Number(timestamp) * 1000) : null,
                owner: owner,
                metadata: metadata
            };
        } catch (error) {
            console.error('Error obteniendo info del documento:', error);
            throw error;
        }
    }

    /**
     * Obtiene el balance de BTT de una dirección
     * @param {string} address - Dirección de wallet
     * @returns {Promise<string>} Balance en BTT
     */
    async getBalance(address) {
        try {
            if (!this.provider) {
                throw new Error('Provider no inicializado');
            }

            const balance = await this.provider.getBalance(address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error('Error obteniendo balance:', error);
            throw error;
        }
    }
}

// Exportar instancia singleton
const blockchainService = new BlockchainService();
export default blockchainService;
