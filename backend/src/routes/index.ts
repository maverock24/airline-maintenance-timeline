
import { Router } from 'express';
import { getFlights } from '../controllers/flightController';
import { getWorkPackages } from '../controllers/workPackageController';
import db from '../services/database';

const router = Router();

// Health check endpoint with database connectivity test
router.get('/health', (req, res) => {
  // Test database connectivity
  db.get('SELECT 1 as test', [], (err, row) => {
    if (err) {
      console.error('Health check database error:', err);
      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        error: 'Database connection failed'
      });
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  });
});

// Data endpoints
router.get('/flights', getFlights);
router.get('/work-packages', getWorkPackages);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `Route ${req.originalUrl} not found`,
    path: req.originalUrl,
    method: req.method
  });
});

export default router;
