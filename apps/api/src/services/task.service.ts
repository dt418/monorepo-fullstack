import type { Prisma } from '@myorg/db';
import { PrismaClient } from '@myorg/db';
import type { Task, CreateTask, UpdateTask, TaskQuery, TaskListResponse } from '@myorg/types';
import { createLogger } from '@myorg/utils';
import { inject, injectable } from 'tsyringe';
import { CacheService, CacheKeys } from '../cache';
import { TOKENS } from '../container';
import { HTTPError } from '../exceptions/http.error';

const logger = createLogger('TaskService');

/**
 * Task CRUD service with caching
 */
@injectable()
export class TaskService {
  constructor(
    @inject(TOKENS.Prisma) private prisma: PrismaClient,
    @inject(CacheService) private cache: CacheService
  ) {}

  /**
   * Create a new task
   */
  async create(userId: string, input: CreateTask): Promise<Task> {
    const task = await this.prisma.task.create({
      data: {
        ...input,
        userId,
      },
    });

    // Invalidate user tasks cache
    await this.cache.deletePattern(`tasks:user:${userId}*`);

    logger.info(`Task created: ${task.id} by user ${userId}`);

    return task as Task;
  }

  /**
   * Get task by ID
   */
  async getById(id: string, userId: string): Promise<Task | null> {
    // Try cache first
    const cached = await this.cache.get<Task>(CacheKeys.task(id));
    if (cached && cached.userId === userId) {
      return cached;
    }

    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });

    if (task) {
      await this.cache.set(CacheKeys.task(id), task);
    }

    return task as Task | null;
  }

  /**
   * List tasks with filters and pagination
   */
  async list(userId: string, query: TaskQuery): Promise<TaskListResponse> {
    const { status, priority, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = { userId };

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      tasks: tasks as Task[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update a task
   */
  async update(id: string, userId: string, input: UpdateTask): Promise<Task> {
    const task = await this.prisma.task.updateMany({
      where: { id, userId },
      data: input,
    });

    if (task.count === 0) {
      throw new HTTPError(404, { message: 'Task not found', details: { taskId: id } });
    }

    // Invalidate caches
    await this.cache.delete(CacheKeys.task(id));
    await this.cache.deletePattern(`tasks:user:${userId}*`);

    const updated = await this.prisma.task.findUnique({ where: { id } });
    logger.info(`Task updated: ${id}`);

    return updated as Task;
  }

  /**
   * Delete a task
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.prisma.task.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new HTTPError(404, { message: 'Task not found', details: { taskId: id } });
    }

    // Invalidate caches
    await this.cache.delete(CacheKeys.task(id));
    await this.cache.deletePattern(`tasks:user:${userId}*`);

    logger.info(`Task deleted: ${id}`);
  }
}
