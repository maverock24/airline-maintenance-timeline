
import { Router } from 'express';
import { getFlights } from '../controllers/flightController';
import { getWorkPackages } from '../controllers/workPackageController';
import { getHealthStatus } from '../controllers/healthController';

const router = Router();

// Health check endpoint with database connectivity test
router.get('/health', getHealthStatus);

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
