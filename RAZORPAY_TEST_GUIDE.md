# 🔐 Razorpay Payment Signature Verification Testing Guide

## Overview
This guide shows you how to test Razorpay payment signature verification in your Assignment Solver Platform.

## How Razorpay Signature Works

Razorpay generates a signature using **HMAC SHA256**:
```
signature = HMAC_SHA256(order_id + "|" + payment_id, razorpay_key_secret)
```

---

## Method 1: Using Test Signature Generator Endpoint ✅ (Recommended)

### Step 1: Create a Payment

```powershell
$paymentResponse = curl -X POST http://localhost:8080/api/payment/create `
  -H "Content-Type: application/json" `
  -d '{
    "assignmentId": "YOUR_ASSIGNMENT_ID",
    "buyerId": "YOUR_BUYER_ID",
    "solverId": "YOUR_SOLVER_ID",
    "amount": 500
  }' | ConvertFrom-Json

$orderID = $paymentResponse.razorpay_order_id
Write-Host "Order ID: $orderID"
```

### Step 2: Simulate Razorpay Payment (Use Test Payment ID)

```powershell
$testPaymentID = "pay_TEST123456789"
```

### Step 3: Generate Valid Signature Using Test Endpoint

```powershell
$signatureResponse = curl -X POST http://localhost:8080/api/payment/generate-test-signature `
  -H "Content-Type: application/json" `
  -d "{
    `"order_id`": `order_Rbf7TelmXOX5yV",
    `"payment_id`": "pay_TEST123456789"
  }" | ConvertFrom-Json

$signature = $signatureResponse.signature
Write-Host "Generated Signature: $signature"
```

### Step 4: Verify the Payment

```powershell
curl -X POST http://localhost:8080/api/payment/verify `
  -H "Content-Type: application/json" `
  -d "{
  
   "order_id": "order_Rbf7TelmXOX5yV",
    "payment_id": "pay_TEST123456789",
    "signature": "31710ca01bf3b06a22f4381f4948fce995594a5b4c77ebf914fb310515702ff6",
  }"
```

**Expected Response:**
```json
{
  "message": "Payment verified successfully",
  "assignment_status": "completed",
  "payment_released": true
}
```

---

## Method 2: Manual Signature Generation (PowerShell)

If you want to generate signatures manually:

```powershell
# Your Razorpay credentials from .env
$razorpaySecret = "YOUR_RAZORPAY_KEY_SECRET"  # From .env file
$orderID = "order_MHZ2vGAbCdEfGh"
$paymentID = "pay_MHZ3wXYzAbCdEf"

# Generate signature
$message = "$orderID|$paymentID"
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($razorpaySecret)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($message))
$signature = [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()

Write-Host "Signature: $signature"

# Now verify
curl -X POST http://localhost:8080/api/payment/verify `
  -H "Content-Type: application/json" `
  -d "{
    `"order_id`": `"$orderID`",
    `"payment_id`": `"$paymentID`",
    `"signature`": `"$signature`"
  }"
```

---

## Method 3: Complete Test Flow (Automated)

```powershell
# Complete Razorpay payment test flow
$BASE_URL = "http://localhost:8080/api"

# 1. Get users and assignment
$users = curl -X GET $BASE_URL/users | ConvertFrom-Json
$assignments = curl -X GET $BASE_URL/assignments | ConvertFrom-Json

$buyerId = $users[0].id
$solverId = $users[1].id
$assignmentId = $assignments[0].id

Write-Host "Testing Razorpay Payment Flow..." -ForegroundColor Green

# 2. Create payment
Write-Host "`n1. Creating payment..." -ForegroundColor Yellow
$paymentResponse = curl -X POST $BASE_URL/payment/create `
  -H "Content-Type: application/json" `
  -d "{`"assignmentId`":`"$assignmentId`",`"buyerId`":`"$buyerId`",`"solverId`":`"$solverId`",`"amount`":500}" `
  | ConvertFrom-Json

$orderID = $paymentResponse.razorpay_order_id
Write-Host "Order ID: $orderID" -ForegroundColor Cyan

# 3. Simulate Razorpay payment (in real app, this comes from Razorpay frontend SDK)
$testPaymentID = "pay_TEST$(Get-Random)"
Write-Host "`n2. Simulated Payment ID: $testPaymentID" -ForegroundColor Yellow

# 4. Generate valid signature
Write-Host "`n3. Generating signature..." -ForegroundColor Yellow
$signatureResponse = curl -X POST $BASE_URL/payment/generate-test-signature `
  -H "Content-Type: application/json" `
  -d "{`"order_id`":`"$orderID`",`"payment_id`":`"$testPaymentID`"}" `
  | ConvertFrom-Json

$signature = $signatureResponse.signature
Write-Host "Signature: $signature" -ForegroundColor Cyan

# 5. Verify payment
Write-Host "`n4. Verifying payment..." -ForegroundColor Yellow
curl -X POST $BASE_URL/payment/verify `
  -H "Content-Type: application/json" `
  -d "{`"order_id`":`"$orderID`",`"payment_id`":`"$testPaymentID`",`"signature`":`"$signature`"}"

