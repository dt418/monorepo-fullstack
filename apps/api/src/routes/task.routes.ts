import { CreateTaskSchema, UpdateTaskSchema, TaskQuerySchema } from '@myorg/types';
import { Hono } from 'hono';
import { container } from '../container';
import { authMiddleware, getUser } from '../middleware';
import { TaskService } from '../services';
import { WebSocketGateway } from '../websocket';

const tasks = new Hono();

// All routes require authentication
tasks.use('*', authMiddleware);

/**
 * GET /tasks - List user's tasks with filters
 */
tasks.get('/', async (c) => {
  const user = getUser(c);
  const query = TaskQuerySchema.parse(c.req.query());

  const taskService = container.resolve(TaskService);
  const result = await taskService.list(user.userId, query);

  return c.json(result);
});

/**
 * GET /tasks/:id - Get task by ID
 */
tasks.get('/:id', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');

  const taskService = container.resolve(TaskService);
  const task = await taskService.getById(id, user.userId);

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json(task);
});

/**
 * POST /tasks - Create new task
 */
tasks.post('/', async (c) => {
  const user = getUser(c);
  const body = await c.req.json();
  const input = CreateTaskSchema.parse(body);

  const taskService = container.resolve(TaskService);
  const task = await taskService.create(user.userId, input);

  // Broadcast to WebSocket clients
  const ws = WebSocketGateway.getInstance();
  ws?.toUser(user.userId, 'task:created', { task });

  return c.json(task, 201);
});

/**
 * PATCH /tasks/:id - Update task
 */
tasks.patch('/:id', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');
  const body = await c.req.json();
  const input = UpdateTaskSchema.parse(body);

  const taskService = container.resolve(TaskService);
  const task = await taskService.update(id, user.userId, input);

  // Broadcast to WebSocket clients
  const ws = WebSocketGateway.getInstance();
  ws?.toUser(user.userId, 'task:updated', { task });

  return c.json(task);
});

/**
 * DELETE /tasks/:id - Delete task
 */
tasks.delete('/:id', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');

  const taskService = container.resolve(TaskService);
  await taskService.delete(id, user.userId);

  // Broadcast to WebSocket clients
  const ws = WebSocketGateway.getInstance();
  ws?.toUser(user.userId, 'task:deleted', { taskId: id });

  return c.json({ message: 'Task deleted' });
});

export { tasks as taskRoutes };
