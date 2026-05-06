FROM node:22-alpine

WORKDIR /app

# Copiar package files del backend
COPY backend/package.json backend/package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar código fuente del backend
COPY backend/ .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 3000

# Iniciar servidor
CMD ["node", "dist/index.js"]
