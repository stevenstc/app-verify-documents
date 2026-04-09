import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 debe ser usado dentro de Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // BTTChain Mainnet Chain ID: 199
    // BTTChain Donau Testnet: 1029
    const BTTC_CHAIN_ID = '0xc7'; // 199 en hexadecimal
    const BTTC_TESTNET_CHAIN_ID = '0x405'; // 1029 en hexadecimal

    const BTTC_NETWORK = {
        chainId: BTTC_CHAIN_ID,
        chainName: 'BitTorrent Chain Mainnet',
        nativeCurrency: {
            name: 'BitTorrent',
            symbol: 'BTT',
            decimals: 18
        },
        rpcUrls: ['https://rpc.bt.io'],
        blockExplorerUrls: ['https://bttcscan.com']
    };

    const BTTC_TESTNET = {
        chainId: BTTC_TESTNET_CHAIN_ID,
        chainName: 'BitTorrent Chain Donau',
        nativeCurrency: {
            name: 'BitTorrent',
            symbol: 'BTT',
            decimals: 18
        },
        rpcUrls: ['https://pre-rpc.bt.io/'],
        blockExplorerUrls: ['https://testnet.bttcscan.com']
    };

    // Conectar MetaMask
    const connectWallet = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            if (!window.ethereum) {
                throw new Error('MetaMask no está instalado');
            }

            // Solicitar acceso a las cuentas
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            setProvider(web3Provider);
            setSigner(web3Signer);
            setAccount(accounts[0]);
            setChainId(network.chainId.toString());

            // Verificar si está en BTTChain
            if (network.chainId.toString() !== '199' && network.chainId.toString() !== '1029') {
                await switchToBTTChain();
            }
        } catch (err) {
            console.error('Error conectando wallet:', err);
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Cambiar a BTTChain
    const switchToBTTChain = async (useTestnet = false) => {
        try {
            const network = useTestnet ? BTTC_TESTNET : BTTC_NETWORK;

            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }]
            });
        } catch (switchError) {
            // Si la red no existe, agregarla
            if (switchError.code === 4902) {
                try {
                    const network = useTestnet ? BTTC_TESTNET : BTTC_NETWORK;

                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [network]
                    });
                } catch (addError) {
                    console.error('Error agregando BTTChain:', addError);
                    throw addError;
                }
            } else {
                throw switchError;
            }
        }
    };

    // Desconectar wallet
    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setChainId(null);
    };

    // Obtener balance de BTT
    const getBalance = async () => {
        if (!provider || !account) return '0';

        try {
            const balance = await provider.getBalance(account);
            return ethers.formatEther(balance);
        } catch (err) {
            console.error('Error obteniendo balance:', err);
            return '0';
        }
    };

    // Escuchar cambios en la cuenta
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    disconnectWallet();
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, []);

    const value = {
        account,
        provider,
        signer,
        chainId,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchToBTTChain,
        getBalance,
        isConnected: !!account
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
