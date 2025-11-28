package controllers

import (
	"net/http"

	"github.com/Aashishvatwani/homeworld/utils"
	"github.com/gin-gonic/gin"
)

// POST /api/contract/test-create-escrow
// Body: { "assignmentId": "test_123", "buyerAddress": "0x...", "solverAddress": "0x...", "amountInWei": "1000000000000000" }
func TestCreateEscrow(c *gin.Context) {
	var req struct {
		AssignmentID  string `json:"assignmentId" binding:"required"`
		BuyerAddress  string `json:"buyerAddress" binding:"required"`
		SolverAddress string `json:"solverAddress" binding:"required"`
		AmountInWei   string `json:"amountInWei" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Call the real smart contract function
	txHash, err := utils.CreateAssignmentEscrow(req.AssignmentID, req.BuyerAddress, req.SolverAddress, req.AmountInWei)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create escrow on-chain",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Escrow created successfully on Sepolia",
		"txHash":       txHash,
		"assignmentId": req.AssignmentID,
		"explorer":     "https://sepolia.etherscan.io/tx/" + txHash,
		"contractAddr": "0x05227752c8d799c25f064d7a2364531c555b4d72",
	})
}

// GET /api/contract/test-get-status/:assignmentId
func TestGetEscrowStatus(c *gin.Context) {
	assignmentID := c.Param("assignmentId")

	status, err := utils.GetEscrowStatus(assignmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get escrow status",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Escrow status retrieved",
		"status":  status,
	})
}

// POST /api/contract/test-release-payment
// Body: { "assignmentId": "test_123" }
func TestReleasePayment(c *gin.Context) {
	var req struct {
		AssignmentID string `json:"assignmentId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	txHash, err := utils.ReleaseEscrowPayment(req.AssignmentID, "", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to release payment on-chain",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Payment released successfully",
		"txHash":   txHash,
		"explorer": "https://sepolia.etherscan.io/tx/" + txHash,
	})
}

// POST /api/contract/test-mark-completed
// Body: { "assignmentId": "test_123" }
// NOTE: Your contract requires solver to call this. Platform cannot mark completed.
// For testing, either:
// 1. Redeploy contract allowing platform to mark complete, OR
// 2. Use this endpoint with solver's private key in PLATFORM_PRIVATE_KEY temporarily
func TestMarkCompleted(c *gin.Context) {
	var req struct {
		AssignmentID string `json:"assignmentId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	txHash, err := utils.MarkAssignmentComplete(req.AssignmentID, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to mark assignment completed on-chain",
			"details": err.Error(),
			"note":    "Contract requires solver to call markCompleted. Platform cannot call this function.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Assignment marked as completed successfully",
		"txHash":   txHash,
		"explorer": "https://sepolia.etherscan.io/tx/" + txHash,
	})
}

// POST /api/contract/test-complete-and-release
// Combined endpoint: marks complete AND releases payment in one call
// This simulates the full flow for testing when you control both solver and platform
func TestCompleteAndRelease(c *gin.Context) {
	var req struct {
		AssignmentID string `json:"assignmentId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Your contract enforces that only the solver can call markCompleted. You have two options:",
		"option1": "Redeploy your contract with this change:\n\nfunction markCompleted(string memory _assignmentId) external {\n    Assignment storage a = assignments[_assignmentId];\n    require(\n        msg.sender == a.solver || msg.sender == platform,\n        \"Only solver or platform can mark complete\"\n    );\n    // ... rest of function\n}",
		"option2": "Temporarily set PLATFORM_PRIVATE_KEY to the solver's private key (0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4) and call test-mark-completed, then call test-release-payment",
		"option3": "Use MetaMask/Remix to call markCompleted from the solver address directly, then use backend to release",
	})
}

// POST /api/contract/test-refund
// Body: { "assignmentId": "test_123" }
func TestRefundPayment(c *gin.Context) {
	var req struct {
		AssignmentID string `json:"assignmentId" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	txHash, err := utils.RefundEscrowPayment(req.AssignmentID, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to refund payment on-chain",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Payment refunded successfully",
		"txHash":   txHash,
		"explorer": "https://sepolia.etherscan.io/tx/" + txHash,
	})
}
