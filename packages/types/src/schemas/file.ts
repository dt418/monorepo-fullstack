import { z } from 'zod';

// ============ File ============
export const FileSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().positive(),
  url: z.string().url(),
  userId: z.string().uuid(),
  createdAt: z.coerce.date(),
});
export type File = z.infer<typeof FileSchema>;

export const FileUploadResponseSchema = z.object({
  file: FileSchema,
  message: z.string(),
});
export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

export const FileListResponseSchema = z.object({
  files: z.array(FileSchema),
  total: z.number(),
});
export type FileListResponse = z.infer<typeof FileListResponseSchema>;

// ============ Allowed Types ============
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/json',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
