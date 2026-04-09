import { useState } from 'react';
import { FileCheck, Upload, CheckCircle, XCircle, Search } from 'lucide-react';
import { verifyDocumentByHash, verifyUploadedFile } from '../services/api';
import { calculateFileHash, formatHash } from '../utils/hashUtils';

const VerifyPage = () => {
    const [verifyMode, setVerifyMode] = useState('file'); // 'file' or 'hash'
    const [file, setFile] = useState(null);
    const [hash, setHash] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
            setError('');
        }
    };

    const handleVerifyFile = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo');
            return;
        }

        try {
            setVerifying(true);
            setError('');
            setResult(null);

            const formData = new FormData();
            formData.append('file', file);

            const response = await verifyUploadedFile(formData);
            setResult(response);

        } catch (err) {
            console.error('Error verificando archivo:', err);
            setError('Error al verificar el archivo');
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyHash = async () => {
        if (!hash || hash.length !== 64) {
            setError('Por favor ingresa un hash SHA-256 válido (64 caracteres)');
            return;
        }

        try {
            setVerifying(true);
            setError('');
            setResult(null);

            const response = await verifyDocumentByHash(hash);
            setResult(response);

        } catch (err) {
            console.error('Error verificando hash:', err);

            if (err.response?.status === 404) {
                setResult({ verified: false, message: 'Documento no encontrado' });
            } else {
                setError('Error al verificar el hash');
            }
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="verify-page">
            <div className="container">
                <div className="verify-header">
                    <FileCheck size={60} color="#2563eb" />
                    <h1>Verificar Documento</h1>
                    <p>Verifica la autenticidad de un documento registrado en la blockchain</p>
                </div>

                {/* Mode Selector */}
                <div className="mode-selector">
                    <button
                        className={`mode-btn ${verifyMode === 'file' ? 'active' : ''}`}
                        onClick={() => {
                            setVerifyMode('file');
                            setResult(null);
                            setError('');
                        }}
                    >
                        <Upload size={20} />
                        Verificar por Archivo
                    </button>
                    <button
                        className={`mode-btn ${verifyMode === 'hash' ? 'active' : ''}`}
                        onClick={() => {
                            setVerifyMode('hash');
                            setResult(null);
                            setError('');
                        }}
                    >
                        <Search size={20} />
                        Verificar por Hash
                    </button>
                </div>

                {/* Verify by File */}
                {verifyMode === 'file' && (
                    <div className="verify-card card">
                        <h2>Subir Archivo para Verificar</h2>
                        <p className="card-description">
                            Sube el archivo que deseas verificar. El sistema calculará su hash SHA-256
                            y buscará coincidencias en la blockchain.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Seleccionar Archivo</label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="form-input"
                            />
                            {file && (
                                <div className="file-info">
                                    <p>Archivo: {file.name}</p>
                                    <p>Tamaño: {(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleVerifyFile}
                            disabled={!file || verifying}
                            className="btn btn-primary"
                        >
                            {verifying ? 'Verificando...' : 'Verificar Archivo'}
                        </button>
                    </div>
                )}

                {/* Verify by Hash */}
                {verifyMode === 'hash' && (
                    <div className="verify-card card">
                        <h2>Buscar por Hash SHA-256</h2>
                        <p className="card-description">
                            Ingresa el hash SHA-256 del documento que deseas verificar.
                        </p>

                        <div className="form-group">
                            <label className="form-label">Hash SHA-256 (64 caracteres)</label>
                            <input
                                type="text"
                                value={hash}
                                onChange={(e) => setHash(e.target.value.toLowerCase())}
                                placeholder="ej: a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a"
                                className="form-input"
                                maxLength="64"
                            />
                            <small className="form-help">
                                {hash.length}/64 caracteres
                            </small>
                        </div>

                        <button
                            onClick={handleVerifyHash}
                            disabled={!hash || hash.length !== 64 || verifying}
                            className="btn btn-primary"
                        >
                            {verifying ? 'Verificando...' : 'Verificar Hash'}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="result-card card">
                        {result.verified ? (
                            <>
                                <div className="result-header success">
                                    <CheckCircle size={60} />
                                    <h2>✓ Documento Verificado</h2>
                                    <p>Este documento está registrado en la blockchain</p>
                                </div>

                                <div className="result-details">
                                    <div className="detail-row">
                                        <strong>Nombre del Archivo:</strong>
                                        <span>{result.document.fileName}</span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>Hash SHA-256:</strong>
                                        <span className="hash-value">{result.document.fileHash}</span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>Propietario:</strong>
                                        <span className="hash-value">{result.document.owner}</span>
                                    </div>

                                    <div className="detail-row">
                                        <strong>Fecha de Registro:</strong>
                                        <span>{new Date(result.document.createdAt).toLocaleString()}</span>
                                    </div>

                                    {result.document.storedInBlockchain && (
                                        <>
                                            <div className="detail-row">
                                                <strong>Estado Blockchain:</strong>
                                                <span className="badge badge-success">En Blockchain</span>
                                            </div>

                                            <div className="detail-row">
                                                <strong>Transaction Hash:</strong>
                                                <a
                                                    href={`https://bttcscan.com/tx/${result.document.blockchainTxHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="blockchain-link"
                                                >
                                                    {formatHash(result.document.blockchainTxHash)}
                                                </a>
                                            </div>

                                            <div className="detail-row">
                                                <strong>Bloque:</strong>
                                                <span>#{result.document.blockNumber}</span>
                                            </div>
                                        </>
                                    )}

                                    {result.blockchain && result.blockchain.exists && (
                                        <>
                                            <div className="detail-row">
                                                <strong>Timestamp Blockchain:</strong>
                                                <span>{new Date(result.blockchain.timestamp).toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="result-header error">
                                    <XCircle size={60} />
                                    <h2>✗ Documento No Verificado</h2>
                                    <p>{result.message || 'Este documento no está registrado en el sistema'}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* How it works */}
                <div className="info-section card">
                    <h3>¿Cómo Funciona la Verificación?</h3>
                    <ol>
                        <li>
                            <strong>Cálculo del Hash:</strong> Se genera un hash SHA-256 único del documento.
                            Este hash es como una "huella digital" que identifica de manera única al archivo.
                        </li>
                        <li>
                            <strong>Búsqueda en Base de Datos:</strong> Se busca el hash en nuestra base de datos
                            para encontrar el registro del documento.
                        </li>
                        <li>
                            <strong>Verificación en Blockchain:</strong> Si el documento fue almacenado en la blockchain,
                            se verifica su existencia y se obtienen los detalles de la transacción.
                        </li>
                        <li>
                            <strong>Resultado:</strong> Si el hash coincide, el documento es auténtico y no ha sido
                            modificado desde su registro original.
                        </li>
                    </ol>
                </div>
            </div>

            <style jsx>{`
        .verify-page {
          padding: 60px 0;
        }

        .verify-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .verify-header h1 {
          font-size: 40px;
          margin: 20px 0 10px;
          color: var(--dark);
        }

        .verify-header p {
          font-size: 18px;
          color: var(--text-light);
        }

        .mode-selector {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 40px;
        }

        .mode-btn {
          padding: 12px 24px;
          border: 2px solid var(--border);
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          transition: all 0.3s;
        }

        .mode-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .mode-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .verify-card {
          max-width: 600px;
          margin: 0 auto 30px;
        }

        .verify-card h2 {
          font-size: 24px;
          margin-bottom: 10px;
          color: var(--dark);
        }

        .card-description {
          color: var(--text-light);
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .file-info {
          margin-top: 12px;
          padding: 12px;
          background: var(--light);
          border-radius: 6px;
        }

        .file-info p {
          margin: 4px 0;
          font-size: 14px;
          color: var(--text);
        }

        .form-help {
          display: block;
          margin-top: 6px;
          font-size: 14px;
          color: var(--text-light);
        }

        .result-card {
          max-width: 700px;
          margin: 0 auto 30px;
        }

        .result-header {
          text-align: center;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        .result-header.success {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #065f46;
        }

        .result-header.error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #991b1b;
        }

        .result-header h2 {
          font-size: 28px;
          margin: 16px 0 8px;
        }

        .result-header p {
          font-size: 16px;
          opacity: 0.9;
        }

        .result-details {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--light);
          border-radius: 6px;
          gap: 16px;
        }

        .detail-row strong {
          color: var(--dark);
          font-weight: 600;
          min-width: 180px;
        }

        .detail-row span {
          color: var(--text);
          text-align: right;
          word-break: break-all;
        }

        .hash-value {
          font-family: monospace;
          font-size: 13px;
        }

        .blockchain-link {
          color: var(--primary);
          text-decoration: none;
          font-family: monospace;
          font-size: 13px;
        }

        .blockchain-link:hover {
          text-decoration: underline;
        }

        .info-section {
          max-width: 700px;
          margin: 0 auto;
        }

        .info-section h3 {
          font-size: 24px;
          margin-bottom: 20px;
          color: var(--dark);
        }

        .info-section ol {
          padding-left: 24px;
        }

        .info-section li {
          margin-bottom: 16px;
          line-height: 1.6;
          color: var(--text);
        }

        .info-section strong {
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .verify-header h1 {
            font-size: 28px;
          }

          .mode-selector {
            flex-direction: column;
          }

          .mode-btn {
            width: 100%;
            justify-content: center;
          }

          .detail-row {
            flex-direction: column;
            align-items: start;
          }

          .detail-row strong {
            min-width: auto;
          }

          .detail-row span {
            text-align: left;
          }
        }
      `}</style>
        </div>
    );
};

export default VerifyPage;
