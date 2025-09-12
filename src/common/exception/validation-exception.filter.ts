import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    
    // Handle validation errors
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const errorObj = exceptionResponse as any;
      
      // If it's a validation error from class-validator
      if (errorObj.message && Array.isArray(errorObj.message)) {
        const validationErrors = errorObj.message;
        
        // Check for max length validation specifically
        const maxLengthError = validationErrors.find((error: string) => 
          error.includes('must be shorter than or equal to') || 
          error.includes('maxLength')
        );
        
        if (maxLengthError) {
          return response.status(status).json({
            statusCode: status,
            message: 'Task template name cannot exceed 100 characters',
            error: 'Bad Request',
          });
        }
        
        // Return the first validation error message
        return response.status(status).json({
          statusCode: status,
          message: validationErrors[0] || 'Validation failed',
          error: 'Bad Request',
        });
      }
      
      // If it's already a formatted error message
      if (errorObj.message && typeof errorObj.message === 'string') {
        return response.status(status).json({
          statusCode: status,
          message: errorObj.message,
          error: 'Bad Request',
        });
      }
    }

    // Fallback to default error format
    response.status(status).json({
      statusCode: status,
      message: 'Validation failed',
      error: 'Bad Request',
    });
  }
}
