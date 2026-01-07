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

/**
 * Server Configuration & Entry Point
 */

const logger = createLogger('Server');
const env = getEnv();

// Initialize Dependency Injection
initContainer();

// Define Hono instance with strict environment types
const app = new Hono();

// --- 1. Global Middleware Stack ---

// Logger first to capture every incoming request
app.use('*', honoLogger());

// CORS next to handle preflight (OPTIONS) requests immediately
app.use(
  '*',
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// --- 2. Error Handling ---

// Global error hook (handles Zod, Prisma, and HTTP exceptions)
app.onError(errorHandler);

// --- 3. Routes & Business Logic ---

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Route Modules
app.route('/api/auth', authRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/users', userRoutes);
app.route('/api/files', fileRoutes);

// --- 4. Fallback Handlers ---

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json({ success: false, error: 'Route not found' }, 404);
});

// --- 5. Server Lifecycle ---

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

// Initialize WebSocket gateway after HTTP server is active
WebSocketGateway.initialize(httpServer);

// Graceful shutdown handling
const shutdown = async (): Promise<void> => {
  logger.info('Shutting down server...');
  httpServer.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
