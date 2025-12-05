import type { Role } from '@myorg/types';
import type { Context, Next } from 'hono';
import { getUser } from './auth.middleware';

/**
 * RBAC middleware - check if user has required role
 */
export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const user = getUser(c);

    if (!allowedRoles.includes(user.role as Role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}

/**
 * Admin only middleware shorthand
 */
export function adminOnly() {
  return requireRole('admin');
}
