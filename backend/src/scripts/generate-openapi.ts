import * as TJS from 'typescript-json-schema';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Set up typescript-json-schema
const settings: TJS.PartialArgs = {
  required: true,
  noExtraProps: true,
  propOrder: false,
  typeOfKeyword: true,
  titles: true,
  defaultNumberType: 'number',
  strictNullChecks: true
};

const compilerOptions: TJS.CompilerOptions = {
  strictNullChecks: true
};

// Create the program and generator
const program = TJS.getProgramFromFiles(
  [path.resolve('./src/types/api.ts')],
  compilerOptions
);

const generator = TJS.buildGenerator(program, settings);

if (!generator) {
  throw new Error('Failed to create JSON schema generator');
}

// Generate schemas for all our types
const schemas = {
  Flight: generator.getSchemaForSymbol('Flight'),
  WorkPackage: generator.getSchemaForSymbol('WorkPackage'),
  HealthStatus: generator.getSchemaForSymbol('HealthStatus'),
  ApiError: generator.getSchemaForSymbol('ApiError'),
  NotFoundError: generator.getSchemaForSymbol('NotFoundError'),
  FlightQueryParams: generator.getSchemaForSymbol('FlightQueryParams'),
  WorkPackageQueryParams: generator.getSchemaForSymbol('WorkPackageQueryParams')
};

// Create the OpenAPI spec
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Airline Maintenance Timeline API',
    version: '1.0.0',
    description: 'A microservice for managing airline maintenance timeline data including flights and work packages',
    contact: {
      name: 'API Support',
      email: 'support@airline-maintenance.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.airline-maintenance.com',
      description: 'Production server'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Service health and monitoring endpoints'
    },
    {
      name: 'Flights',
      description: 'Flight data management'
    },
    {
      name: 'Work Packages',
      description: 'Work package data management'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Check service health status',
        description: 'Returns the health status of the service including database connectivity',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' },
                examples: {
                  healthy: {
                    summary: 'Healthy service',
                    value: {
                      status: 'healthy',
                      timestamp: '2025-08-12T10:00:00Z',
                      uptime: 3600.5,
                      database: 'connected'
                    }
                  }
                }
              }
            }
          },
          503: {
            description: 'Service is unhealthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthStatus' },
                examples: {
                  unhealthy: {
                    summary: 'Unhealthy service',
                    value: {
                      status: 'unhealthy',
                      timestamp: '2025-08-12T10:00:00Z',
                      uptime: 3600.5,
                      database: 'disconnected',
                      error: 'Database connection failed'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/flights': {
      get: {
        summary: 'Retrieve a list of flights',
        description: 'Get all flights with optional filtering by registration and limiting results',
        tags: ['Flights'],
        parameters: [
          {
            name: 'registration',
            in: 'query',
            description: 'Filter by aircraft registration',
            required: false,
            schema: {
              type: 'string',
              pattern: '^[A-Z0-9-]{3,10}$',
              example: 'OH-LWA'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results to return',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              example: 10
            }
          }
        ],
        responses: {
          200: {
            description: 'A list of flights',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Flight' }
                },
                examples: {
                  multiple_flights: {
                    summary: 'Multiple flights response',
                    value: [
                      {
                        flightId: 1,
                        flightNum: 'AY101',
                        registration: 'OH-LWA',
                        schedDepStation: 'HEL',
                        schedArrStation: 'LHR',
                        schedDepTime: '2025-08-08T10:00:00Z',
                        schedArrTime: '2025-08-08T13:00:00Z'
                      }
                    ]
                  },
                  empty_result: {
                    summary: 'No flights found',
                    value: []
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - invalid parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
                examples: {
                  invalid_limit: {
                    summary: 'Invalid limit parameter',
                    value: {
                      error: 'Bad Request',
                      message: 'Limit parameter must be a positive number'
                    }
                  }
                }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' }
              }
            }
          }
        }
      }
    },
    '/api/work-packages': {
      get: {
        summary: 'Retrieve a list of work packages',
        description: 'Get all work packages with optional filtering by registration, status and limiting results',
        tags: ['Work Packages'],
        parameters: [
          {
            name: 'registration',
            in: 'query',
            description: 'Filter by aircraft registration',
            required: false,
            schema: {
              type: 'string',
              pattern: '^[A-Z0-9-]{3,10}$',
              example: 'OH-LWA'
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by work package status',
            required: false,
            schema: {
              type: 'string',
              enum: ['OPEN', 'In Progress', 'Completed', 'Cancelled'],
              example: 'In Progress'
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Maximum number of results to return',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              example: 10
            }
          }
        ],
        responses: {
          200: {
            description: 'A list of work packages',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/WorkPackage' }
                },
                examples: {
                  multiple_packages: {
                    summary: 'Multiple work packages response',
                    value: [
                      {
                        workPackageId: 1,
                        name: 'WP-001',
                        registration: 'OH-LWA',
                        startDateTime: '2025-08-08T13:30:00Z',
                        endDateTime: '2025-08-08T15:30:00Z',
                        workOrders: 5,
                        status: 'In Progress'
                      }
                    ]
                  },
                  empty_result: {
                    summary: 'No work packages found',
                    value: []
                  }
                }
              }
            }
          },
          400: {
            description: 'Bad request - invalid parameters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: schemas
  }
};

// Write the OpenAPI spec to file
const outputPath = path.resolve('./swagger.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));

console.log(`✅ OpenAPI spec generated successfully at: ${outputPath}`);
console.log(`📝 Total schemas generated: ${Object.keys(schemas).length}`);
console.log(`🚀 API endpoints documented: ${Object.keys(openApiSpec.paths).length}`);

export default openApiSpec;
