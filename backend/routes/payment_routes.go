package routes

import (
	"github.com/Aashishvatwani/homeworld/controllers"
	"github.com/gin-gonic/gin"
)

func PaymentRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/payment/create", controllers.CreatePayment)
		api.POST("/payment/verify", controllers.VerifyPayment)
		api.GET("/payment/:id", controllers.GetPayment)
		// Test helper endpoint (remove in production)
		api.POST("/payment/generate-test-signature", controllers.GenerateTestSignature)
	}
}
