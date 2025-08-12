# Aircraft Maintenance Timeline

A sophisticated full-stack web application for visualizing aircraft maintenance tasks and flight schedules in an interactive timeline interface with advanced user interaction capabilities.

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Docker** and **Docker Compose** (for containerized deployment)

### Quick Start - Local Development

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd airline-maintenance-timeline
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the application:**

   ```bash
   npm start
   ```

   This will start both frontend and backend services concurrently.

4. **Access the application:**
   - **Frontend Application:** `http://localhost:3000`
   - **Backend API:** `http://localhost:3001/api`
   - **API Documentation (Swagger UI):** `http://localhost:3001/api-docs`
   - **OpenAPI Specification:** `http://localhost:3001/api-docs.json`

### Alternative: Docker Setup

1. **Clone and navigate:**

   ```bash
   git clone <repository_url>
   cd airline-maintenance-timeline
   ```

2. **Build and run with Docker:**

   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Frontend Application:** `http://localhost`
   - **Backend API:** `http://localhost:3001/api`
   - **API Documentation:** `http://localhost:3001/api-docs`

## 🎯 Features

### Core Timeline Features

- **Interactive Timeline**: Custom-built timeline component with intelligent interaction detection
- **Smart Drag Navigation**:
  - Horizontal dragging for timeline panning through time
  - Vertical dragging for scrolling through aircraft
  - Automatic direction detection based on initial mouse movement
- **Multi-View Support**: Day, week, and month zoom levels with smart item centering
- **Advanced Item Selection**:
  - Auto-scroll prevention when manually positioning timeline
  - Intelligent horizontal centering on selection
  - Visual selection indicators with aircraft filtering integration

### User Experience

- **Hidden Scrollbars**: Clean interface with functional scroll via drag interactions
- **Responsive Navigation**: Keyboard and mouse wheel support for all interactions
- **Grid Alignment**: Perfect alignment between timeline headers and content
- **Visual Feedback**: Smooth animations and transitions throughout

### Data & Architecture

- **Real-time Data**: RESTful API backend with SQLite database
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Centralized Types**: Organized interface definitions for maintainable code
- **Error Handling**: Comprehensive error handling throughout the application
- **Testing**: Unit tests for critical backend functionality
- **Containerization**: Docker support for easy deployment

## 🏗️ Architecture

### Backend

- **Node.js** with TypeScript
- **Express.js** framework
- **SQLite** database for data persistence
- **RESTful API** design with comprehensive endpoints
- **OpenAPI 3.0** specification with auto-generated documentation
- **Swagger UI** for interactive API exploration
- **Jest** for unit testing with OpenAPI validation
- **Structured Controllers**: Separate controllers for flights and work packages
- **Type-Safe**: TypeScript interfaces with automatic schema generation

### Frontend

- **React 19.1.1** with TypeScript
- **Custom Timeline Component**: Purpose-built SimpleTimeline replacing external dependencies
- **Moment.js** for sophisticated date/time handling and navigation
- **Advanced Interaction System**: Multi-directional drag detection and smart scrolling
- **Responsive Design**: Modern CSS with CSS custom properties and dark theme support
- **Centralized State Management**: Intelligent item selection and timeline positioning

## Technologies Used

**Backend:**

- Node.js with TypeScript
- Express.js microservice framework
- SQLite database with comprehensive data seeding
- Winston logging system with structured JSON output
- Jest testing framework with OpenAPI validation
- RESTful API architecture with health monitoring
- Comprehensive error handling and request tracing

**Frontend:**

- React 19.1.1 with TypeScript
- Custom SimpleTimeline component (replacing external timeline libraries)
- Moment.js for advanced date/time operations
- CSS Custom Properties for theming
- Advanced interaction detection and smooth animations

**Development & Deployment:**

- Docker & Docker Compose for containerization
- npm Workspaces for monorepo dependency management
- TypeScript for full-stack type safety
- Hot reload development setup
- Automated OpenAPI specification generation

## 🎮 User Interactions

### Timeline Navigation

- **Horizontal Drag**: Pan through time periods
- **Vertical Drag**: Scroll through aircraft list
- **Mouse Wheel**: Zoom in/out (with Ctrl/Alt/Cmd) or pan horizontally
- **Direction Detection**: Automatic distinction between horizontal and vertical intent

