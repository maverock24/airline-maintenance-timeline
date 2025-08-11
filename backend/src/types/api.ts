/**
 * API Response Types for Airline Maintenance Timeline Service
 */

export interface Flight {
  /** Unique identifier for the flight */
  flightId: number;
  /** Flight number (e.g., AY101) */
  flightNum: string;
  /** Aircraft registration (e.g., OH-LWA) */
  registration: string;
  /** Scheduled departure station IATA code (e.g., HEL) */
  schedDepStation: string;
  /** Scheduled arrival station IATA code (e.g., LHR) */
  schedArrStation: string;
  /** Scheduled departure time in ISO 8601 format */
  schedDepTime: string;
  /** Scheduled arrival time in ISO 8601 format */
  schedArrTime: string;
}

export interface WorkPackage {
  /** Unique identifier for the work package */
  workPackageId: number;
  /** Work package name (e.g., WP-001) */
  name: string;
  /** Aircraft registration (e.g., OH-LWA) */
  registration: string;
  /** Work package start time in ISO 8601 format */
  startDateTime: string;
  /** Work package end time in ISO 8601 format */
  endDateTime: string;
  /** Number of work orders in the package */
  workOrders: number;
  /** Current status of the work package */
  status: 'OPEN' | 'In Progress' | 'Completed' | 'Cancelled';
}

export interface HealthStatus {
  /** Overall service health status */
  status: 'healthy' | 'unhealthy';
  /** Health check timestamp in ISO 8601 format */
  timestamp: string;
  /** Service uptime in seconds */
  uptime: number;
  /** Database connection status */
  database: 'connected' | 'disconnected';
  /** Error message if unhealthy */
  error?: string;
}

export interface ApiError {
  /** Error type */
  error: string;
  /** Detailed error message */
  message: string;
}

export interface NotFoundError extends ApiError {
  /** API path that was not found */
  path: string;
  /** HTTP method used */
  method: string;
}

/**
 * Query Parameters
 */
export interface FlightQueryParams {
  /** Filter by aircraft registration */
  registration?: string;
  /** Maximum number of results to return */
  limit?: number;
}

export interface WorkPackageQueryParams {
  /** Filter by aircraft registration */
  registration?: string;
  /** Filter by work package status */
  status?: 'OPEN' | 'In Progress' | 'Completed' | 'Cancelled';
  /** Maximum number of results to return */
  limit?: number;
}
