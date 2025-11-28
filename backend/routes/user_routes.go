package routes

import (
	"github.com/Aashishvatwani/homeworld/controllers"
	"github.com/gin-gonic/gin"
)

func UserRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/auth/register", controllers.RegisterUser)
		api.POST("/auth/login", controllers.LoginUser)
		api.GET("/users", controllers.GetAllUsers)
		api.GET("/users/:id", controllers.GetUser)
		// Accept both `/users/:id/update` and `/users/:id` for PUT to remain
		// compatible with frontend code that may hit either path.
		api.PUT("/users/:id/update", controllers.UpdateUser)
		api.PUT("/users/:id", controllers.UpdateUser)
		api.GET("/buyers/top", controllers.GetTopBuyers)
	}
}
