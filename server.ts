import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { handleAsk } from './api/ask.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      mcpServersConfigured: Boolean(process.env.MCP_SERVERS),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Main /api/ask endpoint reusing the exact logic in api/ask.ts
  app.all('/api/ask', (req, res) => {
    return handleAsk(req, res);
  });

  // In AI Studio development, mount Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ScholarPulse Server] running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('[ScholarPulse Server] Failed to start:', err);
  process.exit(1);
});
