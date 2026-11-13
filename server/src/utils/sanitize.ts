import { z } from 'zod';

/**
 * Strips HTML tags, null bytes, and trims whitespace to prevent Stored XSS and injection.
 */
export function sanitizeString(val: string): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/\0/g, '') // Remove null bytes
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .trim();
}

/**
 * Reusable Zod schema for sanitized text input with length constraints.
 */
export const sanitizedString = (min = 1, max = 255) =>
  z
    .string()
    .trim()
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must not exceed ${max} characters`)
    .transform(sanitizeString);

/**
 * Optional sanitized string schema.
 */
export const optionalSanitizedString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Must not exceed ${max} characters`)
    .optional()
    .transform((val) => (val ? sanitizeString(val) : undefined));

