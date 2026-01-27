# Multi-service Dockerfile for Railway "One Click"
FROM node:20-slim AS builder

WORKDIR /app

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy root dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy everything
COPY . .

# Build Frontend
RUN npx prisma generate
RUN npm run build

# Setup Backend Venv
RUN cd services/api && python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

# Final Stage
FROM node:20-slim

WORKDIR /app

# Install Python and runtime dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy built app and dependencies
COPY --from=builder /app .

# Expose ports
EXPOSE 3000
EXPOSE 8000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PYTHON_BACKEND_URL="http://127.0.0.1:8000"

# Use the start script
RUN chmod +x scripts/start-all.sh
CMD ["./scripts/start-all.sh"]
