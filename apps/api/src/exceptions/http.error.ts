import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Custom HTTP error class that extends Hono's HTTPException
 */
export class HTTPError extends HTTPException {
  public readonly details?: unknown;

  constructor(
    status: ContentfulStatusCode,
    options?: { message?: string; details?: unknown; cause?: unknown }
  ) {
    super(status, { message: options?.message, cause: options?.cause });
    this.name = 'HTTPError';
    this.details = options?.details;
  }
}
