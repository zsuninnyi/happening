import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { prisma } from './db/prisma.js';

const env = loadEnv();
const app = createApp(env);

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
