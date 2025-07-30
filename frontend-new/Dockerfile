# Stage 1: Build the React application
FROM node:18-slim AS build-stage

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
# This is done first to leverage Docker's layer caching
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Declare build-time arguments for environment variables
ARG REACT_APP_FIREBASE_API_KEY
ARG REACT_APP_FIREBASE_AUTH_DOMAIN
ARG REACT_APP_FIREBASE_PROJECT_ID
ARG REACT_APP_FIREBASE_STORAGE_BUCKET
ARG REACT_APP_FIREBASE_MESSAGING_SENDER_ID
ARG REACT_APP_FIREBASE_APP_ID
ARG REACT_APP_FIREBASE_MEASUREMENT_ID
ARG REACT_APP_GEMINI_API_KEY

# Build the application
# React scripts will automatically use the build ARGs
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:stable AS production-stage

# Copy the build output from the build stage
COPY --from=build-stage /app/build /usr/share/nginx/html

# Add a custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]