import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Sentinel Security: Common Zod schemas for input validation.
 * Enforces strict typing and formats.
 */

export const emailSchema = z.string().email().min(5).max(255);
export const passwordSchema = z.string().min(8).max(100); // Reasonable limits
export const uuidSchema = z.string().uuid();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Sentinel Security: Blind Error Handling.
 * Logs detailed technical errors internally but returns sanitized
 * responses to the client to prevent information leakage.
 */
export function handleApiError(error: unknown) {
  // 1. Log the full error for internal debugging (Cloud logs)
  console.error('[Sentinel Deep Audit] API Error:', error);

  // 2. Handle Zod Validation Errors (Client fault)
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation Error',
        details: error.issues.map((e: z.ZodIssue) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      },
      { status: 400 }
    );
  }

  // 3. Handle known application errors (optional - extend as needed)
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json(
      { error: 'Unauthorized Access' },
      { status: 401 }
    );
  }

  // 4. Fallback: Blind "Internal Server Error" (Server fault)
  // Never expose stack traces or DB error messages to the client.
  return NextResponse.json(
    {
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR', // reliable reference without details
      requestId: crypto.randomUUID() // Trace ID
    },
    { status: 500 }
  );
}

/**
 * Sentinel Security: Input Sanitization
 * Basic utility to trim strings and remove null bytes.
 * Use alongside Zod.
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\0/g, '');
}
