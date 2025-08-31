/* eslint-disable @typescript-eslint/no-explicit-any */
import { TErrorSources, TGenericErrorResponse } from '../interface/error';

const handleDuplicateError = (err: any): TGenericErrorResponse => {
  const statusCode = 400;

  const fields = Object.keys(err?.keyValue || {});
  const duplicateValue = Object.values(err?.keyValue || {})[0];

  const errorSources: TErrorSources = [
    {
      path: fields[0] || '',
      message: `${duplicateValue} already exists!`,
    },
  ];

  return {
    statusCode,
    message: 'Duplicate Key Error',
    errorSources,
  };
};

export default handleDuplicateError;
