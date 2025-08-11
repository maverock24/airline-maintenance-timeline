// Timeline UI Configuration
export const TIMELINE_CONFIG = {
  // Default component dimensions
  DEFAULT_SIDEBAR_WIDTH: 200,
  DEFAULT_LINE_HEIGHT: 70,
  DEFAULT_ITEM_HEIGHT_RATIO: 0.8,
  
  // Layout and spacing
  HORIZONTAL_PADDING: 24,
  ITEM_LANE_SPACING: 4,
  MIN_SIDEBAR_WIDTH: 100,
  MOBILE_MAX_SIDEBAR_WIDTH: 180,
  DESKTOP_MAX_SIDEBAR_WIDTH: 340,
  
  // Responsive breakpoints
  MOBILE_BREAKPOINT: 768,
  
  // Interaction thresholds
  DRAG_DIRECTION_THRESHOLD: 5,
  MIN_ITEM_WIDTH_PERCENT: 0.5,
  MAX_PERCENT: 100,
} as const;

// Time Constants (in milliseconds)
export const TIME_CONSTANTS = {
  // Duration calculations
  HOUR_MS: 60 * 60 * 1000,
  DAY_MS: 24 * 60 * 60 * 1000,
  TWO_DAYS_MS: 2 * 24 * 60 * 60 * 1000,
  
  // Minimum durations
  MIN_ZOOM_DURATION_MS: 60_000, // 1 minute
  
  // Update intervals
  CLOCK_UPDATE_INTERVAL: 1000, // 1 second
} as const;

// Interaction and Animation Constants
export const INTERACTION_CONFIG = {
  // Timeouts and delays
  USER_INTERACTION_TIMEOUT: 2000, // 2 seconds
  SCROLL_COORDINATION_DELAY: 50, // 50ms
  
  // Zoom factors
  ZOOM_IN_FACTOR: 0.8333,
  ZOOM_OUT_FACTOR: 1.2,
  
  // Pan and scroll
  PAN_SHIFT_RATIO: 0.1,
  COMFORTABLE_VIEWING_PADDING_RATIO: 0.2, // 20% of container height
  
  // Touch interaction
  MIN_PINCH_DISTANCE: 1,
  TOUCH_LOCK_THRESHOLD: 6,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  FLIGHTS: '/api/flights',
  WORK_PACKAGES: '/api/work-packages',
  HEALTH: '/api/health',
} as const;

// View Modes
export const VIEW_MODES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

// Timeline Grid Configuration
export const GRID_CONFIG = {
  // Time marker steps
  HOURLY_STEP_MS: TIME_CONSTANTS.HOUR_MS,
  DAILY_STEP_MS: TIME_CONSTANTS.DAY_MS,
  
  // Grid threshold (when to switch from hourly to daily markers)
  HOURLY_GRID_THRESHOLD: TIME_CONSTANTS.TWO_DAYS_MS,
} as const;

// Default Props
export const DEFAULT_PROPS = {
  TIMELINE: {
    sidebarWidth: TIMELINE_CONFIG.DEFAULT_SIDEBAR_WIDTH,
    lineHeight: TIMELINE_CONFIG.DEFAULT_LINE_HEIGHT,
    itemHeightRatio: TIMELINE_CONFIG.DEFAULT_ITEM_HEIGHT_RATIO,
    canSelect: true,
    stackItems: true,
  },
} as const;

// CSS Classes and Selectors
export const CSS_CLASSES = {
  TIMELINE_CONTAINER: 'timeline-container',
  SELECTED_ITEM: 'selected',
  FLIGHT_ITEM: 'flight-item',
  DARK_THEME: 'dark-theme',
  LIGHT_THEME: 'light-theme',
} as const;

// Date Format Patterns
export const DATE_FORMATS = {
  FULL_DATE: 'dddd, MMMM DD, YYYY',
  TIME_24H: 'HH:mm:ss',
  HOUR_MARKER: 'HH:00',
  DAY_MARKER: 'ddd DD',
  ITEM_DISPLAY: 'MMM DD HH:mm',
} as const;

// Status Configuration
export const STATUS_CONFIG = {
  SYMBOLS: {
    COMPLETED: '✅',
    IN_PROGRESS: '🔧', 
    OPEN: '📋',
    CANCELLED: '❌',
    DEFAULT: '📝',
  },
  COLORS: {
    COMPLETED: '#38a169', // Muted green
    IN_PROGRESS: '#d69e2e', // Muted amber
    OPEN: '#3182ce', // Muted blue
    CANCELLED: '#e53e3e', // Muted red
    DEFAULT: '#718096', // Muted gray
  },
  NAMES: {
    COMPLETED: 'completed',
    IN_PROGRESS: 'in progress',
    OPEN: 'open',
    CANCELLED: 'cancelled',
  },
} as const;
