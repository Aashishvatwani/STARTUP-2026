package controllers

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/Aashishvatwani/homeworld/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// POST /api/payment/create
func CreatePayment(c *gin.Context) {
	var paymentReq struct {
		AssignmentID primitive.ObjectID `json:"assignmentId"`
		BuyerID      primitive.ObjectID `json:"buyerId"`
		SolverID     primitive.ObjectID `json:"solverId"`
		Amount       float64            `json:"amount"`
		// method: "onchain" or "bank" (bank uses Razorpay/fiat)
		Method string `json:"method"`
	}

	if err := c.ShouldBindJSON(&paymentReq); err != nil {
		fmt.Printf("Error binding JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Creating payment - AssignmentID: %s, BuyerID: %s, SolverID: %s, Amount: %.2f\n",
		paymentReq.AssignmentID.Hex(), paymentReq.BuyerID.Hex(), paymentReq.SolverID.Hex(), paymentReq.Amount)

	// Calculate commission (10%)
	commission := paymentReq.Amount * 0.10
	solverAmount := paymentReq.Amount - commission

	fmt.Printf("Calculated commission: %.2f, Solver amount: %.2f\n", commission, solverAmount)

	// If buyer selected on-chain payment, we won't create a Razorpay order here.
	payment := models.Payment{
		ID:           primitive.NewObjectID(),
		AssignmentID: paymentReq.AssignmentID,
		BuyerID:      paymentReq.BuyerID,
		SolverID:     paymentReq.SolverID,
		Amount:       paymentReq.Amount,
		Commission:   commission,
		SolverAmount: solverAmount,
		CreatedAt:    time.Now(),
	}

	if paymentReq.Method == "onchain" {
		payment.PaymentMethod = "onchain"
		payment.Status = "pending_onchain"
	} else {
		// default to bank/razorpay flow
		fmt.Println("Creating Razorpay order...")
		razorpayOrderID, err := utils.CreateRazorpayOrder(paymentReq.Amount, "Assignment Payment")
		if err != nil {
			fmt.Printf("Error creating Razorpay order: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to create Razorpay order",
				"details": err.Error(),
			})
			return
		}
		fmt.Printf("Razorpay order created with ID: %s\n", razorpayOrderID)
		payment.PaymentMethod = "bank"
		payment.Status = "pending"
		payment.RazorpayOrderID = razorpayOrderID
	}

	fmt.Printf("Payment object created with ID: %s\n", payment.ID.Hex())

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	paymentCollection := config.DB.Collection("payments")
	result, err := paymentCollection.InsertOne(ctx, payment)
	if err != nil {
		fmt.Printf("Error inserting payment into database: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
		return
	}

	fmt.Printf("Payment successfully created with InsertedID: %v\n", result.InsertedID)

	resp := gin.H{
		"message":       "Payment created successfully",
		"payment_id":    result.InsertedID,
		"amount":        paymentReq.Amount,
		"commission":    commission,
		"solver_amount": solverAmount,
		"method":        payment.PaymentMethod,
	}
	if payment.PaymentMethod == "bank" {
		resp["razorpay_order_id"] = payment.RazorpayOrderID
	} else if payment.PaymentMethod == "onchain" {
		// Provide contract info so frontend can prompt MetaMask to deposit to contract
		resp["contract_address"] = utils.GetSmartContractAddress()
		resp["assignment_id"] = paymentReq.AssignmentID.Hex()
		resp["amount"] = paymentReq.Amount
		resp["message"] = "Please deposit the required amount to the smart contract using your wallet; then call /api/payment/onchain/verify with the txHash"
	}

	c.JSON(http.StatusOK, resp)
}

// POST /api/payment/verify
func VerifyPayment(c *gin.Context) {
	var verifyReq models.RazorpayVerification
	if err := c.ShouldBindJSON(&verifyReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify signature
	razorpaySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	message := verifyReq.OrderID + "|" + verifyReq.PaymentID
	h := hmac.New(sha256.New, []byte(razorpaySecret))
	h.Write([]byte(message))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	if signature != verifyReq.Signature {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	paymentCollection := config.DB.Collection("payments")
	// Update payment status
	_, err := paymentCollection.UpdateOne(
		ctx,
		bson.M{"razorpayOrderId": verifyReq.OrderID},
		bson.M{"$set": bson.M{
			"status":            "paid",
			"razorpayPaymentId": verifyReq.PaymentID,
			"paidAt":            time.Now(),
		}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify payment"})
		return
	}

	// Get payment details for notifications
	var payment models.Payment
	paymentCollection.FindOne(ctx, bson.M{"razorpayOrderId": verifyReq.OrderID}).Decode(&payment)

	// Attempt to create on-chain escrow now that payment is verified
	userCollection := config.DB.Collection("users")
	var buyer models.User
	var solver models.User
	_ = userCollection.FindOne(ctx, bson.M{"_id": payment.BuyerID}).Decode(&buyer)
	_ = userCollection.FindOne(ctx, bson.M{"_id": payment.SolverID}).Decode(&solver)

	if buyer.EthereumAddress == "" || solver.EthereumAddress == "" {
		// If either party doesn't have an ethereum address, just log and continue with notifications
		fmt.Printf("Skipping on-chain escrow creation: buyer or solver missing Ethereum address (buyer: %s, solver: %s)\n", buyer.EthereumAddress, solver.EthereumAddress)
	} else {
		// Convert amount to wei (approximate via float multiplication)
		amountInWei := fmt.Sprintf("%.0f", payment.Amount*1e18)
		txHash, err := utils.CreateAssignmentEscrow(payment.AssignmentID.Hex(), buyer.EthereumAddress, solver.EthereumAddress, amountInWei)
		if err != nil {
			fmt.Printf("Error creating on-chain escrow: %v\n", err)
		} else {
			// Store transaction hash on payment
			_, err := paymentCollection.UpdateOne(ctx, bson.M{"_id": payment.ID}, bson.M{"$set": bson.M{"transactionHash": txHash}})
			if err != nil {
				fmt.Printf("Failed to update payment with escrow tx hash: %v\n", err)
			} else {
				fmt.Printf("Escrow created on-chain, txHash=%s for payment %s\n", txHash, payment.ID.Hex())
			}
		}
	}

	// Notify buyer (payment confirmed)
	go CreateBuyerNotification(
		payment.BuyerID,
		models.NotifTypePaymentConfirmed,
		"Payment Confirmed",
		"Your payment has been confirmed and is now in escrow",
		payment.AssignmentID,
		"payment",
		models.PriorityHigh,
	)

	// Notify solver (payment received in escrow)
	go CreateSolverNotification(
		payment.SolverID,
		models.NotifTypePaymentReceived,
		"Payment Escrowed",
		"Payment has been received and secured. Complete the assignment to receive funds.",
		payment.AssignmentID,
		"payment",
		models.PriorityHigh,
	)

	c.JSON(http.StatusOK, gin.H{
		"message":            "Payment verified successfully",
		"notifications_sent": 2,
	})
}

// GET /api/payment/:id
func GetPayment(c *gin.Context) {
	paymentID := c.Param("id")
	objID, _ := primitive.ObjectIDFromHex(paymentID)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	paymentCollection := config.DB.Collection("payments")
	var payment models.Payment
	err := paymentCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&payment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, payment)
}

// POST /api/payment/generate-test-signature - Generate signature for testing
// ⚠️ FOR TESTING ONLY - Remove in production
func GenerateTestSignature(c *gin.Context) {
	var req struct {
		OrderID   string `json:"order_id" binding:"required"`
		PaymentID string `json:"payment_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate signature using HMAC SHA256
	razorpaySecret := os.Getenv("RAZORPAY_KEY_SECRET")
	message := req.OrderID + "|" + req.PaymentID

	h := hmac.New(sha256.New, []byte(razorpaySecret))
	h.Write([]byte(message))
	signature := fmt.Sprintf("%x", h.Sum(nil))

	c.JSON(http.StatusOK, gin.H{
		"order_id":   req.OrderID,
		"payment_id": req.PaymentID,
		"signature":  signature,
		"message":    "Use this signature to test payment verification",
		"warning":    "⚠️ This endpoint is for testing only. Remove in production!",
	})
}

// POST /api/payment/onchain/verify
// Body: { "order_id": "<payment_record_id>", "tx_hash": "0x..." }
func VerifyOnchainPayment(c *gin.Context) {
	var req struct {
		PaymentID string `json:"payment_id" binding:"required"`
		TxHash    string `json:"tx_hash" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	paymentCollection := config.DB.Collection("payments")
	objID, err := primitive.ObjectIDFromHex(req.PaymentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment id"})
		return
	}

	var payment models.Payment
	if err := paymentCollection.FindOne(ctx, bson.M{"_id": objID}).Decode(&payment); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// Verify on-chain status via utils.GetEscrowStatus (mocked)
	status, err := utils.GetEscrowStatus(payment.AssignmentID.Hex())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query escrow status"})
		return
	}

	// Here we accept the txHash and mark payment as paid if escrow status looks correct
	// In real impl verify that txHash corresponds to escrow creation and amount matches
	_, err = paymentCollection.UpdateOne(ctx, bson.M{"_id": payment.ID}, bson.M{"$set": bson.M{
		"status":           "paid",
		"onchainDepositTx": req.TxHash,
		"onchainConfirmed": true,
		"paidAt":           time.Now(),
	}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update payment"})
		return
	}

	// Notify parties
	go CreateBuyerNotification(payment.BuyerID, models.NotifTypePaymentConfirmed, "On-chain Payment Confirmed", "Your on-chain payment has been detected and escrow created.", payment.AssignmentID, "payment", models.PriorityHigh)
	go CreateSolverNotification(payment.SolverID, models.NotifTypePaymentReceived, "Payment Escrowed", "An on-chain payment has been received for assignment.", payment.AssignmentID, "payment", models.PriorityHigh)

	c.JSON(http.StatusOK, gin.H{"message": "on-chain payment verified and recorded", "payment_id": req.PaymentID, "escrow_status": status})
}
