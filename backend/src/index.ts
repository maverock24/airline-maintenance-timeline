
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Airline Maintenance Timeline API',
    version: '1.0.0',
    endpoints: {
      flights: '/api/flights',
      workPackages: '/api/work-packages'
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
