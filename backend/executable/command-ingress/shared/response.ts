import { ValidationError } from 'class-validator';
import { Response } from 'express';

const responseValidationError = (res: Response, error: ValidationError) => {
  const message = Object.values(error.constraints || {}).join(', ');

  res.status(400).json({
    status: "Failed",
    error: 'err_validation',
    message: message,
  });
};

export default responseValidationError;