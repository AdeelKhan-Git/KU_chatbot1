# Stage 1: Build Vite App
FROM node:20.14.0-alpine3.19 AS build-stage
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve built files with serve
FROM node:20.14.0-alpine3.19
RUN npm install -g serve
WORKDIR /app
COPY --from=build-stage /frontend/dist .
EXPOSE 8080
CMD ["serve", "-s", ".", "-l", "8080"]