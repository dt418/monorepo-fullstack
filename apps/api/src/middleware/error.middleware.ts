import { Prisma } from '@myorg/db';
import { createLogger } from '@myorg/utils';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { HTTPError } from '../exceptions/http.error';

const logger = createLogger('ErrorHandler');

export const errorHandler = (err: Error, c: Context) => {
  // 1. Handle Prisma Known Request Errors (e.g., P2002 Unique Constraint)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn(`Database Error [${err.code}]: ${err.message}`);

    const response = {
      success: false,
      error: 'Database operation failed',
      code: err.code,
      meta: err.meta as Record<string, unknown> | undefined, // Type-safe narrow
    };

    // Map common Prisma codes to HTTP status codes
    const status: StatusCode = err.code === 'P2002' ? 409 : 400;
    return c.json(response, status);
  }

  // 2. Handle Prisma Validation/Initialization Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Database Validation Error', err);
    return c.json({ success: false, error: 'Invalid data provided to database' }, 400);
  }

  // 3. Handle Hono HTTPExceptions & Custom HTTPErrors
  if (err instanceof HTTPException) {
    const status = err.status;
    if (status >= 500) {
      logger.error(`HTTP ${status} error`, err);
    }

    const responseBody: Record<string, unknown> = {
      success: false,
      error: err.message,
    };

    if (err instanceof HTTPError && err.details) {
      responseBody.details = err.details;
    }

    return c.json(responseBody, status as ContentfulStatusCode);
  }

  // 4. Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: 'Validation failed',
        details: err.errors,
      },
      400
    );
  }

  // 5. Unhandled Fallback
  logger.error('Unhandled Exception', err);
  const isProd = process.env.NODE_ENV === 'production';

  return c.json(
    {
      success: false,
      error: isProd ? 'Internal Server Error' : err.message,
    },
    500
  );
};
