import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import logger, { loggers, morganStream } from '../utils/logger';
import { LOGGING_CONFIG, SERVER_CONFIG, API_ROUTES } from '../utils/constants';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req: Request, res: Response) => {
  if (!req.startTime) return '0';
  return `${Date.now() - req.startTime}ms`;
});

morgan.token('request-id', (req: Request) => {
  return req.requestId || 'unknown';
});

morgan.token('user-agent', (req: Request) => {
  return req.get('User-Agent') || 'unknown';
});

const detailedFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms :request-id';

export const httpLoggingMiddleware = morgan(detailedFormat, {
  stream: morganStream,
  skip: (req: Request, res: Response) => {
    // Skip logging for health checks in production
    return process.env.NODE_ENV === SERVER_CONFIG.ENVIRONMENTS.PRODUCTION && 
           req.url === API_ROUTES.FULL_PATHS.HEALTH;
  }
});

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = generateRequestId();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

export const requestResponseLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log incoming request
  loggers.api.request(
    req.method,
    req.originalUrl,
    req.ip || req.connection.remoteAddress || 'unknown',
    req.get('User-Agent')
  );
  
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    loggers.api.response(req.method, req.originalUrl, res.statusCode, duration);
    
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Response details', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseSize: typeof body === 'string' ? body.length : JSON.stringify(body).length,
        duration: `${duration}ms`,
        component: 'api'
      });
    }
    
    return originalSend.call(this, body);
  };
  
  res.json = function(obj: any) {
    const duration = Date.now() - startTime;
    loggers.api.response(req.method, req.originalUrl, res.statusCode, duration);
    
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('JSON response details', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseSize: JSON.stringify(obj).length,
        duration: `${duration}ms`,
        component: 'api'
      });
    }
    
    return originalJson.call(this, obj);
  };
  
  next();
};

export const errorLoggingMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  loggers.api.error(req.method, req.originalUrl, err, res.statusCode);
  
  if (process.env.LOG_LEVEL === LOGGING_CONFIG.LEVELS.DEBUG) {
    logger.debug('Error context', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      component: 'api'
    });
  }
  
  next(err);
};

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const performanceMonitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > LOGGING_CONFIG.PERFORMANCE.SLOW_REQUEST_THRESHOLD) { // Log requests taking more than threshold
      logger.warn('Slow request detected', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        component: 'performance'
      });
    }
    
    // Log very detailed performance metrics in debug mode
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Request performance', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
        memoryUsage: process.memoryUsage(),
        component: 'performance'
      });
    }
  });
  
  next();
};

export default {
  httpLoggingMiddleware,
  requestIdMiddleware,
  requestResponseLoggingMiddleware,
  errorLoggingMiddleware,
  performanceMonitoringMiddleware
};
