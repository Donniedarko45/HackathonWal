import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Prisma specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return res.status(400).json({
          error: 'Unique constraint violation',
          details: error.meta?.target
        });
      case 'P2025':
        return res.status(404).json({
          error: 'Record not found'
        });
      default:
        return res.status(400).json({
          error: 'Database error',
          code: error.code
        });
    }
  }

  // Validation errors
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: error
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  // Default error
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
}; 