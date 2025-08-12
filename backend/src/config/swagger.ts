import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import * as fs from 'fs';
import * as path from 'path';

let swaggerSpec: Record<string, unknown>;

// Load the generated OpenAPI spec
try {
  const specPath = path.resolve(__dirname, '../../swagger.json');
  if (fs.existsSync(specPath)) {
    swaggerSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } else {
    // Fallback minimal spec if generated one doesn't exist
    swaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Airline Maintenance Timeline API',
        version: '1.0.0',
        description: 'API for managing airline maintenance timeline data',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      paths: {},
    };
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn('Failed to load swagger.json, using minimal spec:', error);
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Airline Maintenance Timeline API',
      version: '1.0.0',
      description: 'API for managing airline maintenance timeline data',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    paths: {},
  };
}

export const setupSwagger = (app: Express): void => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Airline Maintenance Timeline API',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
      },
    })
  );

  // Serve the raw OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export { swaggerSpec };
