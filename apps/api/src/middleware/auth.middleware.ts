import { createLogger } from '@myorg/utils';
import type { Context, Next } from 'hono';
import { container } from '../container';
import { AuthService, type JwtPayload } from '../services';

const logger = createLogger('AuthMiddleware');

/**
 * Auth middleware for protected routes
 */
export async function authMiddleware(c: Context, next: Next) {
  const authorization = c.req.header('Authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authorization.slice(7);

  try {
    const authService = container.resolve(AuthService);
    const payload = authService.verifyAccessToken(token);

    // Attach user to context
    c.set('user', payload);

    await next();
  } catch (err) {
    logger.warn('Invalid token', err);
    return c.json({ error: 'Invalid token' }, 401);
  }
}

/**
 * Get authenticated user from context
 */
export function getUser(c: Context): JwtPayload {
  const user = c.get('user') as JwtPayload;
  if (!user) {
    throw new Error('User not found in context');
  }
  return user;
}
