# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy root package.json and package-lock.json
COPY package.json package-lock.json ./

# Copy frontend package.json
COPY frontend/package.json ./frontend/

# Install dependencies using npm workspaces
RUN npm install

# Copy the rest of the frontend application code
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY frontend/tsconfig.json ./frontend/

# Build the React app
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy built React app
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Create nginx configuration to proxy API requests to backend
RUN echo 'server {\
    listen 80;\
    server_name localhost;\
\
    location / {\
        root /usr/share/nginx/html;\
        index index.html index.htm;\
        try_files $uri $uri/ /index.html;\
    }\
\
    location /api/ {\
        proxy_pass http://backend:3001/api/;\
        proxy_set_header Host $host;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]