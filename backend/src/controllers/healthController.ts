import { Request, Response } from 'express';
import { loggers } from '../utils/logger';
import { HealthStatus } from '../types/api';
import db from '../services/database';

export const getHealthStatus = (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    loggers.business.info('Health check request', {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Check database connectivity
    db.get('SELECT 1 as test', (err, _row) => {
      const duration = Date.now() - startTime;

      if (err) {
        loggers.database.error('Health check database query failed', err, {
          requestId: req.requestId,
          duration,
        });

        const healthStatus: HealthStatus = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'disconnected',
          error: 'Database connection failed',
        };

        loggers.business.warn(
          'Health check failed',
          'Database connectivity issue',
          {
            requestId: req.requestId,
            status: healthStatus,
            duration: `${duration}ms`,
          }
        );

        return res.status(503).json(healthStatus);
      }

      const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
      };

      loggers.database.query('SELECT', 'health_check', duration, {
        requestId: req.requestId,
        result: 'success',
      });

      loggers.business.info('Health check completed', {
        requestId: req.requestId,
        status: 'healthy',
        duration: `${duration}ms`,
        uptime: `${process.uptime()}s`,
      });

      res.status(200).json(healthStatus);
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    loggers.business.error('Health check failed', error as Error, {
      requestId: req.requestId,
      duration: `${duration}ms`,
    });

    const healthStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: 'Health check failed',
    };

    res.status(503).json(healthStatus);
  }
};
