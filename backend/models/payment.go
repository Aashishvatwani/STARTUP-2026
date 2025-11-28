package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Payment struct {
	ID                primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	AssignmentID      primitive.ObjectID `bson:"assignmentId" json:"assignmentId"`
	BuyerID           primitive.ObjectID `bson:"buyerId" json:"buyerId"`
	SolverID          primitive.ObjectID `bson:"solverId" json:"solverId"`
	Amount            float64            `bson:"amount" json:"amount"`
	Status            string             `bson:"status" json:"status"`               // "pending", "paid", "failed", "refunded"
	PaymentMethod     string             `bson:"paymentMethod" json:"paymentMethod"` // "razorpay", "crypto"
	RazorpayOrderID   string             `bson:"razorpayOrderId" json:"razorpayOrderId"`
	RazorpayPaymentID string             `bson:"razorpayPaymentId" json:"razorpayPaymentId"`
	TransactionHash   string             `bson:"transactionHash" json:"transactionHash"` // For blockchain
	// On-chain tracking fields
	OnchainDepositTx string    `bson:"onchainDepositTx,omitempty" json:"onchainDepositTx,omitempty"`
	OnchainEscrowTx  string    `bson:"onchainEscrowTx,omitempty" json:"onchainEscrowTx,omitempty"`
	OnchainConfirmed bool      `bson:"onchainConfirmed,omitempty" json:"onchainConfirmed,omitempty"`
	Commission       float64   `bson:"commission" json:"commission"`     // Platform fee (10%)
	SolverAmount     float64   `bson:"solverAmount" json:"solverAmount"` // Amount after commission
	CreatedAt        time.Time `bson:"createdAt" json:"createdAt"`
	PaidAt           time.Time `bson:"paidAt" json:"paidAt"`
	// Payout tracking for fiat/bank flow
	RazorpayPayoutID string    `bson:"razorpayPayoutId,omitempty" json:"razorpayPayoutId,omitempty"`
	PayoutStatus     string    `bson:"payoutStatus,omitempty" json:"payoutStatus,omitempty"` // e.g., pending, success, failed
	ReleasedAt       time.Time `bson:"releasedAt,omitempty" json:"releasedAt,omitempty"`
}

type RazorpayOrder struct {
	OrderID  string  `json:"order_id"`
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
}

type RazorpayVerification struct {
	OrderID   string `json:"order_id"`
	PaymentID string `json:"payment_id"`
	Signature string `json:"signature"`
}
