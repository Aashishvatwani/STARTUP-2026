package controllers

import (
	"context"
	"net/http"
	"time"

	"github.com/Aashishvatwani/homeworld/config"
	"github.com/Aashishvatwani/homeworld/models"
	"github.com/Aashishvatwani/homeworld/utils"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// POST /api/assignments/complete
// Body: { "assignmentId": "<hex>", "completedBy": "<userId - optional>" }
func AssignmentCompleted(c *gin.Context) {
	var req struct {
		AssignmentID string `json:"assignmentId" binding:"required"`
		CompletedBy  string `json:"completedBy"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignmentObjID, err := primitive.ObjectIDFromHex(req.AssignmentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	assignmentCollection := config.DB.Collection("assignments")
	paymentCollection := config.DB.Collection("payments")

	// Load assignment
	var assignment models.Assignment
	if err := assignmentCollection.FindOne(ctx, bson.M{"_id": assignmentObjID}).Decode(&assignment); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
		return
	}

	if assignment.Status == "completed" || assignment.Status == "Completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "assignment already completed"})
		return
	}

	// Find a paid payment for this assignment
	var payment models.Payment
	err = paymentCollection.FindOne(ctx, bson.M{"assignmentId": assignmentObjID, "status": "paid"}).Decode(&payment)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no paid payment found for assignment; cannot release funds"})
		return
	}

	// If payment was made via bank (Razorpay), payout to solver via payouts; otherwise use on-chain release
	userCollection := config.DB.Collection("users")
	var buyer models.User
	var solver models.User
	_ = userCollection.FindOne(ctx, bson.M{"_id": payment.BuyerID}).Decode(&buyer)
	_ = userCollection.FindOne(ctx, bson.M{"_id": payment.SolverID}).Decode(&solver)

	if payment.PaymentMethod == "bank" || payment.PaymentMethod == "razorpay" {
		// Perform payout to solver using Razorpay Payouts (mocked util)
		payoutInfo := map[string]string{
			"accountHolderName": solver.Payout.AccountHolderName,
			"accountNumber":     solver.Payout.AccountNumber,
			"ifsc":              solver.Payout.IFSC,
			"bankName":          solver.Payout.BankName,
			"upi":               solver.Payout.UPI,
		}

		payoutID, err := utils.CreateRazorpayPayout(payment.SolverAmount, "INR", payoutInfo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create payout: " + err.Error()})
			return
		}

		// Update payment: mark released and attach payout id
		updatePayment := bson.M{"$set": bson.M{
			"status":           "released",
			"razorpayPayoutId": payoutID,
			"payoutStatus":     "initiated",
			"releasedAt":       time.Now(),
		}}
		if _, err := paymentCollection.UpdateOne(ctx, bson.M{"_id": payment.ID}, updatePayment); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update payment record"})
			return
		}

		// Update assignment status to completed
		_, err = assignmentCollection.UpdateOne(ctx, bson.M{"_id": assignmentObjID}, bson.M{"$set": bson.M{"status": "completed"}})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update assignment status"})
			return
		}

		// Send notifications
		go CreateBuyerNotification(payment.BuyerID, models.NotifTypeAssignmentCompleted, "Assignment Completed", "Your assignment has been marked complete and funds have been released to the solver.", assignmentObjID, "assignment", models.PriorityHigh)
		go CreateSolverNotification(payment.SolverID, models.NotifTypeAssignmentCompleted, "Assignment Completed", "Assignment completed — payout has been initiated to your account.", assignmentObjID, "assignment", models.PriorityHigh)

		c.JSON(http.StatusOK, gin.H{
			"message":       "assignment marked completed and payout initiated",
			"assignment_id": assignmentObjID.Hex(),
			"payment_id":    payment.ID.Hex(),
			"payout_id":     payoutID,
		})
		return
	}

	// Otherwise assume on-chain escrow release
	buyerAddr := ""
	solverAddr := ""
	if buyer.EthereumAddress != "" {
		buyerAddr = buyer.EthereumAddress
	}
	if solver.EthereumAddress != "" {
		solverAddr = solver.EthereumAddress
	}

	// Step 1: Mark assignment as completed on-chain (required before release)
	_, err = utils.MarkAssignmentComplete(assignmentObjID.Hex(), solverAddr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to mark assignment completed on-chain: " + err.Error()})
		return
	}

	// Wait a moment for the transaction to be mined (optional but safer)
	time.Sleep(3 * time.Second)

	// Step 2: Release payment to solver and platform
	txHash, err := utils.ReleaseEscrowPayment(assignmentObjID.Hex(), buyerAddr, solverAddr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to release escrow: " + err.Error()})
		return
	}

	// Update payment: mark released and attach transaction hash
	updatePayment := bson.M{"$set": bson.M{
		"status":          "released",
		"transactionHash": txHash,
		"paidAt":          time.Now(),
	}}
	if _, err := paymentCollection.UpdateOne(ctx, bson.M{"_id": payment.ID}, updatePayment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update payment record"})
		return
	}

	// Update assignment status to completed
	_, err = assignmentCollection.UpdateOne(ctx, bson.M{"_id": assignmentObjID}, bson.M{"$set": bson.M{"status": "completed"}})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update assignment status"})
		return
	}

	// Send notifications to buyer and solver
	go CreateBuyerNotification(payment.BuyerID, models.NotifTypeAssignmentCompleted, "Assignment Completed", "Your assignment has been marked complete and funds have been released to the solver.", assignmentObjID, "assignment", models.PriorityHigh)
	go CreateSolverNotification(payment.SolverID, models.NotifTypeAssignmentCompleted, "Assignment Completed", "Assignment completed — funds have been released to your account.", assignmentObjID, "assignment", models.PriorityHigh)

	// Return updated status
	c.JSON(http.StatusOK, gin.H{
		"message":          "assignment marked completed and funds released",
		"assignment_id":    assignmentObjID.Hex(),
		"payment_id":       payment.ID.Hex(),
		"transaction_hash": txHash,
	})
}
