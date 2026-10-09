import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Request diagnostics middleware.
 *
 * Tracks incoming HTTP requests and records:
 * - Unique request ID
 * - HTTP method
 * - Request path
 * - Response status
 * - Request duration
 *
 * Sensitive request bodies, headers, and query
 * parameters are intentionally not logged.
 */

export function requestDiagnostics(
  req: Request,
  res: Response,
  next: NextFunction
): void {

  const requestId = randomUUID();

  const startTime = process.hrtime.bigint();

  // Attach an identifier to the response.
  res.setHeader('X-Request-ID', requestId);

  // Make the identifier available to later middleware.
  res.locals.requestId = requestId;

  res.on('finish', () => {

    const endTime = process.hrtime.bigint();

    const durationMs =
      Number(endTime - startTime) / 1_000_000;

    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs)
    };

    console.info(
      '[Soundwave Request]',
      JSON.stringify(logData)
    );

  });

  next();
}
