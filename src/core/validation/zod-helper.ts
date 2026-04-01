import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { Result } from '@core/shared/Result';
import { AppError } from '@core/shared/AppError';

export function validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): Result<T, AppError> {
    const result = schema.safeParse(data);

    if (result.success) {
        return Result.ok(result.data);
    }

    const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
    }));

    return Result.fail(
        AppError.validation('Validation failed', formattedErrors as any)
    );
}

const sanitizeOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {
        'a': ['href']
    }
};

// Reusable Schemas
export const commonSchemas = {
    nonEmptyString: z.string().trim().min(1, 'Required field').transform(val => sanitizeHtml(val, sanitizeOptions)),
    uuid: z.string().uuid('Invalid UUID'),
    pagination: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    })
};
