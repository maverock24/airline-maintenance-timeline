
import { Router } from 'express';
import { getFlights } from '../controllers/flightController';
import { getWorkPackages } from '../controllers/workPackageController';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Data endpoints
router.get('/flights', getFlights);
router.get('/work-packages', getWorkPackages);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

export default router;
