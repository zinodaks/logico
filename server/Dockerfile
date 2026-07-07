FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY server/package*.json server/
RUN npm ci --workspace server --omit=dev

COPY server server

WORKDIR /app/server
EXPOSE 4000
CMD ["node", "src/index.js"]
