# 🐳 Docker Setup Guide - Assignment Solver Platform

## Overview
This guide shows you how to run your Go backend and Python NLP service using Docker.

---

## Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (comes with Docker Desktop)

---

## 🚀 Quick Start (Recommended)

### Option 1: Using Simplified Docker Compose

This setup uses MongoDB Atlas (no local MongoDB needed):

```powershell
# Make sure .env file exists in backend/ folder
cd F:\Homeworking-2

# Build and start services
docker-compose -f docker-compose.simple.yml up --build

# Or run in detached mode (background)
docker-compose -f docker-compose.simple.yml up -d --build
```

**Services will be available at:**
- Backend API: `http://localhost:8080`
- NLP Service: `http://localhost:8000`
- Nginx (optional): `http://localhost:80`

---

## 📦 Building Individual Services

### Build Go Backend Only

```powershell
cd F:\Homeworking-2\backend

# Build Docker image
docker build -t assignment-backend:latest .

# Run container
docker run -d `
  --name go_backend `
  -p 8080:8080 `
  --env-file .env `
  assignment-backend:latest
```

### Build NLP Service Only

```powershell
cd F:\Homeworking-2\nlpservice

# Build Docker image
docker build -t nlp-service:latest .

# Run container
docker run -d `
  --name nlp_service `
  -p 8000:8000 `
  nlp-service:latest
```

---

## 🔧 Docker Commands

### Start Services

```powershell
# Start all services
docker-compose -f docker-compose.simple.yml up

# Start in detached mode (background)
docker-compose -f docker-compose.simple.yml up -d

# Rebuild and start
docker-compose -f docker-compose.simple.yml up --build
```

### Stop Services

```powershell
# Stop all services
docker-compose -f docker-compose.simple.yml down

# Stop and remove volumes
docker-compose -f docker-compose.simple.yml down -v
```

### View Logs

```powershell
# View all logs
docker-compose -f docker-compose.simple.yml logs

# Follow logs (live)
docker-compose -f docker-compose.simple.yml logs -f

# View specific service logs
docker-compose -f docker-compose.simple.yml logs backend
docker-compose -f docker-compose.simple.yml logs nlp-service
```

### Restart Services

```powershell
# Restart all
docker-compose -f docker-compose.simple.yml restart

# Restart specific service
docker-compose -f docker-compose.simple.yml restart backend
```

---

## 🧪 Testing Dockerized Services

After starting with Docker, test the endpoints:

```powershell
# Test backend health
curl http://localhost:8080/api/users

# Test NLP service
curl -X POST http://localhost:8000/nlp/parse `
  -H "Content-Type: application/json" `
  -d '{\"text\":\"I need a Python ML assignment due tomorrow\"}'

# Register a user
curl -X POST http://localhost:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"pass123\",\"role\":\"buyer\"}'
```

---

## 📁 Project Structure

```
Homeworking-2/
├── backend/
│   ├── Dockerfile              ✅ Go backend Docker image
│   ├── .dockerignore           ✅ Files to exclude
│   ├── .env                    ⚠️ Environment variables
│   └── ...
├── nlpservice/
│   ├── Dockerfile              ✅ Python NLP service image
│   └── python/
│       └── nlp_service.py
├── docker-compose.yml          📦 Full setup (with local MongoDB)
└── docker-compose.simple.yml   📦 Simplified (MongoDB Atlas)
```

---

## 🔐 Environment Variables

Make sure your `backend/.env` contains:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
PORT=8080
NLP_SERVICE_URL=http://nlp-service:8000
```

**Note:** When running in Docker, use `NLP_SERVICE_URL=http://nlp-service:8000` (service name, not localhost)

---

## 🛠️ Troubleshooting

### Issue: "Cannot connect to NLP service"

**Solution:** Make sure both services are in the same Docker network:
```powershell
docker network ls
docker network inspect homeworking-2_app-network
```

### Issue: "MongoDB connection failed"

**Solution:** Check your `MONGO_URI` in `.env` - make sure it's MongoDB Atlas URI with correct credentials.

### Issue: "Port already in use"

**Solution:** Stop existing services:
```powershell
# Stop all containers
docker stop $(docker ps -aq)

# Or change ports in docker-compose.simple.yml
ports:
  - "8081:8080"  # Use 8081 instead of 8080
```

### Issue: "Image build failed"

**Solution:** Clean Docker cache and rebuild:
```powershell
# Remove old images
docker-compose -f docker-compose.simple.yml down --rmi all

# Rebuild without cache
docker-compose -f docker-compose.simple.yml build --no-cache
```

---

## 🎯 Production Deployment

### Using Full Docker Compose (with local MongoDB)

```powershell
# Use the full docker-compose.yml
docker-compose up -d --build

# This includes:
# - MongoDB (local)
# - Mongo Express (UI)
# - Redis
# - NLP Service
# - Go Backend
# - Nginx
```

### Environment Variables for Production

Create `.env` in project root:

```env
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password

# Backend
MONGO_URI=mongodb://admin:your_secure_password@mongo:27017/homeworking
JWT_SECRET=your_very_long_random_jwt_secret
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=live_secret_key
PORT=8080
```

---

## 📊 Monitoring Containers

### View running containers
```powershell
docker ps
```

### View container stats (CPU, Memory)
```powershell
docker stats
```

### Enter container shell
```powershell
# Backend
docker exec -it go_backend sh

# NLP Service
docker exec -it nlp_service bash
```

### View container logs
```powershell
docker logs go_backend
docker logs -f nlp_service  # Follow logs
```

---

## 🧹 Cleanup

### Remove all containers and images

```powershell
# Stop all services
docker-compose -f docker-compose.simple.yml down

# Remove all stopped containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove everything (⚠️ CAUTION)
docker system prune -a --volumes -f
```

---

## 🚀 CI/CD Integration

### Build images for deployment

```powershell
# Tag images for registry
docker tag assignment-backend:latest yourusername/assignment-backend:v1.0.0
docker tag nlp-service:latest yourusername/nlp-service:v1.0.0

# Push to Docker Hub
docker push yourusername/assignment-backend:v1.0.0
docker push yourusername/nlp-service:v1.0.0
```

---

## ✅ Quick Commands Summary

```powershell
# Start everything
docker-compose -f docker-compose.simple.yml up -d

# View logs
docker-compose -f docker-compose.simple.yml logs -f

# Restart backend only
docker-compose -f docker-compose.simple.yml restart backend

# Stop everything
docker-compose -f docker-compose.simple.yml down

# Clean rebuild
docker-compose -f docker-compose.simple.yml down --rmi all
docker-compose -f docker-compose.simple.yml up --build -d
```

---

## 📚 References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Go Docker Best Practices](https://docs.docker.com/language/golang/)
- [Python Docker Best Practices](https://docs.docker.com/language/python/)
