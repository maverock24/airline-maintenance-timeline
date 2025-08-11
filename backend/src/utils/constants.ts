// Server Configuration
export const SERVER_CONFIG = {
  // Default port
  DEFAULT_PORT: 3001,
  
  // Request body limits
  JSON_LIMIT: '10mb',
  URL_ENCODED_LIMIT: '10mb',
  
  // Environment values
  ENVIRONMENTS: {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// API Routes
export const API_ROUTES = {
  BASE: '/api',
  HEALTH: '/health',
  FLIGHTS: '/flights',
  WORK_PACKAGES: '/work-packages',
  
  // Full paths
  FULL_PATHS: {
    HEALTH: '/api/health',
    FLIGHTS: '/api/flights',
    WORK_PACKAGES: '/api/work-packages',
  },
} as const;

// Logging Configuration
export const LOGGING_CONFIG = {
  // Log levels
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    HTTP: 'http',
    DEBUG: 'debug',
  },
  
  // File rotation settings
  ROTATION: {
    MAX_SIZE: '20m',
    MAX_FILES: '30d',
    DATE_PATTERN: 'YYYY-MM-DD',
  },
  
  // Performance thresholds
  PERFORMANCE: {
    SLOW_REQUEST_THRESHOLD: 1000, // 1 second in milliseconds
  },
  
  // Console timestamp format
  CONSOLE_TIMESTAMP_FORMAT: 'HH:mm:ss',
  
  // File timestamp format  
  FILE_TIMESTAMP_FORMAT: 'YYYY-MM-DD HH:mm:ss',
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  // SQLite database file
  DATABASE_FILE: 'airline.db',
  
  // Query timeouts (in milliseconds)
  QUERY_TIMEOUT: 30000, // 30 seconds
  
  // Connection pool settings
  POOL: {
    MIN: 1,
    MAX: 10,
    IDLE_TIMEOUT: 30000, // 30 seconds
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  SOMETHING_WENT_WRONG: 'Something went wrong',
  NOT_FOUND: 'Not Found',
  API_ENDPOINT_NOT_FOUND: 'API endpoint not found',
  ROUTE_NOT_FOUND: (url: string) => `Route ${url} not found`,
  PORT_IN_USE: (port: number) => `Port ${port} is already in use`,
  SERVER_STARTUP_ERROR: 'Server startup error',
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  INVALID_QUERY_PARAMETERS: 'Invalid query parameters',
} as const;

// Request/Response Configuration
export const REQUEST_CONFIG = {
  // Default query limits
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 1000,
  
  // Query parameter names
  QUERY_PARAMS: {
    LIMIT: 'limit',
    OFFSET: 'offset',
    REGISTRATION: 'registration',
    STATUS: 'status',
    START_DATE: 'startDate',
    END_DATE: 'endDate',
  },
} as const;

// Swagger/OpenAPI Configuration
export const SWAGGER_CONFIG = {
  // API Info
  INFO: {
    TITLE: 'Airline Maintenance Timeline API',
    VERSION: '1.0.0',
    DESCRIPTION: 'API for managing airline maintenance timelines',
  },
  
  // Paths
  DOCS_PATH: '/api-docs',
  JSON_PATH: '/api-docs.json',
  
  // Server URLs
  SERVERS: {
    DEVELOPMENT: 'http://localhost:3001',
    PRODUCTION: 'https://api.airline-maintenance.com',
  },
} as const;

// Health Check Configuration
export const HEALTH_CONFIG = {
  // Service status values
  STATUS: {
    UP: 'up',
    DOWN: 'down',
    DEGRADED: 'degraded',
  },
  
  // Component names
  COMPONENTS: {
    DATABASE: 'database',
    API: 'api',
    LOGGING: 'logging',
  },
  
  // Health check timeouts
  TIMEOUTS: {
    DATABASE_CHECK: 5000, // 5 seconds
    COMPONENT_CHECK: 3000, // 3 seconds
  },
} as const;

// CORS Configuration
export const CORS_CONFIG = {
  // Allowed origins
  ORIGINS: {
    DEVELOPMENT: ['http://localhost:3000', 'http://localhost:3001'],
    PRODUCTION: ['https://airline-maintenance.com'],
  },
  
  // Allowed methods
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  HEADERS: ['Content-Type', 'Authorization', 'X-Request-ID'],
} as const;

// Process Exit Codes
export const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  MISUSE_OF_SHELL_BUILTINS: 2,
  INVALID_ARGUMENT: 3,
  DATABASE_ERROR: 10,
  NETWORK_ERROR: 11,
  CONFIGURATION_ERROR: 12,
} as const;
