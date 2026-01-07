import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@myorg/db';
import type { File as FileType, FileUploadResponse } from '@myorg/types';
import { getEnv, createLogger, formatBytes } from '@myorg/utils';
import { inject, injectable } from 'tsyringe';
import { v4 as uuid } from 'uuid';
import { TOKENS } from '../container';
import { HTTPError } from '../exceptions/http.error';

const logger = createLogger('FileService');

/**
 * File upload service (local storage)
 */
@injectable()
export class FileService {
  constructor(@inject(TOKENS.Prisma) private prisma: PrismaClient) {}

  /**
   * Upload a file
   */
  async upload(
    userId: string,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }
  ): Promise<FileUploadResponse> {
    const env = getEnv();

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    const filePath = path.join(uploadDir, filename);

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create file record in database
    const fileRecord = await this.prisma.file.create({
      data: {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        url: `/uploads/${filename}`,
        userId,
      },
    });

    logger.info(`File uploaded: ${filename} (${formatBytes(file.size)}) by user ${userId}`);

    return {
      file: fileRecord as FileType,
      message: 'File uploaded successfully',
    };
  }

  /**
   * Get file by ID (with admin access)
   */
  async getById(id: string, userId: string, userRole?: string): Promise<FileType | null> {
    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const file = await this.prisma.file.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return file as FileType | null;
  }

  /**
   * Get file content for download (with admin access)
   */
  async getFileContent(
    id: string,
    userId: string,
    userRole?: string
  ): Promise<{ buffer: Buffer; mimeType: string; originalName: string; size: number } | null> {
    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const file = await this.prisma.file.findFirst({
      where: whereClause,
    });

    if (!file) {
      return null;
    }

    try {
      const buffer = await fs.readFile(file.path);
      return {
        buffer,
        mimeType: file.mimeType,
        originalName: file.originalName,
        size: file.size,
      };
    } catch (error) {
      logger.error(`Failed to read file: ${file.path}`, error);
      throw new HTTPError(500, { message: 'Failed to read file' });
    }
  }

  /**
   * List user files (with admin access to all files)
   */
  async list(userId: string, userRole?: string): Promise<{ files: FileType[]; total: number }> {
    const whereClause = userRole === 'admin' ? {} : { userId };

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include:
          userRole === 'admin'
            ? {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              }
            : undefined,
      }),
      this.prisma.file.count({ where: whereClause }),
    ]);

    return { files: files as FileType[], total };
  }

  /**
   * Delete a file (with admin access)
   */
  async delete(id: string, userId: string, userRole?: string): Promise<void> {
    const whereClause = userRole === 'admin' ? { id } : { id, userId };

    const file = await this.prisma.file.findFirst({
      where: whereClause,
    });

    if (!file) {
      throw new HTTPError(404, { message: 'File not found', details: { fileId: id } });
    }

    // Delete from disk
    try {
      const env = getEnv();
      const uploadDir = path.resolve(env.UPLOAD_DIR);
      const filePath = path.join(uploadDir, file.filename);
      await fs.unlink(filePath);
    } catch (err) {
      logger.warn(`Failed to delete file from disk: ${file.filename}`);
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id },
    });

    logger.info(
      `File deleted: ${file.filename} by ${userRole === 'admin' ? 'admin' : 'user'} ${userId}`
    );
  }
}
