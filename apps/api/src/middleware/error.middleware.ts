import { createLogger } from '@myorg/utils';
import type { Context, Next } from 'hono';
import { ZodError } from 'zod';

const logger = createLogger('ErrorHandler');

/**
 * Global error handler middleware
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    logger.error('Unhandled error', err);

    // Handle Zod validation errors
    if (err instanceof ZodError) {
      return c.json(
        {
          error: 'Validation error',
          details: err.errors,
        },
        400
      );
    }

    // Handle known errors
    if (err instanceof Error) {
      // Check for common error types
      if (err.message.includes('not found')) {
        return c.json({ error: err.message }, 404);
      }
      if (err.message.includes('already exists')) {
        return c.json({ error: err.message }, 409);
      }
      if (err.message.includes('Invalid') || err.message.includes('Unauthorized')) {
        return c.json({ error: err.message }, 401);
      }
      if (err.message.includes('Forbidden')) {
        return c.json({ error: err.message }, 403);
      }

      // Generic error
      return c.json(
        { error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message },
        500
      );
    }

    // Unknown error
    return c.json({ error: 'Internal server error' }, 500);
  }
}