### Item Selection & Navigation

- **Smart Centering**: Selected items automatically center in view (day/week/month)
- **Auto-scroll Prevention**: Manual positioning respected for 2 seconds after interaction
- **Keyboard Navigation**: Next/Previous item navigation within aircraft groups
- **Visual Feedback**: Clear selection indicators and smooth transitions

### View Modes

- **Day View**: 24-hour window centered on selected item or current position
- **Week View**: Full week display with proper boundary alignment
- **Month View**: Complete month visualization
- **Seamless Switching**: Maintains item selection and context across view changes

## 🔧 Development Workflow

### Development Commands

```bash
# Install all dependencies
npm install

# Start both frontend and backend concurrently
npm start

# Start backend only (development mode with hot reload)
npm run start:backend

# Start frontend only (development mode)
npm run start:frontend
```

## 🔧 Development Workflow

### Local Development Commands

```bash
# Install all dependencies
npm install

# Start both frontend and backend concurrently
npm start

# Start backend only (development mode with hot reload)
npm run start:backend

# Start frontend only (development mode)
npm run start:frontend
```

### Code Quality & Linting

This project includes comprehensive linting and code formatting setup using ESLint and Prettier:

```bash
# Run linting across entire project
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting without making changes
npm run format:check

# Run TypeScript type checking
npm run type-check

# Backend linting specifically
npm run lint --workspace=backend
npm run lint:fix --workspace=backend

# Frontend linting specifically
npm run lint --workspace=frontend
npm run lint:fix --workspace=frontend
```

**Pre-commit Hooks:** The project uses Husky and lint-staged to automatically run linting and formatting on staged files before commits.

**VS Code Integration:** The project includes VS Code settings for automatic formatting on save and ESLint integration.

**Linting Configuration:**

- **Backend**: ESLint with TypeScript rules, import organization, and Prettier integration
- **Frontend**: ESLint with React rules, TypeScript support, and Prettier formatting
- **Consistent Style**: Single quotes, trailing commas, 2-space indentation across all files

### Testing Commands

```bash
# Run all tests (backend + frontend) - NON-WATCH MODE
npm test

# Backend tests only
npm run test:backend

# Frontend tests only (non-watch mode)
npm run test:frontend

# Frontend tests in watch mode for development
npm run test:frontend:watch

# Run tests with coverage
npm run test:coverage

# Backend specific test patterns
cd backend
npm test -- --testPathPattern=controllers
npm test -- --testPathPattern=openapi

# Frontend specific test patterns
cd frontend
npm test -- --watchAll=false
npm test -- --testPathPattern=App --watchAll=false
npm test -- --testPathPattern=SimpleTimeline --watchAll=false
```

**Test Status: ✅ 72/73 tests passing (1 skipped)**

- Backend: 26/26 API controller, error handling, and OpenAPI tests ✅
- Frontend: 58/58 component, hook, and integration tests ✅ (1 skipped timer test)

### Docker Development

```bash
# Build and start all services
docker-compose up --build

# View logs for specific service
docker-compose logs frontend
docker-compose logs backend

# Rebuild specific service
docker-compose up --build frontend

# Run in background
docker-compose up -d

# Stop all services
docker-compose down
```

## Setup and Running the Application

To run this application, you need to have Docker and Docker Compose installed on your system, along with npm.

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd airline-maintenance-timeline
    ```

2.  **Install dependencies:**

    Navigate to the root of the project and install dependencies using npm:

    ```bash
    npm install
    ```

3.  **Build and run the Docker containers:**

    ```bash
    docker-compose up --build
    ```

    This command will:
    - Build the backend Docker image.
    - Build the frontend Docker image.
    - Start the backend service, which will also seed the SQLite database with sample data.
    - Start the frontend service.

4.  **Access the application:**

    Once the containers are up and running, you can access the following services:
    - **Frontend Application:** `http://localhost`
    - **Backend API:** `http://localhost:3001/api`
    - **API Documentation (Swagger UI):** `http://localhost:3001/api-docs`
    - **OpenAPI Specification:** `http://localhost:3001/api-docs.json`

## 🔧 Development Workflow

### Local Development

