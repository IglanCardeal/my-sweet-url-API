import { Request, Response, NextFunction } from 'express';

import { rateLimiterMessager } from '@utils/index';
import { rateLimiterStoreConfig } from '@database/redis/redis-connection';

const maxAttemptsByIPperDay = 50;
const oneDay = 60 * 60 * 24;

const rateLimitConfigPublicSlowBruteByIp = {
  maxWrongAttemps: maxAttemptsByIPperDay,
  keyPrefix: 'public_slow_brute_force_fail_ip_per_day',
  durationSeconds: oneDay,
  blockDurationSeconds: oneDay,
};
const limiterPublicSlowBruteByIP = rateLimiterStoreConfig(
  rateLimitConfigPublicSlowBruteByIp,
);

export default async function publicRequestApiLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const originIpAddress = req.ip;
    const resSlowByIP = await limiterPublicSlowBruteByIP.get(originIpAddress);

    const blockedIp = Boolean(
      resSlowByIP !== null &&
        resSlowByIP.consumedPoints > maxAttemptsByIPperDay,
    );

    const reason = 'Bloqueado por limite de requisições por endereço IP.';
    let retrySeconds = 0;

    if (blockedIp) {
      retrySeconds = Math.round(resSlowByIP!.msBeforeNext / 1000) || 1;
    }

    if (retrySeconds > 0) {
      console.log(
        `O consumo máximo da API foi atingido (${maxAttemptsByIPperDay} acessos máximos). Tente novamente em ${retrySeconds} segundos.`,
      );

      const responseObject = {
        res,
        message: `O consumo máximo da API foi atingido (${maxAttemptsByIPperDay} acessos máximos). Tente novamente em ${retrySeconds} segundos.`,
        retrySeconds,
        reason,
      };

      rateLimiterMessager(responseObject);

      return;
    }

    try {
      await limiterPublicSlowBruteByIP.consume(originIpAddress);

      next();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      console.log(error);

      const retrySeconds = Math.round(error.msBeforeNext / 1000) || 1;

      const responseObject = {
        res,
        message: `O consumo máximo da API foi atingido (${maxAttemptsByIPperDay} acessos máximos). Tente novamente em ${retrySeconds} segundos.`,
        retrySeconds,
        reason,
      };

      rateLimiterMessager(responseObject);

      return;
    }
  } catch (error) {
    console.log('Erro em API RATE para evitar ataque de forca bruta: ', error);

    next(error);
  }
}