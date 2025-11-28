package routes

import (
	"github.com/Aashishvatwani/homeworld/controllers"
	"github.com/gin-gonic/gin"
)

func ContractTestRoutes(r *gin.Engine) {
	api := r.Group("/api/contract")
	{
		// Test endpoints for smart contract integration
		api.POST("/test-create-escrow", controllers.TestCreateEscrow)
		api.GET("/test-get-status/:assignmentId", controllers.TestGetEscrowStatus)
		api.POST("/test-mark-completed", controllers.TestMarkCompleted)
		api.POST("/test-release-payment", controllers.TestReleasePayment)
		api.POST("/test-refund", controllers.TestRefundPayment)
	}
}
