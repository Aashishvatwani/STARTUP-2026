package utils

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// CreateRazorpayOrder creates a Razorpay order for payment
func CreateRazorpayOrder(amount float64, description string) (string, error) {
	razorpayKey := os.Getenv("RAZORPAY_KEY_ID")
	razorpaySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	// Convert amount to paise (1 INR = 100 paise)
	amountPaise := int64(amount * 100)
	fmt.Printf("Creating Razorpay order - Amount: %.2f INR (%d paise), Description: %s\n", amount, amountPaise, description)

	payload := map[string]interface{}{
		"amount":      amountPaise,
		"currency":    "INR",
		"description": description,
	}

	payloadBytes, _ := json.Marshal(payload)
	fmt.Printf("Request payload: %s\n", string(payloadBytes))

	req, err := http.NewRequest("POST", "https://api.razorpay.com/v1/orders", bytes.NewBuffer(payloadBytes))
	if err != nil {
		fmt.Printf("Error creating HTTP request: %v\n", err)
		return "", err
	}

	req.SetBasicAuth(razorpayKey, razorpaySecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error making API request to Razorpay: %v\n", err)
		return "", err
	}
	defer resp.Body.Close()

	fmt.Printf("Razorpay API response status: %d\n", resp.StatusCode)

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Response body: %s\n", string(body))

	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if orderID, ok := result["id"].(string); ok {
		fmt.Printf("Successfully created Razorpay order: %s\n", orderID)
		return orderID, nil
	}

	fmt.Printf("Failed to extract order ID from response\n")
	return "", fmt.Errorf("failed to create Razorpay order")
}

// VerifyRazorpaySignature verifies Razorpay payment signature
func VerifyRazorpaySignature(orderID, paymentID, signature string) bool {
	razorpaySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	message := orderID + "|" + paymentID

	// Create HMAC-SHA256 signature
	h := hmac.New(sha256.New, []byte(razorpaySecret))
	h.Write([]byte(message))
	expectedSignature := fmt.Sprintf("%x", h.Sum(nil))

	return expectedSignature == signature
}

// RefundRazorpayPayment refunds a Razorpay payment
func RefundRazorpayPayment(paymentID string, amount float64) (string, error) {
	razorpayKey := os.Getenv("RAZORPAY_KEY_ID")
	razorpaySecret := os.Getenv("RAZORPAY_KEY_SECRET")

	amountPaise := int64(amount * 100)

	payload := map[string]interface{}{
		"amount": amountPaise,
	}

	payloadBytes, _ := json.Marshal(payload)
	url := fmt.Sprintf("https://api.razorpay.com/v1/payments/%s/refund", paymentID)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(razorpayKey, razorpaySecret)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	if refundID, ok := result["id"].(string); ok {
		return refundID, nil
	}

	return "", fmt.Errorf("failed to refund payment")
}

// GenerateTestSignature generates a valid Razorpay signature for testing
// This is used ONLY for testing purposes
func GenerateTestSignature(orderID, paymentID string) string {
	razorpaySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	message := orderID + "|" + paymentID

	// Create HMAC-SHA256 signature
	h := hmac.New(sha256.New, []byte(razorpaySecret))
	h.Write([]byte(message))
	return fmt.Sprintf("%x", h.Sum(nil))
}
