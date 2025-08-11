# Aircraft Maintenance Timeline

A sophisticated full-stack web application for visualizing aircraft maintenance tasks and flight schedules in an interactive timeline interface with advanced user interaction capabilities.

## 🚀 Features

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
- Express.js framework
- SQLite database with comprehensive data seeding
- Jest testing framework
- RESTful API architecture

**Frontend:**
- React 19.1.1 with TypeScript
- Custom SimpleTimeline component (replacing external timeline libraries)
- Moment.js for advanced date/time operations
- CSS Custom Properties for theming
- Advanced interaction detection and smooth animations

**Development & Deployment:**
- Docker & Docker Compose for containerization
- Yarn Workspaces for monorepo dependency management
- TypeScript for full-stack type safety
- Hot reload development setup

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

## Setup and Running the Application

To run this application, you need to have Docker and Docker Compose installed on your system, along with Yarn.

1.  **Clone the repository:**

    ```bash
    git clone <repository_url>
    cd airline-maintenance-timeline
    ```

2.  **Install dependencies:**

    Navigate to the root of the project and install dependencies using Yarn:

    ```bash
    yarn install
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
yarn install

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

### Work Package Data  
- `GET /api/work-packages`: Retrieves all maintenance work package data with status tracking

### Error Handling
- Consistent error response format across all endpoints
- Comprehensive logging for debugging and monitoring

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
├── package.json                          # Root workspace configuration
├── yarn.lock
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

## Future Enhancements

### Short-term Improvements
- **Enhanced Filtering**: Advanced filtering options by aircraft type, maintenance status, date ranges
- **Keyboard Shortcuts**: Full keyboard navigation support for power users
- **Touch Gestures**: Mobile-optimized touch interactions for tablets and smartphones
- **Timeline Bookmarks**: Save and restore specific timeline positions and selections

### Medium-term Features
- **Real-time Updates**: WebSocket integration for live data updates
- **Collaborative Features**: Multi-user support with conflict resolution
- **Advanced Analytics**: Timeline usage analytics and performance insights  
- **Export Capabilities**: PDF/Excel export of timeline data and visualizations

### Long-term Vision
- **Authentication System**: Secure user management and role-based access
- **Database Evolution**: Migration to PostgreSQL with advanced querying capabilities
- **Microservices Architecture**: Scalable backend with service decomposition
- **AI Integration**: Predictive maintenance scheduling and conflict detection
- **Mobile Application**: Native mobile apps for iOS and Android platforms