# Quick API Test Script
# Make sure backend is running on localhost:8080

Write-Host "
=== Assignment Solver Platform - API Tests ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "
[1/5] Testing NLP Parse..." -ForegroundColor Yellow
curl -X POST http://localhost:8080/api/nlp/parse `
  -H "Content-Type: application/json" `
  -d '{\"text\":\"I need a 4 page Python ML report due tomorrow ASAP\",\"user_id\":\"507f1f77bcf86cd799439011\"}'

Start-Sleep -Seconds 1

# Test 2: Register User
Write-Host "

[2/5] Testing User Registration..." -ForegroundColor Yellow
curl -X POST http://localhost:8080/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"pass123\",\"role\":\"buyer\"}'

Start-Sleep -Seconds 1

# Test 3: Get All Assignments
Write-Host "

[3/5] Testing Get Assignments..." -ForegroundColor Yellow
curl -X GET http://localhost:8080/api/assignments

Start-Sleep -Seconds 1

# Test 4: Get All Users
Write-Host "

[4/5] Testing Get Users..." -ForegroundColor Yellow
curl -X GET http://localhost:8080/api/users

Start-Sleep -Seconds 1

# Test 5: Get Top Buyers
Write-Host "

[5/5] Testing Get Top Buyers..." -ForegroundColor Yellow
curl -X GET http://localhost:8080/api/buyers/top

Write-Host "

=== All Tests Completed ===" -ForegroundColor Green
Write-Host "For full test suite, run: .\API_TESTS.ps1
" -ForegroundColor Cyan
