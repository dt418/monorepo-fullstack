import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@myorg/types';
import { Hono } from 'hono';
import { container } from '../container';
import { authMiddleware, getUser } from '../middleware';
import { FileService } from '../services';

const files = new Hono();

// All routes require authentication
files.use('*', authMiddleware);

/**
 * GET /files - List user's files
 */
files.get('/', async (c) => {
  const user = getUser(c);

  const fileService = container.resolve(FileService);
  const result = await fileService.list(user.userId, user.role);

  return c.json(result);
});

/**
 * GET /files/:id - Get file by ID
 */
files.get('/:id', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');

  const fileService = container.resolve(FileService);
  const file = await fileService.getById(id, user.userId, user.role);

  if (!file) {
    return c.json({ error: 'File not found' }, 404);
  }

  return c.json(file);
});

/**
 * GET /files/:id/download - Download file content (protected)
 */
files.get('/:id/download', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');

  const fileService = container.resolve(FileService);
  const fileData = await fileService.getFileContent(id, user.userId, user.role);

  if (!fileData) {
    return c.json({ error: 'File not found' }, 404);
  }

  return new Response(new Uint8Array(fileData.buffer), {
    headers: {
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `inline; filename="${fileData.originalName}"`,
      'Content-Length': fileData.size.toString(),
    },
  });
});

/**
 * POST /files/upload - Upload file
 */
files.post('/upload', async (c) => {
  const user = getUser(c);

  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: 'File too large' }, 400);
  }

  // Validate mime type
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return c.json({ error: 'File type not allowed' }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const fileService = container.resolve(FileService);
  const result = await fileService.upload(user.userId, {
    buffer,
    originalname: file.name,
    mimetype: file.type,
    size: file.size,
  });

  return c.json(result, 201);
});

/**
 * DELETE /files/:id - Delete file
 */
files.delete('/:id', async (c) => {
  const user = getUser(c);
  const id = c.req.param('id');

  const fileService = container.resolve(FileService);
  await fileService.delete(id, user.userId, user.role);

  return c.json({ message: 'File deleted' });
});

export { files as fileRoutes };
