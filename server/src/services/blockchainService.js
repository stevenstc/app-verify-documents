import { ethers } from 'ethers';

class BlockchainService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.wallet = null;
        this.serviceWallet = null;
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

            // Cuenta que recibe los pagos de suscripción (default: wallet del servidor)
            this.serviceWallet = process.env.BTTC_SERVICE_WALLET || this.wallet?.address || null;

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
     * Verifica un pago de suscripción directamente en la blockchain.
     * Valida: formato del hash, existencia, confirmación, emisor, receptor y monto.
     * @param {string} transactionHash - Hash de la transacción de pago reportada
     * @param {number} requiredAmountBTT - Monto mínimo exigido según Settings
     * @param {string} payerAddress - Wallet que debe haber enviado el pago
     * @returns {Promise<object>} { valid, reason?, from?, to?, amountBTT?, blockNumber?, blockTimestamp? }
     */
    async verifySubscriptionPayment(transactionHash, requiredAmountBTT, payerAddress) {
        if (!this.provider) {
            throw new Error('Provider no inicializado');
        }

        if (!this.serviceWallet) {
            throw new Error('Cuenta de cobro no configurada (BTTC_SERVICE_WALLET o BTTC_PRIVATE_KEY)');
        }

        if (typeof transactionHash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(transactionHash.trim())) {
            return { valid: false, reason: 'El hash de transacción no tiene un formato válido' };
        }

        const hash = transactionHash.trim();
        const tx = await this.provider.getTransaction(hash).catch(() => null);

        if (!tx) {
            return { valid: false, reason: 'La transacción no existe en la blockchain' };
        }

        const receipt = await this.provider.getTransactionReceipt(hash).catch(() => null);

        if (!receipt) {
            return { valid: false, reason: 'La transacción aún no está confirmada en la blockchain' };
        }

        if (receipt.status !== 1) {
            return { valid: false, reason: 'La transacción fue revertida (fallida) en la blockchain' };
        }

        if (payerAddress && tx.from?.toLowerCase() !== payerAddress.toLowerCase()) {
            return { valid: false, reason: 'El pago no fue enviado desde la wallet del usuario' };
        }

        if (!tx.to || tx.to.toLowerCase() !== this.serviceWallet.toLowerCase()) {
            return { valid: false, reason: 'El pago no fue enviado a la cuenta de cobro autorizada' };
        }

        const requiredWei = ethers.parseEther(String(requiredAmountBTT));

        if (tx.value < requiredWei) {
            const paidBTT = ethers.formatEther(tx.value);
            return {
                valid: false,
                reason: `Monto insuficiente en blockchain: ${paidBTT} BTT pagados, se requieren ${requiredAmountBTT} BTT`
            };
        }

        let blockTimestamp = null;
        if (receipt.blockNumber) {
            const block = await this.provider.getBlock(receipt.blockNumber).catch(() => null);
            blockTimestamp = block ? new Date(block.timestamp * 1000) : null;
        }

        return {
            valid: true,
            transactionHash: hash,
            from: tx.from.toLowerCase(),
            to: tx.to.toLowerCase(),
            amountBTT: Number(ethers.formatEther(tx.value)),
            blockNumber: receipt.blockNumber,
            blockTimestamp
        };
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
