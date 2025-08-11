
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

const app = express();
const port = process.env.PORT || 3001;

// Add request ID and timing middleware first
app.use(requestIdMiddleware);
app.use(performanceMonitoringMiddleware);

// HTTP request logging
app.use(httpLoggingMiddleware);

// Standard middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request/Response logging middleware
app.use(requestResponseLoggingMiddleware);

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  loggers.api.request('GET', '/', req.ip || 'unknown');
  res.json({ 
    message: 'Airline Maintenance Timeline API',
    version: '1.0.0',
    endpoints: {
      flights: '/api/flights',
      workPackages: '/api/work-packages',
      health: '/api/health',
      docs: '/api-docs'
    },
    requestId: req.requestId
  });
});

// Error logging middleware (before global error handler)
app.use(errorLoggingMiddleware);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  loggers.app.error(err, 'Global error handler');
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    requestId: req.requestId
  });
});

// 404 handler
app.use((req, res) => {
  loggers.api.request(req.method, req.originalUrl, req.ip || 'unknown');
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    requestId: req.requestId
  });
});

const server = app.listen(port, () => {
  loggers.app.startup(Number(port), process.env.NODE_ENV || 'development');
});

// Handle server startup errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    loggers.app.error(error, `Port ${port} is already in use`);
    process.exit(1);
  } else {
    loggers.app.error(error, 'Server startup error');
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  loggers.app.error(error, 'Uncaught Exception');
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise: promise.toString(),
    component: 'app'
  });
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  loggers.app.shutdown('SIGTERM received');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  loggers.app.shutdown('SIGINT received');
  server.close(() => {
    process.exit(0);
  });
});
