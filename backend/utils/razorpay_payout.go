package utils

import (
	"fmt"
	"os"
	"time"
)

// CreateRazorpayPayout is a placeholder/simplified helper to payout a solver using Razorpay Payouts.
// For now this returns a mocked payout ID. To enable real payouts set RAZORPAY_PAYOUT_ENABLED=true
// and implement the API calls to Razorpay Contacts/Beneficiaries and Payouts.
func CreateRazorpayPayout(amount float64, currency string, payoutInfo map[string]string) (string, error) {
	// amount is expected in rupees (INR) as float. Razorpay requires paise (integer).
	// This mock simply returns a generated payout id.
	if os.Getenv("RAZORPAY_PAYOUT_ENABLED") != "true" {
		mockID := fmt.Sprintf("payout_mock_%d", time.Now().Unix())
		fmt.Printf("[razorpay_payout] Mock payout created: %s (amount=%.2f %s) beneficiary=%v\n", mockID, amount, currency, payoutInfo)
		return mockID, nil
	}

	// TODO: Implement real Razorpay Payouts integration here.
	// Steps (high level):
	// 1. Create contact (POST /v1/contacts) with buyer/solver details
	// 2. Create beneficiary (POST /v1/beneficiaries)
	// 3. Create payout (POST /v1/payouts) with beneficiary_id and amount in paise
	// 4. Return payout id and handle error codes

	return "", fmt.Errorf("razorpay payouts enabled but not implemented")
}
