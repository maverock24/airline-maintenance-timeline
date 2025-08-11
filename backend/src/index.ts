
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { setupSwagger } from './config/swagger';
import logger, { loggers } from './utils/logger';
import {
  httpLoggingMiddleware,
  requestIdMiddleware,
  requestResponseLoggingMiddleware,
  errorLoggingMiddleware,
  performanceMonitoringMiddleware
} from './middleware/logging';
import { 
  SERVER_CONFIG, 
  HTTP_STATUS, 
  API_ROUTES,
  ERROR_MESSAGES,
  EXIT_CODES,
  SWAGGER_CONFIG
} from './utils/constants';

const app = express();
const port = process.env.PORT || SERVER_CONFIG.DEFAULT_PORT;

app.use(requestIdMiddleware);
app.use(performanceMonitoringMiddleware);
app.use(httpLoggingMiddleware);

app.use(cors());
app.use(express.json({ limit: SERVER_CONFIG.JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: SERVER_CONFIG.URL_ENCODED_LIMIT }));

app.use(requestResponseLoggingMiddleware);

setupSwagger(app);

app.use(API_ROUTES.BASE, apiRoutes);

app.get('/', (req, res) => {
  loggers.api.request('GET', '/', req.ip || 'unknown');
  res.json({ 
    message: SWAGGER_CONFIG.INFO.DESCRIPTION,
    version: SWAGGER_CONFIG.INFO.VERSION,
    endpoints: {
      flights: API_ROUTES.FULL_PATHS.FLIGHTS,
      workPackages: API_ROUTES.FULL_PATHS.WORK_PACKAGES,
      health: API_ROUTES.FULL_PATHS.HEALTH,
      docs: SWAGGER_CONFIG.DOCS_PATH
    },
    requestId: req.requestId
  });
});

app.use(errorLoggingMiddleware);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  loggers.app.error(err, 'Global error handler');
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === SERVER_CONFIG.ENVIRONMENTS.DEVELOPMENT ? 
      err.message : ERROR_MESSAGES.SOMETHING_WENT_WRONG,
    requestId: req.requestId
  });
});

app.use((req, res) => {
  loggers.api.request(req.method, req.originalUrl, req.ip || 'unknown');
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: ERROR_MESSAGES.NOT_FOUND,
    message: ERROR_MESSAGES.ROUTE_NOT_FOUND(req.originalUrl),
    requestId: req.requestId
  });
});

const server = app.listen(port, () => {
  loggers.app.startup(Number(port), process.env.NODE_ENV || 'development');
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    loggers.app.error(error, ERROR_MESSAGES.PORT_IN_USE(Number(port)));
    process.exit(EXIT_CODES.GENERAL_ERROR);
  } else {
    loggers.app.error(error, ERROR_MESSAGES.SERVER_STARTUP_ERROR);
    process.exit(EXIT_CODES.GENERAL_ERROR);
  }
});

process.on('uncaughtException', (error) => {
  loggers.app.error(error, 'Uncaught Exception');
  server.close(() => {
    process.exit(EXIT_CODES.GENERAL_ERROR);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise: promise.toString(),
    component: 'app'
  });
  server.close(() => {
    process.exit(EXIT_CODES.GENERAL_ERROR);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  loggers.app.shutdown('SIGTERM received');
  server.close(() => {
    process.exit(EXIT_CODES.SUCCESS);
  });
});

process.on('SIGINT', () => {
  loggers.app.shutdown('SIGINT received');
  server.close(() => {
    process.exit(EXIT_CODES.SUCCESS);
  });
});
