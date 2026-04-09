FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Expose port
EXPOSE 5000

# Run as non-root user
USER node

CMD ["node", "src/index.js"]
