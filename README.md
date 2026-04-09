# DocuChain - Verificación de Documentos en Blockchain

Una aplicación completa para verificar y certificar documentos usando blockchain BTTChain, con cálculo de hash SHA-256 y almacenamiento inmutable.

## 🌟 Características

- **Verificación SHA-256**: Calcula el hash SHA-256 de documentos para crear una huella digital única
- **Blockchain BTTChain**: Almacena los hashes en la blockchain para garantizar inmutabilidad
- **Integración MetaMask**: Conecta tu wallet para gestionar documentos y suscripciones
- **Suscripción BTT**: Sistema de suscripción mensual pagada en BTT
- **Panel de Control**: Interfaz intuitiva para gestionar todos tus documentos
- **Verificación Pública**: Cualquiera puede verificar la autenticidad de un documento

## 📋 Modelo de Negocio

### Suscripción Mensual

**Precio**: 1000 BTT/mes

**Incluye**:
- Documentos ilimitados para certificar
- Verificación instantánea
- Almacenamiento en blockchain
- Panel de administración completo
- Historial de todos los documentos
- Soporte prioritario

### ¿Cómo Funciona?

1. **Registro de Usuarios**: Los usuarios se conectan con MetaMask (sin necesidad de email/password)
2. **Suscripción**: Pago mensual de 1000 BTT para acceder al servicio
3. **Certificación de Documentos**: 
   - Usuario sube documento
   - Sistema calcula hash SHA-256
   - Hash se almacena en blockchain BTTChain
   - Usuario recibe confirmación con TX hash
4. **Verificación**: Cualquiera puede verificar un documento (gratis)
   - Sube el documento o ingresa el hash
   - Sistema verifica contra blockchain
   - Muestra información de autenticidad

### Ventajas del Modelo

- **Seguridad**: Blockchain inmutable garantiza la autenticidad
- **Privacidad**: Solo se almacena el hash, no el contenido del documento
- **Escalabilidad**: Sin límite de documentos por suscriptor
- **Accesibilidad**: Verificación pública y gratuita
- **Costos bajos**: BTTChain ofrece tarifas de transacción muy bajas

## 🏗️ Arquitectura Técnica

### Frontend (React + Vite)
- **React 18**: Framework UI moderno
- **Vite**: Build tool rápido
- **ethers.js**: Interacción con blockchain
- **crypto-js**: Cálculo de hash SHA-256
- **React Router**: Navegación SPA

### Backend (Node.js + Express)
- **Express**: Framework web
- **MongoDB**: Base de datos para metadata
- **ethers**: Interacción con BTTChain
- **Multer**: Manejo de archivos
- **crypto**: Cálculo de hash SHA-256

