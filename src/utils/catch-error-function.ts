import { NextFunction } from 'express';

export default (error: any, next: NextFunction) => {
  if (error.errors?.length > 0) {
    console.log(error);
    const message = error.errors[0];

    error = {
      message,
      statusCode: 403,
    };

    next(error);

    return;
  }

  next(error);

  return;
};
