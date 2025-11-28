package routes

import (
	"github.com/Aashishvatwani/homeworld/controllers"
	"github.com/gin-gonic/gin"
)

func ChatRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/chat/create", controllers.CreateChat)
		api.POST("/chat/:id/message", controllers.SendMessage)
		api.GET("/chat/:id", controllers.GetChat)
		api.PUT("/chat/:id/price", controllers.NegotiatePrice)
		// Migration helper endpoint
		api.POST("/chat/fix-messages", controllers.FixChatMessages)
	}
}
