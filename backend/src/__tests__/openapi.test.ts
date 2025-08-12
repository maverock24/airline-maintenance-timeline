import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from '../routes';
import { setupSwagger } from '../config/swagger';
import * as fs from 'fs';
import * as path from 'path';

// Create test app with Swagger
const createTestAppWithSwagger = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  setupSwagger(app);

  app.use('/api', apiRoutes);
  return app;
};

describe('OpenAPI Specification Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestAppWithSwagger();
  });

  describe('OpenAPI Spec Generation', () => {
    it('should generate a valid OpenAPI 3.0 specification', () => {
      const specPath = path.resolve(__dirname, '../../swagger.json');

      expect(fs.existsSync(specPath)).toBe(true);

      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

      // Validate basic OpenAPI structure
      expect(spec).toHaveProperty('openapi', '3.0.0');
      expect(spec).toHaveProperty('info');
      expect(spec).toHaveProperty('paths');
      expect(spec).toHaveProperty('components');
      expect(spec).toHaveProperty('components.schemas');
    });

    it('should include all required schemas', () => {
      const specPath = path.resolve(__dirname, '../../swagger.json');
      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

      const requiredSchemas = [
        'Flight',
        'WorkPackage',
        'HealthStatus',
        'ApiError',
      ];

      requiredSchemas.forEach((schema) => {
        expect(spec.components.schemas).toHaveProperty(schema);
      });
    });

    it('should include all API endpoints', () => {
      const specPath = path.resolve(__dirname, '../../swagger.json');
      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

      const requiredPaths = [
        '/api/health',
        '/api/flights',
        '/api/work-packages',
      ];

      requiredPaths.forEach((path) => {
        expect(spec.paths).toHaveProperty(path);
      });
    });
  });

  describe('OpenAPI Spec Validation Against Live API', () => {
    it('should serve OpenAPI spec at /api-docs.json', async () => {
      const response = await request(app)
        .get('/api-docs.json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });

    it('should serve Swagger UI at /api-docs', async () => {
      const response = await request(app)
        .get('/api-docs/')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(response.text).toContain('swagger-ui');
    });

    it('should validate Flight schema against actual API response', async () => {
      const response = await request(app).get('/api/flights').expect(200);

      if (response.body.length > 0) {
        const flight = response.body[0];

        // Validate against Flight schema properties
        expect(flight).toHaveProperty('flightId');
        expect(flight).toHaveProperty('flightNum');
        expect(flight).toHaveProperty('registration');
        expect(flight).toHaveProperty('schedDepStation');
        expect(flight).toHaveProperty('schedArrStation');
        expect(flight).toHaveProperty('schedDepTime');
        expect(flight).toHaveProperty('schedArrTime');

        // Validate data types
        expect(typeof flight.flightId).toBe('number');
        expect(typeof flight.flightNum).toBe('string');
        expect(typeof flight.registration).toBe('string');
        expect(typeof flight.schedDepStation).toBe('string');
        expect(typeof flight.schedArrStation).toBe('string');
        expect(typeof flight.schedDepTime).toBe('string');
        expect(typeof flight.schedArrTime).toBe('string');
      }
    });

    it('should validate WorkPackage schema against actual API response', async () => {
      const response = await request(app).get('/api/work-packages').expect(200);

      if (response.body.length > 0) {
        const workPackage = response.body[0];

        // Validate against WorkPackage schema properties
        expect(workPackage).toHaveProperty('workPackageId');
        expect(workPackage).toHaveProperty('name');
        expect(workPackage).toHaveProperty('registration');
        expect(workPackage).toHaveProperty('startDateTime');
        expect(workPackage).toHaveProperty('endDateTime');
        expect(workPackage).toHaveProperty('workOrders');
        expect(workPackage).toHaveProperty('status');

        // Validate data types
        expect(typeof workPackage.workPackageId).toBe('number');
        expect(typeof workPackage.name).toBe('string');
        expect(typeof workPackage.registration).toBe('string');
        expect(typeof workPackage.startDateTime).toBe('string');
        expect(typeof workPackage.endDateTime).toBe('string');
        expect(typeof workPackage.workOrders).toBe('number');
        expect(typeof workPackage.status).toBe('string');

        // Validate status enum
        const validStatuses = ['OPEN', 'In Progress', 'Completed', 'Cancelled'];
        expect(validStatuses).toContain(workPackage.status);
      }
    });

    it('should validate HealthStatus schema against actual API response', async () => {
      const response = await request(app).get('/api/health').expect(200);

      const healthStatus = response.body;

      // Validate against HealthStatus schema properties
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('uptime');
      expect(healthStatus).toHaveProperty('database');

      // Validate data types
      expect(typeof healthStatus.status).toBe('string');
      expect(typeof healthStatus.timestamp).toBe('string');
      expect(typeof healthStatus.uptime).toBe('number');
      expect(typeof healthStatus.database).toBe('string');

      // Validate enum values
      expect(['healthy', 'unhealthy']).toContain(healthStatus.status);
      expect(['connected', 'disconnected']).toContain(healthStatus.database);

      // Validate ISO 8601 timestamp format
      expect(() => new Date(healthStatus.timestamp)).not.toThrow();
    });

    it('should validate error responses match ApiError schema', async () => {
      const response = await request(app)
        .get('/api/flights?limit=invalid')
        .expect(400);

      const error = response.body;

      // Validate against ApiError schema properties
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');

      // Validate data types
      expect(typeof error.error).toBe('string');
      expect(typeof error.message).toBe('string');
    });

    it('should validate 404 responses match NotFoundError schema', async () => {
      const response = await request(app).get('/api/non-existent').expect(404);

      const error = response.body;

      // Validate against NotFoundError schema properties (extends ApiError)
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('path');
      expect(error).toHaveProperty('method');

      // Validate data types
      expect(typeof error.error).toBe('string');
      expect(typeof error.message).toBe('string');
      expect(typeof error.path).toBe('string');
      expect(typeof error.method).toBe('string');
    });
  });

  describe('OpenAPI Query Parameters Validation', () => {
    it('should validate flights endpoint query parameters', async () => {
      // Test valid registration parameter
      await request(app).get('/api/flights?registration=ABC').expect(200);

      // Test valid limit parameter
      await request(app).get('/api/flights?limit=5').expect(200);

      // Test invalid limit parameter
      await request(app).get('/api/flights?limit=-1').expect(400);

      // Test invalid limit parameter (non-numeric)
      await request(app).get('/api/flights?limit=abc').expect(400);
    });

    it('should validate work-packages endpoint query parameters', async () => {
      // Test valid registration parameter
      await request(app).get('/api/work-packages?registration=ABC').expect(200);

      // Test valid status parameter
      await request(app).get('/api/work-packages?status=Completed').expect(200);

      // Test valid limit parameter
      await request(app).get('/api/work-packages?limit=3').expect(200);

      // Test invalid limit parameter
      await request(app).get('/api/work-packages?limit=-1').expect(400);
    });
  });
});