```bash
# Install all dependencies
npm install

# Start backend in development mode
cd backend && yarn dev

# Start frontend in development mode (in another terminal)
cd frontend && yarn start
```

### Testing

```bash
# Run all tests (backend + frontend) - NON-WATCH MODE
npm test

# Backend tests only
npm run test:backend

# Frontend tests only (non-watch mode)
npm run test:frontend

# Frontend tests in watch mode for development
npm run test:frontend:watch

# Run tests with coverage
npm run test:coverage

# Frontend specific test patterns (from frontend directory)
cd frontend

# All frontend tests (non-watch mode)
npm test -- --watchAll=false

# Specific component tests
npm test -- --testPathPattern=App --watchAll=false
npm test -- --testPathPattern=ControlsAndStats --watchAll=false
npm test -- --testPathPattern=Header --watchAll=false
npm test -- --testPathPattern=SelectedItemDisplay --watchAll=false

# Utility and integration tests
npm test -- --testPathPattern=helpers --watchAll=false
npm test -- --testPathPattern=useTimelineData --watchAll=false
npm test -- --testPathPattern=integration --watchAll=false

# Watch mode for development
npm test
```

**Test Status: ✅ 72/73 tests passing (1 skipped)**

- Backend: 26/26 API controller, error handling, and OpenAPI tests ✅
- Frontend: 58/58 component, hook, and integration tests ✅ (1 skipped timer test)
- Frontend: 58/59 tests (1 skipped timer test)
- Complete component, utility, and integration coverage

### Docker Development

```bash
# Build and start all services
docker-compose up --build

# View logs for specific service
docker-compose logs frontend
docker-compose logs backend

# Rebuild specific service
docker-compose up --build frontend
```

## 📖 Usage Examples

### Basic Timeline Navigation

1. **View Selection**: Use the dropdown to switch between Day, Week, and Month views
2. **Aircraft Filtering**: Select specific aircraft to focus on their maintenance schedule
3. **Item Selection**: Click on any flight or work package to select and center it
4. **Timeline Panning**: Drag horizontally to move through time periods
5. **Vertical Scrolling**: Drag vertically to scroll through the aircraft list

### Advanced Interactions

- **Zoom**: Hold Ctrl/Cmd and scroll mouse wheel to zoom in/out
- **Keyboard Navigation**: Use arrow keys or click Next/Previous for item navigation
- **Smart Positioning**: The timeline remembers your manual positioning and won't auto-scroll for 2 seconds
- **Multi-directional Drag**: The system automatically detects whether you want to pan horizontally or scroll vertically

### Timeline Features

- **Perfect Alignment**: Grid lines and headers stay perfectly aligned
- **Smooth Animations**: All interactions include smooth, responsive animations
- **Visual Feedback**: Clear selection indicators and hover states
- **Hidden Scrollbars**: Clean interface while maintaining full scroll functionality

## API Endpoints

### Flight Data

- `GET /api/flights`: Retrieves all flight data with comprehensive scheduling information
- `GET /api/flights?registration=ABC123`: Filter flights by aircraft registration
- `GET /api/flights?limit=10`: Limit number of results returned

### Work Package Data

- `GET /api/work-packages`: Retrieves all maintenance work package data with status tracking
- `GET /api/work-packages?status=In Progress`: Filter by work package status
- `GET /api/work-packages?registration=ABC123`: Filter by aircraft registration

### Health & Monitoring

- `GET /api/health`: Service health check with database connectivity
- `GET /api-docs`: Interactive Swagger UI documentation
- `GET /api-docs.json`: OpenAPI 3.0 specification

### Error Handling

- Consistent error response format across all endpoints
- Comprehensive logging with Winston for debugging and monitoring
- Request tracing with unique request IDs
- Structured JSON logging with daily rotation

## 📊 Logging & Monitoring

The application includes enterprise-grade logging for debugging, monitoring, and compliance:

### Log Files (backend/logs/)

- **combined-YYYY-MM-DD.log**: All application activity
- **error-YYYY-MM-DD.log**: Errors and failures only
- **access-YYYY-MM-DD.log**: HTTP request/response logs

### Features

- **Request Tracing**: Every request gets a unique ID for end-to-end tracking
- **Performance Monitoring**: Automatic slow request detection (>1000ms)
- **Structured JSON**: Easy parsing for log analysis tools
- **Daily Rotation**: 30-day retention with automatic compression

