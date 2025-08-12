import { Router } from 'express';
import { getFlights } from '../controllers/flightController';
import { getWorkPackages } from '../controllers/workPackageController';
import { getHealthStatus } from '../controllers/healthController';

const router = Router();

router.get('/health', getHealthStatus);

router.get('/flights', getFlights);
router.get('/work-packages', getWorkPackages);

router.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `Route ${req.originalUrl} not found`,
    path: req.originalUrl,
    method: req.method,
  });
});

export default router;
