package routes

import (
	"github.com/Aashishvatwani/homeworld/controllers"
	"github.com/gin-gonic/gin"
)

func NotificationRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		// Send notification
		api.POST("/notifications/send", controllers.SendNotification)

		// Get notifications for a user
		api.GET("/notifications/user/:userId", controllers.GetNotifications)

		// Mark all as read (must come before :id routes)
		api.PUT("/notifications/user/:userId/read-all", controllers.MarkAllNotificationsRead)

		// Mark single notification as read
		api.PUT("/notifications/:id/read", controllers.MarkNotificationRead)

		// Delete notification
		api.DELETE("/notifications/:id", controllers.DeleteNotification)
	}
}