### Blockchain (Solidity)
- **Smart Contract**: `DocumentVerification.sol`
- **Red**: BTTChain Mainnet/Testnet
- **Funciones**:
  - `storeDocumentHash()`: Almacenar hash
  - `verifyDocument()`: Verificar existencia
  - `getDocumentInfo()`: Obtener información
  - `getUserDocuments()`: Listar documentos de usuario

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- MongoDB
- MetaMask instalado en el navegador
- BTT en la wallet para suscripción

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/app-verify-documents.git
cd app-verify-documents
```

### 2. Configurar el Backend

```bash
cd server
npm install
```

Crear archivo `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/document-verify
PORT=5000
NODE_ENV=development
JWT_SECRET=tu_secreto_super_seguro
BTTC_RPC_URL=https://rpc.bt.io
BTTC_CONTRACT_ADDRESS=0x... # Dirección del contrato desplegado
BTTC_PRIVATE_KEY=0x... # Private key para transacciones del servidor
MONTHLY_SUBSCRIPTION_BTT=1000
```

Iniciar el servidor:

```bash
npm run dev
```

### 3. Configurar el Frontend

```bash
cd client
npm install
```

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Iniciar la aplicación:

```bash
npm run dev
```

### 4. Desplegar Smart Contract

1. Instalar Hardhat (si no está instalado):

```bash
npm install --global hardhat
```

2. Compilar el contrato:

```bash
npx hardhat compile
```

3. Desplegar en BTTChain:

```bash
npx hardhat run scripts/deploy.js --network bttc
```

4. Actualizar `BTTC_CONTRACT_ADDRESS` en `.env`

## 📱 Uso de la Aplicación

### Para Usuarios

1. **Conectar Wallet**
   - Abre la aplicación
   - Click en "Conectar MetaMask"
   - Autoriza la conexión
   - Asegúrate de estar en la red BTTChain

2. **Suscribirse**
   - Ve al Dashboard
   - Click en "Suscribirse (1000 BTT/mes)"
   - Confirma la transacción en MetaMask

3. **Certificar Documento**
   - Click en "Cargar Documento"
   - Selecciona el archivo
   - (Opcional) Añade descripción
   - Click en "Cargar y Calcular Hash"
   - Click en "Almacenar en Blockchain"
   - Confirma la transacción

4. **Verificar Documento**
   - Ve a la página "Verificar"
   - Sube el archivo O ingresa el hash
   - Click en "Verificar"
   - Ve los resultados

### Para Verificadores (Sin Suscripción)

1. Abre la página de verificación
2. Sube el documento o ingresa el hash SHA-256
3. Obtén confirmación instantánea de autenticidad

## 🔐 Seguridad

- **Hashing SHA-256**: Algoritmo criptográfico estándar de la industria
- **Blockchain Inmutable**: Los registros no pueden ser alterados
- **Sin almacenamiento de archivo**: Solo se almacena el hash, no el contenido
- **Autenticación Web3**: Sin passwords, solo wallets
- **Smart Contract verificado**: Código abierto y auditable

## 🌐 Redes Soportadas

### BTTChain Mainnet
- Chain ID: 199
- RPC: https://rpc.bt.io
- Explorer: https://bttcscan.com

### BTTChain Donau Testnet
- Chain ID: 1029
- RPC: https://pre-rpc.bt.io/
- Explorer: https://testnet.bttcscan.com

## 📊 Estructura del Proyecto

```
app-verify-documents/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── context/       # Context API (Web3)
│   │   ├── pages/         # Páginas de la app
│   │   ├── services/      # API calls
│   │   ├── styles/        # Estilos CSS
│   │   └── utils/         # Utilidades (hash, etc)
│   └── package.json
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── config/        # Configuración DB
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── models/        # Modelos MongoDB
│   │   ├── routes/        # Rutas API
│   │   ├── services/      # Servicios (blockchain)
│   │   └── utils/         # Utilidades
│   └── package.json
├── contracts/             # Smart Contracts Solidity
│   └── DocumentVerification.sol
└── README.md
```

## 🔧 API Endpoints

### Documentos

- `POST /api/documents/upload` - Subir documento
- `POST /api/documents/:id/store-blockchain` - Almacenar en blockchain
- `GET /api/documents/verify/:hash` - Verificar por hash
- `GET /api/documents/user/:address` - Obtener documentos de usuario
- `POST /api/documents/verify-file` - Verificar archivo

### Usuarios

- `GET /api/users/:address` - Obtener/crear usuario
- `POST /api/users/:address/subscription` - Actualizar suscripción
- `GET /api/users/:address/subscription/status` - Estado de suscripción
- `PUT /api/users/:address/profile` - Actualizar perfil
- `GET /api/users/:address/balance` - Obtener balance BTT

## 💡 Casos de Uso

1. **Certificación de Diplomas**: Universidades certifican diplomas
2. **Contratos Legales**: Abogados certifican contratos
3. **Documentos Médicos**: Hospitales certifican historias clínicas
4. **Certificados**: Organizaciones certifican documentos oficiales
5. **Propiedad Intelectual**: Autores certifican obras originales
6. **Facturas**: Empresas certifican facturas para auditoría

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles

## 📞 Soporte

- Email: support@docuchain.com
- Discord: https://discord.gg/docuchain
- Twitter: @DocuChain

## 🙏 Agradecimientos

- BTTChain por su infraestructura blockchain
- MetaMask por la integración de wallets
- La comunidad Open Source

---

**Desarrollado con ❤️ para la verificación segura de documentos**
