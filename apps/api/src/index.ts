import 'reflect-metadata';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { getEnv, createLogger } from '@myorg/utils';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { initContainer } from './container';
import { errorHandler } from './middleware';
import { authRoutes, taskRoutes, userRoutes, fileRoutes } from './routes';
import { WebSocketGateway } from './websocket';

const logger = createLogger('Server');

// Initialize DI container
initContainer();

// Create Hono app
const app = new Hono();

// Get env
const env = getEnv();

// Global middleware
app.use(
  '/uploads/*',
  serveStatic({
    root: env.UPLOAD_DIR,
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, ''),
  })
);
app.use('*', honoLogger());
app.use(
  '*',
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use('*', errorHandler);

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/users', userRoutes);
app.route('/api/files', fileRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Create HTTP server
// Create and start HTTP server
const httpServer = serve(
  {
    fetch: app.fetch,
    port: Number(env.API_PORT),
  },
  (info) => {
    logger.info(`🚀 Server running on http://${env.HOST}:${info.port}`);
    logger.info(`📡 WebSocket ready`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  }
);

// Initialize WebSocket gateway
WebSocketGateway.initialize(httpServer);

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down...');
  httpServer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
