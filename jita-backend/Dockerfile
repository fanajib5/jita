# JITA Backend — Express + mysql2 (monolitik server.js)
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# server.js me-require ./app.js, ./modules, ./config, ./shared, ./seeder, dan fonts/
COPY . .

RUN mkdir -p /app/uploads

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
