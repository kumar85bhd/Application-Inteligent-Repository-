import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { applicationRouter } from './server/controller';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON deserialization for incoming request bodies
  app.use(express.json());

  // Mount API endpoints
  app.use('/api/applications', applicationRouter);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', datetime: new Date().toISOString() });
  });

  // Vite integration middleware
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting development server with Vite middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving production-built assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIR Full-Stack Server listening at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Critical server crash on boot:', err);
});