### Quick Log Analysis

```bash
# View recent activity
tail -f backend/logs/combined-$(date +%Y-%m-%d).log

# Monitor errors
tail -f backend/logs/error-$(date +%Y-%m-%d).log

# Test logging system
./backend/test-logging.sh
```

## Project Structure

```
airline-maintenance-timeline/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── flightController.ts       # Flight data API logic
│   │   │   └── workPackageController.ts  # Work package API logic
│   │   ├── data/
│   │   │   └── seed.ts                   # Database seeding with sample data
│   │   ├── routes/
│   │   │   └── index.ts                  # API route definitions
│   │   ├── services/
│   │   │   └── database.ts               # Database connection and setup
│   │   ├── __tests__/
│   │   │   └── controllers.test.ts       # Unit tests for API controllers
│   │   └── index.ts                      # Express server setup
│   ├── Dockerfile                        # Backend containerization
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SimpleTimeline.tsx        # Custom timeline component
│   │   │   └── SimpleTimeline.css        # Timeline styling with advanced features
│   │   ├── utils/
│   │   │   └── types.ts                  # Centralized TypeScript interfaces
│   │   ├── App.tsx                       # Main application component
│   │   ├── App.css                       # Global styling and theme system
│   │   └── index.tsx                     # React application entry point
│   ├── Dockerfile                        # Frontend containerization
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml                    # Multi-container orchestration
├── package.json                          # Root workspace configuration with npm scripts
├── package-lock.json                     # Dependency lock file
└── README.md
```

## 🎯 Recent Improvements

### Advanced Timeline Interaction System

- **Intelligent Drag Detection**: Automatically detects whether user intends horizontal timeline panning or vertical scrolling
- **Hidden Scrollbars**: Clean interface with full functionality via drag interactions
- **Perfect Grid Alignment**: Timeline headers and content grid lines perfectly aligned
- **Smart Auto-scroll Prevention**: Timeline respects manual positioning and prevents disruptive jumps

### Enhanced User Experience

- **Horizontal Item Centering**: Selected items properly center in day view (previously broken)
- **Improved Navigation**: Enhanced next/previous item navigation with aircraft filtering
- **Visual Polish**: Centered time markers, improved header positioning, smooth animations
- **Responsive Design**: Optimized for various screen sizes and interaction methods

### Code Architecture Improvements

- **Type Organization**: Moved all interfaces to centralized `utils/types.ts`
- **Custom Timeline Component**: Replaced external dependency with purpose-built solution
- **State Management**: Improved item selection logic and timeline positioning coordination
- **Performance**: Optimized rendering and interaction responsiveness

## 🚧 Future Development Roadmap

### Short-term Improvements (Next 3 months)

- **Enhanced Filtering**: Advanced filtering options by aircraft type, maintenance status, date ranges
- **Keyboard Shortcuts**: Full keyboard navigation support for power users
- **Touch Gestures**: Mobile-optimized touch interactions for tablets and smartphones
- **Timeline Bookmarks**: Save and restore specific timeline positions and selections
- **Data Export**: CSV/Excel export of timeline data and reports
- **Print Layouts**: Optimized print stylesheets for timeline reports

### Medium-term Features (3-6 months)

- **Real-time Updates**: WebSocket integration for live data updates
- **Collaborative Features**: Multi-user support with conflict resolution
- **Advanced Analytics**: Timeline usage analytics and performance insights
- **Notification System**: Email/SMS alerts for maintenance deadlines
- **Advanced Search**: Full-text search across all maintenance records
- **Offline Support**: Progressive Web App (PWA) with offline capabilities

### Long-term Vision (6+ months)

- **Authentication System**: Secure user management and role-based access control
- **Database Evolution**: Migration to PostgreSQL with advanced querying capabilities
- **AI Integration**: Predictive maintenance scheduling and conflict detection
- **Mobile Applications**: Native mobile apps for iOS and Android platforms
- **Multi-tenant Architecture**: Support for multiple airlines/organizations
- **Integration APIs**: Connect with existing maintenance management systems

### CI/CD & DevOps Enhancements

#### Continuous Integration

