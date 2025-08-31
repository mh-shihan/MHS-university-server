/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodError } from 'zod/v4';
import AppError from './AppError';
import handleCastError from './handleCastError';
import handleDuplicateError from './handleDuplicateError';
import handleValidationError from './handleValidationError';
import handleZodError from './handleZodError';
import { TErrorSources, TGenericErrorResponse } from '../interface/error';

const handleAllTypesOfError = (err: any): TGenericErrorResponse => {
  let statusCode = 500;
  let message = 'Something went wrong!';

  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong!',
    },
  ];

  // Error Handling
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
    // console.log('---------------Zod Error ---------------------');
    /* ------------------------------------------*/
  } else if (err?.name === 'ValidationError') {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
    // console.log('--------------- Validate Error ---------------------');
    /* ------------------------------------------*/
  } else if (err?.name === 'CastError') {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
    // console.log('--------------- CastError Error ---------------------');
    /* ------------------------------------------*/
  } else if (err?.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorSources = simplifiedError?.errorSources;
    // console.log('---------------Duplicate Error 11000---------------------');
    /* ------------------------------------------*/
  } else if (err instanceof AppError) {
    statusCode = err?.statusCode;
    message = err?.message;
    errorSources = [
      {
        path: '',
        message: err?.message,
      },
    ];
    // console.log('--------------- AppError ---------------------');
  } else if (err instanceof Error) {
    message = err?.message;
    errorSources = [
      {
        path: '',
        message: message,
      },
    ];
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};

export default handleAllTypesOfError;