Write-Host "`n✅ Payment verification test completed!" -ForegroundColor Green
```

---

## Test Cases

### ✅ Valid Signature Test
```powershell
# Generate valid signature and verify
$sig = curl -X POST http://localhost:8080/api/payment/generate-test-signature `
  -d '{"order_id":"order_123","payment_id":"pay_456"}' | ConvertFrom-Json

curl -X POST http://localhost:8080/api/payment/verify `
  -d "{`"order_id`":`"order_123`",`"payment_id`":`"pay_456`",`"signature`":`"$($sig.signature)`"}"
```
**Expected:** ✅ `200 OK` - Payment verified

### ❌ Invalid Signature Test
```powershell
curl -X POST http://localhost:8080/api/payment/verify `
  -H "Content-Type: application/json" `
  -d '{
    "order_id": "order_123",
    "payment_id": "pay_456",
    "signature": "invalid_signature_xyz123"
  }'
```
**Expected:** ❌ `401 Unauthorized` - Invalid signature

### ❌ Missing Payment Test
```powershell
curl -X POST http://localhost:8080/api/payment/verify `
  -H "Content-Type: application/json" `
  -d '{
    "order_id": "order_NONEXISTENT",
    "payment_id": "pay_456",
    "signature": "some_signature"
  }'
```
**Expected:** ❌ `404 Not Found` - Payment not found

---

## Production Integration

### In Production, Remove Test Endpoint

In `routes/payment_routes.go`, remove or comment out:
```go
// api.POST("/payment/generate-test-signature", controllers.GenerateTestSignature)
```

### Frontend Integration (React/Next.js Example)

```javascript
// 1. Create payment on backend
const createPayment = async () => {
  const response = await fetch('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assignmentId: assignmentId,
      buyerId: userId,
      solverId: solverId,
      amount: 500
    })
  });
  const data = await response.json();
  return data.razorpay_order_id;
};

// 2. Initialize Razorpay checkout
const handlePayment = async () => {
  const orderId = await createPayment();
  
  const options = {
    key: 'YOUR_RAZORPAY_KEY_ID',
    amount: 50000, // Amount in paise (500 INR)
    currency: 'INR',
    order_id: orderId,
    name: 'Assignment Solver',
    description: 'Assignment Payment',
    handler: async function(response) {
      // 3. Verify payment on backend
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature  // Razorpay generates this
        })
      });
      
      if (verifyResponse.ok) {
        alert('Payment successful!');
      }
    }
  };
  
  const razorpay = new Razorpay(options);
  razorpay.open();
};
```

---

## Troubleshooting

### Issue: "Invalid signature"
- **Check:** Your `RAZORPAY_KEY_SECRET` in `.env` matches the one in Razorpay dashboard
- **Verify:** The signature format is lowercase hex (no hyphens)

### Issue: "Payment not found"
- **Check:** The order ID exists in your database
- **Verify:** You created the payment before verifying

### Issue: Test endpoint not working
- **Check:** Server is running: `go run main.go`
- **Verify:** Route is registered in `payment_routes.go`

---

## Security Notes

⚠️ **IMPORTANT:**
1. **Never expose your `RAZORPAY_KEY_SECRET`** in frontend code
2. **Always verify signatures on the backend** (never trust frontend)
3. **Remove test signature generator endpoint** before production deployment
4. Use Razorpay's test mode keys during development

---

## Quick Test Script

Save this as `test_razorpay.ps1`:

```powershell
$BASE_URL = "http://localhost:8080/api"

# Test data
$orderID = "order_TEST123"
$paymentID = "pay_TEST456"

# Generate signature
$sig = curl -X POST $BASE_URL/payment/generate-test-signature `
  -H "Content-Type: application/json" `
  -d "{`"order_id`":`"$orderID`",`"payment_id`":`"$paymentID`"}" `
  | ConvertFrom-Json

Write-Host "Generated Signature: $($sig.signature)" -ForegroundColor Green

# Verify with valid signature
Write-Host "`nTesting VALID signature..." -ForegroundColor Yellow
curl -X POST $BASE_URL/payment/verify `
  -H "Content-Type: application/json" `
  -d "{`"order_id`":`"$orderID`",`"payment_id`":`"$paymentID`",`"signature`":`"$($sig.signature)`"}"

# Verify with invalid signature
Write-Host "`nTesting INVALID signature..." -ForegroundColor Yellow
curl -X POST $BASE_URL/payment/verify `
  -H "Content-Type: application/json" `
  -d '{\"order_id\":\"order_TEST123\",\"payment_id\":\"pay_TEST456\",\"signature\":\"invalid_sig\"}'

Write-Host "`n✅ Tests completed!" -ForegroundColor Green
```

Run: `.\test_razorpay.ps1`

---

## References

- [Razorpay Payment Verification](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/verify-payment/)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
