import { UpdateUserSchema } from '@myorg/types';
import { Hono } from 'hono';
import { container } from '../container';
import { authMiddleware, adminOnly, getUser } from '../middleware';
import { UserService } from '../services';

const users = new Hono();

// All routes require authentication
users.use('*', authMiddleware);

/**
 * GET /users/me - Get current user
 */
users.get('/me', async (c) => {
  const user = getUser(c);

  const userService = container.resolve(UserService);
  const userData = await userService.getById(user.userId);

  if (!userData) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(userData);
});

/**
 * GET /users - List all users (admin only)
 */
users.get('/', adminOnly(), async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');

  const userService = container.resolve(UserService);
  const result = await userService.list(page, limit);

  return c.json(result);
});

/**
 * GET /users/:id - Get user by ID (admin only)
 */
users.get('/:id', adminOnly(), async (c) => {
  const id = c.req.param('id');

  const userService = container.resolve(UserService);
  const user = await userService.getById(id);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(user);
});

/**
 * PATCH /users/:id - Update user (admin only)
 */
users.patch('/:id', adminOnly(), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const input = UpdateUserSchema.parse(body);

  const userService = container.resolve(UserService);
  const user = await userService.update(id, input);

  return c.json(user);
});

/**
 * DELETE /users/:id - Delete user (admin only)
 */
users.delete('/:id', adminOnly(), async (c) => {
  const id = c.req.param('id');

  const userService = container.resolve(UserService);
  await userService.delete(id);

  return c.json({ message: 'User deleted' });
});

export { users as userRoutes };
