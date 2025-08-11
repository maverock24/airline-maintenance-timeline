import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LOGGING_CONFIG, SERVER_CONFIG, SWAGGER_CONFIG } from './constants';
import path from 'path';

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Define the custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: LOGGING_CONFIG.FILE_TIMESTAMP_FORMAT }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` | ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: LOGGING_CONFIG.CONSOLE_TIMESTAMP_FORMAT }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../logs');

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || LOGGING_CONFIG.LEVELS.INFO,
  levels: logLevels,
  format: customFormat,
  defaultMeta: { 
    service: 'airline-maintenance-api',
    version: SWAGGER_CONFIG.INFO.VERSION
  },
  transports: [
    // Error log file (only errors)
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: LOGGING_CONFIG.ROTATION.DATE_PATTERN,
      level: LOGGING_CONFIG.LEVELS.ERROR,
      maxSize: LOGGING_CONFIG.ROTATION.MAX_SIZE,
      maxFiles: LOGGING_CONFIG.ROTATION.MAX_FILES,
      zippedArchive: true,
    }),
    
    // Combined log file (all levels)
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: LOGGING_CONFIG.ROTATION.DATE_PATTERN,
      maxSize: LOGGING_CONFIG.ROTATION.MAX_SIZE,
      maxFiles: LOGGING_CONFIG.ROTATION.MAX_FILES,
      zippedArchive: true,
    }),
    
    // HTTP requests log
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: LOGGING_CONFIG.ROTATION.DATE_PATTERN,
      level: LOGGING_CONFIG.LEVELS.HTTP,
      maxSize: LOGGING_CONFIG.ROTATION.MAX_SIZE,
      maxFiles: LOGGING_CONFIG.ROTATION.MAX_FILES,
      zippedArchive: true,
    }),
  ],
  
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
  
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug',
  }));
}

export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const loggers = {
  // Database operations
  database: {
    connection: (status: 'connected' | 'disconnected' | 'error', details?: any) => {
      logger.info('Database connection status', { 
        status, 
        details,
        component: 'database'
      });
    },
    query: (operation: string, table: string, duration?: number, details?: any) => {
      logger.debug('Database query executed', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        details,
        component: 'database'
      });
    },
    error: (operation: string, error: any, context?: any) => {
      logger.error('Database operation failed', {
        operation,
        error: error.message,
        stack: error.stack,
        context,
        component: 'database'
      });
    }
  },
  
  // API requests
  api: {
    request: (method: string, url: string, ip: string, userAgent?: string) => {
      logger.http('API request received', {
        method,
        url,
        ip,
        userAgent,
        component: 'api'
      });
    },
    response: (method: string, url: string, statusCode: number, duration: number) => {
      logger.http('API response sent', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        component: 'api'
      });
    },
    error: (method: string, url: string, error: any, statusCode?: number) => {
      logger.error('API request failed', {
        method,
        url,
        error: error.message,
        statusCode,
        stack: error.stack,
        component: 'api'
      });
    }
  },
  
  // Application lifecycle
  app: {
    startup: (port: number, environment: string) => {
      logger.info('Application started', {
        port,
        environment,
        timestamp: new Date().toISOString(),
        component: 'app'
      });
    },
    shutdown: (reason: string, exitCode?: number) => {
      logger.info('Application shutdown initiated', {
        reason,
        exitCode,
        timestamp: new Date().toISOString(),
        component: 'app'
      });
    },
    error: (error: any, context?: string) => {
      logger.error('Application error', {
        error: error.message,
        stack: error.stack,
        context,
        component: 'app'
      });
    }
  },
  
  // Business logic
  business: {
    info: (operation: string, details: any) => {
      logger.info(`Business operation: ${operation}`, {
        ...details,
        component: 'business'
      });
    },
    warn: (operation: string, warning: string, details?: any) => {
      logger.warn(`Business warning: ${operation}`, {
        warning,
        details,
        component: 'business'
      });
    },
    error: (operation: string, error: any, details?: any) => {
      logger.error(`Business operation failed: ${operation}`, {
        error: error.message,
        details,
        component: 'business'
      });
    }
  }
};

export default logger;
