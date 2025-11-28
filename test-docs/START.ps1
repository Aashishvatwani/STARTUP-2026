# Assignment Solver Platform - Startup Script

Write-Host "
=== Assignment Solver Platform Startup ===" -ForegroundColor Cyan

# Step 1: Check if MongoDB is accessible
Write-Host "
[1/4] Checking MongoDB connection..." -ForegroundColor Yellow
if (-not (Test-Path backend\.env)) {
    Write-Host "WARNING: .env file not found in backend folder!" -ForegroundColor Red
    Write-Host "Please create backend\.env with:" -ForegroundColor Yellow
    Write-Host "  MONGO_URI=mongodb+srv://..." -ForegroundColor Gray
    Write-Host "  PORT=8080" -ForegroundColor Gray
    Write-Host "  NLP_SERVICE_URL=http://localhost:8000" -ForegroundColor Gray
    Write-Host "  RAZORPAY_KEY_ID=..." -ForegroundColor Gray
    Write-Host "  RAZORPAY_KEY_SECRET=..." -ForegroundColor Gray
}

# Step 2: Start Python NLP Service
Write-Host "
[2/4] Starting Python NLP Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd nlpservice\python; python nlp_service.py"
Write-Host "Python NLP Service starting on http://localhost:8000" -ForegroundColor Green
Start-Sleep -Seconds 3

# Step 3: Start Go Backend
Write-Host "
[3/4] Starting Go Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; go run main.go"
Write-Host "Go Backend starting on http://localhost:8080" -ForegroundColor Green
Start-Sleep -Seconds 3

# Step 4: Show API endpoints
Write-Host "
[4/4] Backend is ready!" -ForegroundColor Green
Write-Host "
Available API Endpoints:" -ForegroundColor Cyan
Write-Host "  - POST /api/nlp/parse - Parse assignment text" -ForegroundColor Gray
Write-Host "  - POST /api/assignments/create-from-text - Create from text" -ForegroundColor Gray
Write-Host "  - POST /api/auth/register - Register user" -ForegroundColor Gray
Write-Host "  - POST /api/auth/login - Login" -ForegroundColor Gray
Write-Host "  - GET  /api/assignments - Get all assignments" -ForegroundColor Gray
Write-Host "  - POST /api/chat/create - Create chat" -ForegroundColor Gray
Write-Host "  - POST /api/payment/create - Create payment" -ForegroundColor Gray
Write-Host "  - GET  /api/notifications/user/:id - Get notifications" -ForegroundColor Gray

Write-Host "
Test the API:" -ForegroundColor Yellow
Write-Host "  .\QUICK_TEST.ps1 - Run quick tests" -ForegroundColor Gray
Write-Host "  .\API_TESTS.ps1 - Run full test suite" -ForegroundColor Gray

Write-Host "
Press Ctrl+C to stop all services
" -ForegroundColor Yellow
