/**
 * API Request Validator
 * Zod-based request body parsing for API routes.
 * Provides consistent error responses when validation fails.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

interface ValidationResult<T> {
    success: true;
    data: T;
}

interface ValidationError {
    success: false;
    response: NextResponse;
}

/**
 * Parses and validates the JSON body of an API request against a Zod schema.
 *
 * @example
 * ```ts
 * const result = await validateRequestBody(request, myZodSchema);
 * if (!result.success) return result.response; // 400 with validation errors
 * const { data } = result; // fully typed
 * ```
 */
export async function validateRequestBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<ValidationResult<T> | ValidationError> {
    try {
        const rawBody = await request.json();
        const parsed = schema.parse(rawBody);
        return { success: true, data: parsed };
    } catch (error) {
        if (error instanceof ZodError) {
            const fieldErrors = error.issues.map((e) => ({
                field: String(e.path.join('.')),
                message: e.message,
                code: String(e.code),
            }));

            return {
                success: false,
                response: NextResponse.json(
                    {
                        error: 'Validation Error',
                        message: 'Invalid request body',
                        fieldErrors,
                    },
                    { status: 400 }
                ),
            };
        }

        // JSON parse error
        return {
            success: false,
            response: NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Invalid JSON body',
                },
                { status: 400 }
            ),
        };
    }
}
