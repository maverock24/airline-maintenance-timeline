# Aircraft Maintenance Timeline

A full-stack web application for visualizing aircraft maintenance tasks and flight schedules in an interactive timeline interface.

## 🚀 Features

- **Interactive Timeline**: Visual representation of flights and maintenance work packages
- **Real-time Data**: RESTful API backend with SQLite database
- **Responsive Design**: Clean, modern UI with React and TypeScript
- **Error Handling**: Comprehensive error handling throughout the application
- **Testing**: Unit tests for critical backend functionality
- **Containerization**: Docker support for easy deployment

## 🏗️ Architecture

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **SQLite** database for data persistence
- **RESTful API** design
- **Jest** for unit testing

### Frontend
- **React.js** with TypeScript
- **Moment.js** for date/time handling
- **React Calendar Timeline** for timeline visualization
- **Responsive CSS** for modern UI
- **Yarn Workspaces**: Manages dependencies for both frontend and backend from a single root.

## Technologies Used

**Backend:**
- Node.js
- TypeScript
- Express.js
- SQLite (in-memory database)

**Frontend:**
- React.js
- TypeScript
- `react-calendar-timeline`
- Moment.js

**Containerization:**
- Docker
- Docker Compose

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

    Once the containers are up and running, you can access the frontend application in your web browser at:

    ```
    http://localhost
    ```

    The backend API will be accessible at `http://localhost:3001/api`.

## API Endpoints

- `GET /api/flights`: Retrieves all flight data.
- `GET /api/work-packages`: Retrieves all work package data.

## Project Structure

```
airline-maintenance-timeline/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── flightController.ts
│   │   │   └── workPackageController.ts
│   │   ├── data/
│   │   │   └── seed.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── database.ts
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
├── docker-compose.yml
├── package.json
├── yarn.lock
└── README.md
```

## Future Enhancements

- **Error Handling**: Implement more sophisticated error handling on the frontend to display user-friendly messages.
- **Filtering and Sorting**: Add options to filter flights and work packages by aircraft, date range, status, etc.
- **Zooming and Navigation**: Enhance the timeline component with more advanced zooming and navigation controls.
- **Real-time Updates**: Implement WebSockets for real-time updates of flight and work package statuses.
- **Authentication and Authorization**: Secure the API with user authentication and authorization.
- **Database**: Migrate from SQLite to a more robust database solution like PostgreSQL for production environments.
- **Unit and Integration Tests**: Add more comprehensive unit and integration tests for both frontend and backend.
- **UI/UX Improvements**: Further refine the user interface and experience based on user feedback.