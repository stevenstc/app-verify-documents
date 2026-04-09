# Guía de Despliegue - DocuChain

Esta guía te ayudará a desplegar la aplicación DocuChain en producción.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- MongoDB (local o Atlas)
- Cuenta en BTTChain con BTT para gas fees
- MetaMask configurado con BTTChain

## 🚀 Despliegue del Smart Contract

### 1. Instalar Hardhat

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Inicializar Hardhat

```bash
npx hardhat init
```

### 3. Configurar Hardhat

Crear `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    bttc: {
      url: "https://rpc.bt.io",
      accounts: [process.env.PRIVATE_KEY]
    },
    bttcTestnet: {
      url: "https://pre-rpc.bt.io/",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### 4. Crear Script de Despliegue

Crear `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const DocumentVerification = await hre.ethers.getContractFactory("DocumentVerification");
  const contract = await DocumentVerification.deploy();

  await contract.waitForDeployment();

  console.log("DocumentVerification deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### 5. Desplegar

```bash
# Testnet
npx hardhat run scripts/deploy.js --network bttcTestnet

# Mainnet
npx hardhat run scripts/deploy.js --network bttc
```

### 6. Verificar Contrato

```bash
npx hardhat verify --network bttc DIRECCION_DEL_CONTRATO
```

## 🖥️ Despliegue del Backend

### Opción 1: VPS (Digital Ocean, AWS, etc.)

1. **Conectar al servidor**:
```bash
ssh user@your-server-ip
```

2. **Instalar Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Instalar MongoDB**:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

4. **Clonar repositorio**:
```bash
git clone https://github.com/tu-usuario/app-verify-documents.git
cd app-verify-documents/server
npm install
```

5. **Configurar variables de entorno**:
```bash
nano .env
```

Agregar:
```env
MONGODB_URI=mongodb://localhost:27017/document-verify
PORT=5000
NODE_ENV=production
JWT_SECRET=tu_secreto_ultra_seguro_generado_con_openssl
BTTC_RPC_URL=https://rpc.bt.io
BTTC_CONTRACT_ADDRESS=0xTU_CONTRATO_DESPLEGADO
BTTC_PRIVATE_KEY=0xTU_PRIVATE_KEY
MONTHLY_SUBSCRIPTION_BTT=1000
```

6. **Configurar PM2**:
```bash
npm install -g pm2
pm2 start src/index.js --name docuchain-api
pm2 startup
pm2 save
```

7. **Configurar Nginx**:
```bash
sudo apt-get install nginx

sudo nano /etc/nginx/sites-available/docuchain
```

Agregar:
```nginx
server {
    listen 80;
    server_name api.docuchain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/docuchain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. **Configurar SSL con Let's Encrypt**:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.docuchain.com
```

### Opción 2: Heroku

1. **Instalar Heroku CLI**:
```bash
npm install -g heroku
```

2. **Login**:
```bash
heroku login
```

3. **Crear app**:
```bash
cd server
heroku create docuchain-api
```

4. **Configurar variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=tu_mongodb_atlas_uri
heroku config:set JWT_SECRET=tu_secreto
heroku config:set BTTC_CONTRACT_ADDRESS=0x...
heroku config:set BTTC_PRIVATE_KEY=0x...
```

5. **Desplegar**:
```bash
git push heroku main
```

### Opción 3: Railway.app

1. Conectar repositorio en railway.app
2. Configurar variables de entorno en dashboard
3. Deploy automático

## 🌐 Despliegue del Frontend

### Opción 1: Vercel (Recomendado)

1. **Instalar Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
cd client
vercel
```

3. **Configurar variables de entorno en Vercel Dashboard**:
```
VITE_API_URL=https://api.docuchain.com/api
```

4. **Deploy a producción**:
```bash
vercel --prod
```

### Opción 2: Netlify

1. Conectar repositorio en netlify.com
2. Configurar build:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Agregar variables de entorno
4. Deploy

### Opción 3: GitHub Pages

1. **Instalar gh-pages**:
```bash
cd client
npm install --save-dev gh-pages
```

2. **Modificar package.json**:
```json
{
  "homepage": "https://tu-usuario.github.io/app-verify-documents",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. **Deploy**:
```bash
npm run deploy
```

## 🗄️ MongoDB (Producción)

### Opción 1: MongoDB Atlas (Recomendado)

1. Crear cuenta en mongodb.com/cloud/atlas
2. Crear nuevo cluster (Free tier disponible)
3. Configurar acceso de red (whitelist IPs)
4. Crear usuario de base de datos
5. Obtener connection string
6. Actualizar `MONGODB_URI` en `.env`

### Opción 2: MongoDB Auto-hospedado

Ver sección de instalación en VPS arriba.

## 🔒 Seguridad en Producción

### 1. Variables de Entorno

- Nunca commitear `.env` al repositorio
- Usar secretos fuertes generados con:
```bash
openssl rand -base64 32
```

### 2. CORS

En `server/src/index.js`, configurar CORS apropiadamente:
```javascript
app.use(cors({
  origin: 'https://docuchain.com',
  credentials: true
}));
```

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requests por ventana
});

app.use('/api/', limiter);
```

### 4. Helmet

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

## 📊 Monitoreo

### 1. Backend Logs

```bash
# Con PM2
pm2 logs docuchain-api

# Guardar logs
pm2 install pm2-logrotate
```

### 2. Uptime Monitoring

- UptimeRobot (gratis)
- Pingdom
- StatusCake

### 3. Application Performance

- New Relic
- DataDog
- Sentry (para errores)

## 🔄 CI/CD

### GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd app-verify-documents/server
            git pull
            npm install
            pm2 restart docuchain-api

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## ✅ Checklist Pre-Despliegue

- [ ] Smart contract desplegado y verificado
- [ ] Variables de entorno configuradas
- [ ] MongoDB en producción configurado
- [ ] SSL/HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Rate limiting implementado
- [ ] Logs configurados
- [ ] Backups de base de datos configurados
- [ ] Monitoreo de uptime activo
- [ ] DNS configurado
- [ ] Pruebas end-to-end pasadas

## 🐛 Troubleshooting

### Backend no inicia

```bash
pm2 logs docuchain-api --lines 100
```

### Frontend no se conecta al backend

- Verificar CORS
- Verificar `VITE_API_URL`
- Verificar que backend esté corriendo

### Error de conexión a MongoDB

- Verificar connection string
- Verificar whitelist de IPs en Atlas
- Verificar usuario/password

### Transacciones blockchain fallan

- Verificar balance de BTT
- Verificar contract address
- Verificar RPC URL

## 📞 Soporte

Si tienes problemas con el despliegue:
- Revisa los logs
- Consulta la documentación
- Abre un issue en GitHub

---

**¡Éxito con tu despliegue!**
