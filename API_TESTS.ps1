# API Testing Commands for Assignment Solver Platform

## Prerequisites
# Start Python NLP Service:
# cd nlpservice/python
# python nlp_service.py

# Start Go Backend:
# cd backend
# go run main.go

# Set base URL
$BASE_URL = "http://localhost:8080/api"

## ========================================
## 1. USER AUTHENTICATION
## ========================================

# Register a Buyer
curl -X POST $BASE_URL/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "John Buyer",
    "email": "buyer@example.com",
    "password": "password123",
    "role": "buyer",
    "skills": [],
    "location": {"latitude": 28.6139, "longitude": 77.2090}
  }'

# Register a Solver
curl -X POST $BASE_URL/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "name": "Jane Solver",
    "email": "solver@example.com",
    "password": "password123",
    "role": "solver",
    "skills": ["Python", "Machine Learning", "Data Science"],
    "price_per_job": 400,
    "location": {"latitude": 28.7041, "longitude": 77.1025}
  }'

# Login
curl -X POST $BASE_URL/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "buyer@example.com",
    "password": "password123"
  }'

## ========================================
## 2. NLP-POWERED ASSIGNMENT CREATION
## ========================================

# Parse Assignment Text (Preview Only)
curl -X POST $BASE_URL/nlp/parse `
  -H "Content-Type: application/json" `
  -d '{
    "text": "I need a 4 page Python machine learning report about CNN due tomorrow ASAP",
    "user_id": "507f1f77bcf86cd799439011"
  }'

# Create Assignment from Text
curl -X POST $BASE_URL/assignments/create-from-text `
  -H "Content-Type: application/json" `
  -d '{
    "text": "I need a 4 page Python ML report about CNN due tomorrow ASAP",
    "user_id": "507f1f77bcf86cd799439011",
    "title": "ML Report on CNN",
    "price": 500,
    "latitude": 28.6139,
    "longitude": 77.2090
  }'

## ========================================
## 3. ASSIGNMENT MANAGEMENT
## ========================================

# Get All Assignments
curl -X GET $BASE_URL/assignments

# Get Single Assignment
curl -X GET $BASE_URL/assignments/507f1f77bcf86cd799439011

# Match Solvers for Assignment
curl -X POST $BASE_URL/match/solvers `
  -H "Content-Type: application/json" `
  -d '{
    "description": "Python machine learning project",
    "location": {"latitude": 28.6139, "longitude": 77.2090}
  }'

## ========================================
## 4. CHAT & MESSAGING
## ========================================

# Create Chat
curl -X POST $BASE_URL/chat/create `
  -H "Content-Type: application/json" `
  -d '{
    "assignmentId": "507f1f77bcf86cd799439011",
    "buyerId": "507f1f77bcf86cd799439012",
    "solverId": "507f1f77bcf86cd799439013"
  }'

# Send Message
curl -X POST $BASE_URL/chat/507f1f77bcf86cd799439011/message `
  -H "Content-Type: application/json" `
  -d '{
    "senderId": "507f1f77bcf86cd799439012",
    "senderRole": "buyer",
    "content": "Hello, can you complete this by tomorrow?"
  }'

# Get Chat
curl -X GET $BASE_URL/chat/507f1f77bcf86cd799439011

# Negotiate Price
curl -X PUT $BASE_URL/chat/507f1f77bcf86cd799439011/price `
  -H "Content-Type: application/json" `
  -d '{
    "agreedPrice": 450,
    "agreedDeadline": "2025-11-05T23:59:59Z"
  }'

## ========================================
## 5. PAYMENT SYSTEM
## ========================================

# Create Payment
curl -X POST $BASE_URL/payment/create `
  -H "Content-Type: application/json" `
  -d '{
    "assignmentId": "507f1f77bcf86cd799439011",
    "buyerId": "507f1f77bcf86cd799439012",
    "solverId": "507f1f77bcf86cd799439013",
    "amount": 500
  }'

# Verify Payment (Razorpay)
curl -X POST $BASE_URL/payment/verify `
  -H "Content-Type: application/json" `
  -d '{
    "order_id": "order_MHZ2vGAbCdEfGh",
    "payment_id": "pay_MHZ3wXYzAbCdEf",
    "signature": "abc123xyz456signature"
  }'

# Get Payment Details
curl -X GET $BASE_URL/payment/507f1f77bcf86cd799439011

## ========================================
## 6. NOTIFICATIONS
## ========================================

# Create Notification
curl -X POST $BASE_URL/notifications/create `
  -H "Content-Type: application/json" `
  -d '{
    "userId": "507f1f77bcf86cd799439012",
    "type": "assignment_created",
    "title": "New Assignment Posted",
    "message": "Your assignment has been created successfully",
    "relatedId": "507f1f77bcf86cd799439011"
  }'

# Get User Notifications
curl -X GET $BASE_URL/notifications/user/507f1f77bcf86cd799439012

# Get Unread Notifications
curl -X GET $BASE_URL/notifications/user/507f1f77bcf86cd799439012/unread

# Mark Notification as Read
curl -X PUT $BASE_URL/notifications/507f1f77bcf86cd799439011/read

# Mark All as Read
curl -X PUT $BASE_URL/notifications/user/507f1f77bcf86cd799439012/read-all

# Delete Notification
curl -X DELETE $BASE_URL/notifications/507f1f77bcf86cd799439011

## ========================================
## 7. USER MANAGEMENT
## ========================================

# Get All Users
curl -X GET $BASE_URL/users

# Get User by ID
curl -X GET $BASE_URL/users/507f1f77bcf86cd799439011

# Update User
curl -X PUT $BASE_URL/users/507f1f77bcf86cd799439011 `
  -H "Content-Type: application/json" `
  -d '{
    "name": "John Updated",
    "skills": ["Python", "AI", "Blockchain"]
  }'

# Get Top Buyers
curl -X GET $BASE_URL/buyers/top

## ========================================
## COMPLETE WORKFLOW TEST
## ========================================

Write-Host "
Complete Workflow Test:" -ForegroundColor Green

# 1. Register Users
Write-Host "1. Registering Buyer..." -ForegroundColor Yellow
$buyerResponse = curl -X POST $BASE_URL/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test Buyer\",\"email\":\"testbuyer@test.com\",\"password\":\"pass123\",\"role\":\"buyer\"}' `
  -s | ConvertFrom-Json

Write-Host "2. Registering Solver..." -ForegroundColor Yellow
$solverResponse = curl -X POST $BASE_URL/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test Solver\",\"email\":\"testsolver@test.com\",\"password\":\"pass123\",\"role\":\"solver\",\"skills\":[\"Python\",\"ML\"]}' `
  -s | ConvertFrom-Json

# 2. Create Assignment from Text
Write-Host "3. Creating Assignment from Text..." -ForegroundColor Yellow
curl -X POST $BASE_URL/assignments/create-from-text `
  -H "Content-Type: application/json" `
  -d '{
    \"text\":\"I need a 4 page Python ML report due tomorrow\",
    \"user_id\":\"507f1f77bcf86cd799439011\",
    \"latitude\":28.6139,
    \"longitude\":77.2090
  }'

Write-Host "
All tests completed!" -ForegroundColor Green
