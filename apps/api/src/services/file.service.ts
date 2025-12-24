import * as fs from 'fs/promises';
import * as path from 'path';
import { PrismaClient } from '@myorg/db';
import type { File as FileType, FileUploadResponse } from '@myorg/types';
import { getEnv, createLogger, formatBytes } from '@myorg/utils';
import { inject, injectable } from 'tsyringe';
import { v4 as uuid } from 'uuid';
import { TOKENS } from '../container';

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
   * Get file by ID
   */
  async getById(id: string, userId: string): Promise<FileType | null> {
    const file = await this.prisma.file.findFirst({
      where: { id, userId },
    });

    return file as FileType | null;
  }

  /**
   * List user files
   */
  async list(userId: string): Promise<{ files: FileType[]; total: number }> {
    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where: { userId } }),
    ]);

    return { files: files as FileType[], total };
  }

  /**
   * Delete a file
   */
  async delete(id: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findFirst({
      where: { id, userId },
    });

    if (!file) {
      throw new Error('File not found');
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

    logger.info(`File deleted: ${file.filename}`);
  }
}
