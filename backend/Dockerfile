# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Set the working directory in the container
WORKDIR /app

# Copy root package.json and package-lock.json
COPY package.json package-lock.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Install dependencies using npm workspaces
RUN npm install

# Copy the rest of the backend application code
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/

# Copy the database file
COPY backend/airline.db ./backend/

# Build the TypeScript application
WORKDIR /app/backend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3001

# Run seeding and start the server
CMD ["sh", "-c", "npm run db:seed && npm start"]