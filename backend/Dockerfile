
# Soundwave Sprint 4 - SW-164
# Backend Docker build validation

FROM node:24-alpine

WORKDIR /app

# Install dependencies using the committed lockfile
COPY package*.json ./
RUN npm ci

# Copy application source and build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Application listens on port 4000
EXPOSE 4000

# Start the compiled backend
CMD ["npm", "start"]
