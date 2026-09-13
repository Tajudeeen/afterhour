import './env.js';
import { serve } from '@hono/node-server';
import { app, apiConfig } from './index.js';

const port = apiConfig.apiPort;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[afterhours-api] listening on port ${info.port}`);
  console.log(`[afterhours-api] Solana RPC: ${apiConfig.solana.rpcUrl}`);
});
