import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Translates known Prisma errors into HTTP responses so services don't need
 * to check uniqueness or existence before every write.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const fields = this.uniqueFields(exception);
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: `${fields} already in use`,
          error: 'Conflict',
        });
        return;
      }
      case 'P2025':
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        });
        return;
      default:
        super.catch(exception, host);
    }
  }

  private uniqueFields(exception: Prisma.PrismaClientKnownRequestError) {
    const target = exception.meta?.target;
    if (Array.isArray(target)) return target.join(', ');
    if (typeof target === 'string') return target;
    return 'Value';
  }
}
