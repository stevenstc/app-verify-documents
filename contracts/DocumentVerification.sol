// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DocumentVerification
 * @dev Smart Contract para almacenar y verificar hashes de documentos en BTTChain
 */
contract DocumentVerification {
    struct Document {
        bytes32 documentHash;
        address owner;
        uint256 timestamp;
        string metadata;
        bool exists;
    }

    // Mapeo de hash de documento a información del documento
    mapping(bytes32 => Document) private documents;

    // Mapeo de dirección a sus documentos
    mapping(address => bytes32[]) private userDocuments;

    // Eventos
    event DocumentStored(
        bytes32 indexed documentHash,
        address indexed owner,
        uint256 timestamp,
        string metadata
    );

    event DocumentVerified(
        bytes32 indexed documentHash,
        address indexed verifier,
        uint256 timestamp
    );

    /**
     * @dev Almacena el hash de un documento en la blockchain
     * @param documentHash Hash SHA-256 del documento
     * @param metadata Metadata adicional (JSON string)
     * @return timestamp Timestamp de cuando se almacenó el documento
     */
    function storeDocumentHash(
        bytes32 documentHash,
        string memory metadata
    ) public returns (uint256) {
        require(
            !documents[documentHash].exists,
            "Este documento ya esta registrado"
        );

        documents[documentHash] = Document({
            documentHash: documentHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            metadata: metadata,
            exists: true
        });

        userDocuments[msg.sender].push(documentHash);

        emit DocumentStored(
            documentHash,
            msg.sender,
            block.timestamp,
            metadata
        );

        return block.timestamp;
    }

    /**
     * @dev Verifica si un documento existe en la blockchain
     * @param documentHash Hash SHA-256 del documento
     * @return exists True si el documento existe
     * @return timestamp Timestamp de registro
     * @return owner Dirección del propietario
     */
    function verifyDocument(
        bytes32 documentHash
    ) public view returns (bool exists, uint256 timestamp, address owner) {
        Document memory doc = documents[documentHash];
        return (doc.exists, doc.timestamp, doc.owner);
    }

    /**
     * @dev Obtiene información completa de un documento
     * @param documentHash Hash SHA-256 del documento
     * @return timestamp Timestamp de registro
     * @return owner Dirección del propietario
     * @return metadata Metadata del documento
     */
    function getDocumentInfo(
        bytes32 documentHash
    )
        public
        view
        returns (uint256 timestamp, address owner, string memory metadata)
    {
        require(documents[documentHash].exists, "Documento no encontrado");

        Document memory doc = documents[documentHash];
        return (doc.timestamp, doc.owner, doc.metadata);
    }

    /**
     * @dev Obtiene todos los documentos de un usuario
     * @param userAddress Dirección del usuario
     * @return Array de hashes de documentos
     */
    function getUserDocuments(
        address userAddress
    ) public view returns (bytes32[] memory) {
        return userDocuments[userAddress];
    }

    /**
     * @dev Obtiene el número de documentos de un usuario
     * @param userAddress Dirección del usuario
     * @return Cantidad de documentos
     */
    function getUserDocumentCount(
        address userAddress
    ) public view returns (uint256) {
        return userDocuments[userAddress].length;
    }
}
