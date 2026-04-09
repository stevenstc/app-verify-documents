# Inicio Rápido - DocuChain

Guía de 5 minutos para ejecutar DocuChain en tu máquina local.

## 📦 Requisitos Previos

- Node.js 18+
- MongoDB instalado y corriendo
- MetaMask instalado en tu navegador

## 🚀 Instalación Rápida

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

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
MONGODB_URI=mongodb://localhost:27017/document-verify
PORT=5000
NODE_ENV=development
JWT_SECRET=mi_secreto_super_seguro_123
BTTC_RPC_URL=https://pre-rpc.bt.io/
BTTC_CONTRACT_ADDRESS=
BTTC_PRIVATE_KEY=
MONTHLY_SUBSCRIPTION_BTT=1000
```

Iniciar el servidor:

```bash
npm run dev
```

El servidor estará corriendo en `http://localhost:5000`

### 3. Configurar el Frontend

Abrir una nueva terminal:

```bash
cd client
npm install
```

Crear archivo `.env`:

```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

Iniciar la aplicación:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 4. Configurar MetaMask

1. Abrir MetaMask
2. Agregar red BTTChain Donau Testnet:
   - **Chain ID**: 1029
   - **RPC URL**: https://pre-rpc.bt.io/
   - **Currency Symbol**: BTT
   - **Explorer**: https://testnet.bttcscan.com

3. Obtener BTT de prueba del [faucet](https://testfaucet.bt.io/)

## ✅ Verificar Instalación

1. Abre `http://localhost:3000` en tu navegador
2. Deberías ver la landing page de DocuChain
3. Click en "Dashboard"
4. Click en "Conectar MetaMask"
5. Autoriza la conexión

## 🎯 Primeros Pasos

### Subir tu Primer Documento

1. Ve al Dashboard
2. (Opcional) Activa una suscripción de prueba
3. Click en "Cargar Documento"
4. Selecciona un archivo
5. Añade descripción (opcional)
6. Click en "Cargar y Calcular Hash"
7. Espera a que se calcule el hash

### Almacenar en Blockchain (Requiere Smart Contract)

Para almacenar en blockchain, primero debes desplegar el smart contract:

```bash
# Instalar Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Inicializar Hardhat
npx hardhat init

# Copiar el contrato
cp contracts/DocumentVerification.sol contracts/

# Compilar
npx hardhat compile

# Desplegar (necesitas configurar hardhat.config.js primero)
npx hardhat run scripts/deploy.js --network bttcTestnet
```

Actualiza `BTTC_CONTRACT_ADDRESS` en `.env` del servidor.

### Verificar un Documento

1. Ve a "Verificar" en el menú
2. Sube el mismo archivo que certificaste
3. O ingresa el hash SHA-256
4. Click en "Verificar"
5. Verás si el documento está registrado

## 🔧 Comandos Útiles

### Backend

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Ver logs
# (con PM2 en producción)
pm2 logs docuchain-api
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

### Base de Datos

```bash
# Conectar a MongoDB
mongosh document-verify

# Ver documentos
db.documents.find()

# Ver usuarios
db.users.find()

# Limpiar colección
db.documents.deleteMany({})
```

## 📝 Estructura de Archivos

```
app-verify-documents/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Navbar, etc
│   │   ├── context/     # Web3Context
│   │   ├── pages/       # Landing, Dashboard, Verify
│   │   ├── services/    # API
│   │   ├── styles/      # CSS
│   │   └── utils/       # Hash utilities
│   └── package.json
├── server/              # Backend Node.js
│   ├── src/
│   │   ├── config/      # DB config
│   │   ├── controllers/ # Lógica
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API routes
│   │   ├── services/    # Blockchain service
│   │   └── utils/       # Utilidades
│   └── package.json
├── contracts/           # Smart Contracts
│   └── DocumentVerification.sol
└── README.md
```

## 🐛 Problemas Comunes

### MongoDB no conecta

```bash
# Verificar que MongoDB está corriendo
sudo systemctl status mongod

# Iniciar MongoDB
sudo systemctl start mongod
```

### MetaMask no conecta

- Asegúrate de estar en la red BTTChain Donau Testnet
- Recarga la página
- Limpia el caché del navegador

### Error de CORS

Verifica que el backend permita el origen del frontend en `server/src/index.js`:

```javascript
app.use(cors({
  origin: 'http://localhost:3000'
}));
```

### Puerto en uso

```bash
# Matar proceso en puerto 5000
lsof -ti:5000 | xargs kill -9

# Matar proceso en puerto 3000
lsof -ti:3000 | xargs kill -9
```

## 📚 Siguientes Pasos

1. Lee el [README.md](README.md) completo
2. Revisa el [Modelo de Negocio](BUSINESS_MODEL.md)
3. Consulta la [Guía de Despliegue](DEPLOYMENT.md)
4. Explora el código fuente
5. Contribuye al proyecto

## 🆘 Ayuda

- **Documentación**: Ver README.md
- **Issues**: Abre un issue en GitHub
- **Email**: support@docuchain.com

---

¡Disfruta usando DocuChain! 🚀
