import { NextResponse } from 'next/server';
import { AppError } from '@/core/shared/AppError';
import { Result } from '@/core/shared/Result';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any[];
  } | null;
  timestamp: string;
}

/**
 * Enterprise-Grade API Responder
 * Unifies all Next.js API responses, enforcing standard structure and error handling.
 */
export class ApiResponder {
  
  /**
   * Returns a 200 OK standard response.
   */
  static success<T>(data: T): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        error: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }

  /**
   * Returns a 201 Created standard response.
   */
  static created<T>(data: T): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        error: null,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  }

  /**
   * Translates an AppError into a standard HTTP error response.
   */
  static fromAppError(error: AppError): NextResponse<ApiResponse<null>> {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && process.env.NODE_ENV !== 'production' ? { details: error.details } : {})
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.httpStatus }
    );
  }

  /**
   * Automatically handles a Result object.
   * If success, returns 200 OK.
   * If failure, unwraps the AppError and returns the appropriate HTTP error.
   */
  static fromResult<T>(result: Result<T, AppError>): NextResponse<ApiResponse<T | null>> {
    if (result.isSuccess()) {
      return ApiResponder.success(result.getValue());
    } else {
      return ApiResponder.fromAppError(result.getError());
    }
  }

  /**
   * Generic error handler for catch blocks.
   */
  static fatal(error: unknown): NextResponse<ApiResponse<null>> {
    const appError = AppError.from(error);
    return ApiResponder.fromAppError(appError);
  }
}
