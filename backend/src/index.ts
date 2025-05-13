// src/index.ts - Version sans Swagger
import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`🚀 Serveur démarré sur le port ${PORT}`);

Bun.serve({
  port: PORT,
  fetch: app.fetch
});