import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import catchErrorFunction from '@utils/catch-error-function';
import { verifyOptions } from '@utils/sign-verify-token-options';

import { JWT_PRIVATE_KEY } from '@config/index';

export default (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies['Authorization'];

  if (!token) {
    const error = {
      statusCode: 401,
      message:
        'Nenhum token informado! Realize o login para adquirir token de autenticação.',
    };

    throw error;
  }

  const format = token.split(' ');
  const doNotStartWithBearer = Boolean(format[0] !== 'Bearer');

  if (doNotStartWithBearer) {
    const error = {
      statusCode: 401,
      message:
        'Token com formato inválido! Realize o login para adquirir token de autenticação em formato válido.',
    };

    throw error;
  }

  const extractedToken = format[1];

  try {
    jwt.verify(
      extractedToken,
      JWT_PRIVATE_KEY,
      verifyOptions,
      (err: any, decoded: any) => {
        if (err) {
          res.clearCookie('Authorization');

          const error = {
            statusCode: 401,
            message:
              'Token inválido! Realize o login para obter token válido e acessar esta rota.',
          };

          throw error;
        }

        res.locals.userId = decoded.userId;

        next();
      },
    );
  } catch (error) {
    catchErrorFunction(error, next);
  }
};