- **GitHub Actions Pipeline**: Automated testing, building, and deployment
- **Multi-stage Testing**: Unit, integration, e2e, and performance testing
- **Code Quality Gates**: ESLint, Prettier, SonarQube integration
- **Security Scanning**: Dependency vulnerability scanning with Snyk/Dependabot
- **Test Coverage Reporting**: Codecov integration with minimum coverage thresholds
- **Automated Code Reviews**: CodeQL and semantic analysis
- **Branch Protection**: Enforce PR reviews and status checks

#### Continuous Deployment

- **Environment Promotion**: Dev → Staging → Production pipeline
- **Blue-Green Deployments**: Zero-downtime deployment strategy
- **Feature Flags**: Gradual feature rollouts with LaunchDarkly/Unleash
- **Automated Rollbacks**: Failure detection and automatic rollback mechanisms
- **Database Migrations**: Automated schema migrations with Flyway/Liquibase
- **Health Check Validation**: Post-deployment health verification
- **Deployment Notifications**: Slack/Teams integration for deployment status

#### Infrastructure as Code

- **Terraform Configuration**: Cloud infrastructure provisioning
- **Kubernetes Manifests**: Container orchestration with Helm charts
- **Environment Consistency**: Identical dev/staging/prod environments
- **Resource Monitoring**: Automated scaling based on metrics
- **Backup Strategies**: Automated database and file backups
- **Disaster Recovery**: Multi-region failover capabilities

### Cloud Deployment Considerations

#### AWS Deployment Strategy

- **ECS/Fargate**: Containerized microservices deployment
- **RDS Aurora**: Managed PostgreSQL with read replicas
- **ElastiCache**: Redis for session management and caching
- **CloudFront**: Global CDN for frontend static assets
- **S3**: Static file storage and backup solutions
- **Application Load Balancer**: Traffic distribution and SSL termination
- **Route 53**: DNS management and health checks
- **CloudWatch**: Comprehensive monitoring and alerting
- **VPC**: Secure network isolation with private subnets
- **IAM**: Fine-grained access control and service roles

#### Azure Deployment Alternative

- **Azure Container Instances**: Serverless container deployment
- **Azure Database for PostgreSQL**: Managed database service
- **Azure Cache for Redis**: In-memory caching solution
- **Azure CDN**: Global content delivery network
- **Azure Blob Storage**: Object storage for files and backups
- **Azure Application Gateway**: Load balancing and WAF
- **Azure DNS**: Domain name resolution
- **Azure Monitor**: Application and infrastructure monitoring
- **Azure Virtual Network**: Secure network infrastructure
- **Azure Active Directory**: Identity and access management

#### Google Cloud Platform Option

- **Google Kubernetes Engine (GKE)**: Managed Kubernetes clusters
- **Cloud SQL**: Managed PostgreSQL database
- **Memorystore**: Managed Redis caching
- **Cloud CDN**: Global content delivery
- **Cloud Storage**: Object storage solution
- **Cloud Load Balancing**: Global load distribution
- **Cloud DNS**: Managed DNS service
- **Cloud Monitoring**: Comprehensive observability
- **VPC**: Virtual private cloud networking
- **Identity and Access Management**: Security and access control

#### Multi-Cloud Considerations

- **Kubernetes**: Platform-agnostic container orchestration
- **Terraform**: Multi-cloud infrastructure provisioning
- **Helm Charts**: Consistent application deployment
- **Prometheus/Grafana**: Cloud-agnostic monitoring stack
- **External Secrets**: Centralized secret management
- **Istio Service Mesh**: Advanced traffic management
- **Cost Optimization**: Multi-cloud cost comparison and optimization

#### Production Readiness Checklist

- **SSL/TLS Certificates**: Automated certificate management with Let's Encrypt
- **Security Headers**: HTTPS enforcement, HSTS, CSP implementation
- **Rate Limiting**: API throttling and DDoS protection
- **Log Aggregation**: Centralized logging with ELK Stack or similar
- **Metrics Collection**: Application and business metrics
- **Error Tracking**: Sentry or Rollbar integration
- **Performance Monitoring**: APM tools like New Relic or Datadog
- **Backup Verification**: Regular backup testing and restoration drills
- **Compliance**: GDPR, SOC2, or industry-specific compliance requirements
- **Documentation**: Runbooks, incident response procedures, and architecture diagrams
