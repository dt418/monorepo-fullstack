import { LoginSchema, RegisterSchema, RefreshTokenSchema } from '@myorg/types';
import { Hono } from 'hono';
import { container } from '../container';
import { AuthService } from '../services';

const auth = new Hono();

/**
 * POST /auth/register - Register new user
 */
auth.post('/register', async (c) => {
  const body = await c.req.json();
  const input = RegisterSchema.parse(body);

  const authService = container.resolve(AuthService);
  const result = await authService.register(input);

  return c.json(result, 201);
});

/**
 * POST /auth/login - Login user
 */
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const input = LoginSchema.parse(body);

  const authService = container.resolve(AuthService);
  const result = await authService.login(input);

  return c.json(result);
});

/**
 * POST /auth/refresh - Refresh access token
 */
auth.post('/refresh', async (c) => {
  const body = await c.req.json();
  const input = RefreshTokenSchema.parse(body);

  const authService = container.resolve(AuthService);
  const tokens = await authService.refreshToken(input.refreshToken);

  return c.json(tokens);
});

/**
 * POST /auth/logout - Logout user
 */
auth.post('/logout', async (c) => {
  const body = await c.req.json();
  const input = RefreshTokenSchema.parse(body);

  const authService = container.resolve(AuthService);
  await authService.logout(input.refreshToken);

  return c.json({ message: 'Logged out successfully' });
});

export { auth as authRoutes };
