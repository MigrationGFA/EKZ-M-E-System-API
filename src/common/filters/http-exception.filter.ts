import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as {
          message?: string | string[];
        };
        message =
          typeof res.message === 'string' ? res.message : exception.message;

        // Handle class-validator errors from ValidationPipe
        if (Array.isArray(res.message)) {
          const fieldErrors: Record<string, string[]> = {};
          for (const msg of res.message) {
            const field = String(msg).split(' ')[0] ?? 'unknown';
            if (!fieldErrors[field]) fieldErrors[field] = [];
            fieldErrors[field].push(String(msg));
          }
          errors = fieldErrors;
          message = 'Validation failed';
        }
      }
    }

    const body: { message: string; errors?: Record<string, string[]> } = {
      message,
    };
    if (errors) body.errors = errors;

    response.status(status).json(body);
  }
}
