import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../routes';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRoutes);
  return app;
};

describe('Flight Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/flights', () => {
    it('should return flights with 200 status', async () => {
      const response = await request(app)
        .get('/api/flights')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const flight = response.body[0];
        expect(flight).toHaveProperty('flightId');
        expect(flight).toHaveProperty('flightNum');
        expect(flight).toHaveProperty('registration');
        expect(flight).toHaveProperty('schedDepStation');
        expect(flight).toHaveProperty('schedArrStation');
        expect(flight).toHaveProperty('schedDepTime');
        expect(flight).toHaveProperty('schedArrTime');
      }
    });

    it('should return flights in ascending order of departure time', async () => {
      const response = await request(app)
        .get('/api/flights')
        .expect(200);

      if (response.body.length > 1) {
        const flights = response.body;
        for (let i = 1; i < flights.length; i++) {
          const prevTime = new Date(flights[i - 1].schedDepTime);
          const currTime = new Date(flights[i].schedDepTime);
          expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
        }
      }
    });
  });
});

describe('Work Package Controller', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/work-packages', () => {
    it('should return work packages with 200 status', async () => {
      const response = await request(app)
        .get('/api/work-packages')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const workPackage = response.body[0];
        expect(workPackage).toHaveProperty('workPackageId');
        expect(workPackage).toHaveProperty('name');
        expect(workPackage).toHaveProperty('registration');
        expect(workPackage).toHaveProperty('startDateTime');
        expect(workPackage).toHaveProperty('endDateTime');
        expect(workPackage).toHaveProperty('workOrders');
        expect(workPackage).toHaveProperty('status');
      }
    });

    it('should return work packages in ascending order of start time', async () => {
      const response = await request(app)
        .get('/api/work-packages')
        .expect(200);

      if (response.body.length > 1) {
        const workPackages = response.body;
        for (let i = 1; i < workPackages.length; i++) {
          const prevTime = new Date(workPackages[i - 1].startDateTime);
          const currTime = new Date(workPackages[i].startDateTime);
          expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime());
        }
      }
    });

    it('should return work packages with valid status values', async () => {
      const response = await request(app)
        .get('/api/work-packages')
        .expect(200);

      const validStatuses = ['OPEN', 'In Progress', 'Completed', 'Cancelled'];
      
      response.body.forEach((workPackage: any) => {
        expect(validStatuses).toContain(workPackage.status);
      });
    });
  });
});

describe('API Error Handling', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should return 404 for non-existent endpoints', async () => {
    await request(app)
      .get('/api/non-existent')
      .expect(404);
  });

  it('should handle invalid limit parameter in flights endpoint', async () => {
    const response = await request(app)
      .get('/api/flights?limit=invalid')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Bad Request');
    expect(response.body).toHaveProperty('message', 'Limit parameter must be a positive number');
  });

  it('should handle negative limit parameter in flights endpoint', async () => {
    const response = await request(app)
      .get('/api/flights?limit=-5')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Bad Request');
    expect(response.body).toHaveProperty('message', 'Limit parameter must be a positive number');
  });

  it('should handle invalid limit parameter in work packages endpoint', async () => {
    const response = await request(app)
      .get('/api/work-packages?limit=invalid')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Bad Request');
    expect(response.body).toHaveProperty('message', 'Limit parameter must be a positive number');
  });

  it('should filter flights by registration parameter', async () => {
    const response = await request(app)
      .get('/api/flights?registration=ABC')
      .expect(200);

    if (response.body.length > 0) {
      response.body.forEach((flight: any) => {
        expect(flight.registration).toBe('ABC');
      });
    }
  });

  it('should filter work packages by registration parameter', async () => {
    const response = await request(app)
      .get('/api/work-packages?registration=ABC')
      .expect(200);

    if (response.body.length > 0) {
      response.body.forEach((workPackage: any) => {
        expect(workPackage.registration).toBe('ABC');
      });
    }
  });

  it('should filter work packages by status parameter', async () => {
    const response = await request(app)
      .get('/api/work-packages?status=Completed')
      .expect(200);

    if (response.body.length > 0) {
      response.body.forEach((workPackage: any) => {
        expect(workPackage.status).toBe('Completed');
      });
    }
  });

  it('should limit results with limit parameter', async () => {
    const response = await request(app)
      .get('/api/flights?limit=1')
      .expect(200);

    expect(response.body.length).toBeLessThanOrEqual(1);
  });
});

describe('Health Check', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should return health status with database connectivity', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('database', 'connected');
  });
});
